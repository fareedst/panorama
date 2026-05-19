// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Integration tests for mesh services and runtime wiring

import { describe, it, expect, beforeEach } from "vitest";
import { FakeConnector } from "../connector/fake-connector";
import { isDomainValidationError } from "../domain";
import { resetMeshRuntime, getMeshRuntime } from "../runtime/mesh-runtime";
import { pathMatchesFilter } from "./policy-service";
import { projectTopologyGraph, validateTopology } from "./topology-service";

describe("IMPL-MESH_RUNTIME mesh services integration [REQ-MESH_PLATFORM]", () => {
  it("runtime_authorize_denies_viewer_create_mesh", () => {
    const rt = getMeshRuntime();
    const result = rt.authorize("viewer", "create_mesh");
    expect(result.allowed).toBe(false);
  });

  beforeEach(() => {
    resetMeshRuntime();
  });

  it("add_depot_to_mesh and topology graph", () => {
    const rt = getMeshRuntime();
    const mesh = rt.meshService.createMesh({ name: "Topo" });
    if (isDomainValidationError(mesh) || "code" in mesh) {
      throw new Error("setup");
    }
    rt.depotService.addDepot(mesh.mesh.id, {
      name: "A",
      kind: "local",
      root: "/a",
    });
    rt.depotService.addDepot(mesh.mesh.id, {
      name: "B",
      kind: "local",
      root: "/b",
    });
    const record = rt.meshRepository.get(mesh.mesh.id)!;
    const updated = {
      ...record.mesh,
      links: [
        {
          id: "link-1",
          sourceDepotId: record.mesh.depots[0].id,
          targetDepotId: record.mesh.depots[1].id,
          direction: "one_way" as const,
        },
      ],
    };
    rt.meshRepository.save({
      ...record,
      mesh: updated,
      updatedAt: new Date().toISOString(),
    });
    const topo = rt.getTopology(mesh.mesh.id)!;
    expect(topo.graph.nodes).toHaveLength(2);
    expect(topo.graph.edges).toHaveLength(1);
  });

  it("fake connector copy via executor", async () => {
    const rt = getMeshRuntime();
    const created = rt.meshService.createMesh({ name: "Sync" });
    if (isDomainValidationError(created) || "code" in created) {
      throw new Error("setup");
    }
    const d1 = rt.depotService.addDepot(created.mesh.id, {
      name: "Src",
      kind: "virtual",
      root: "/",
    });
    const d2 = rt.depotService.addDepot(created.mesh.id, {
      name: "Dst",
      kind: "virtual",
      root: "/",
    });
    if (isDomainValidationError(d1) || isDomainValidationError(d2) || "code" in d1 || "code" in d2) {
      throw new Error("depot setup");
    }
    const srcConn = new FakeConnector();
    const dstConn = new FakeConnector();
    srcConn.seedFile("/file.txt", new TextEncoder().encode("hello"));
    rt.registerConnector(d1.id, srcConn);
    rt.registerConnector(d2.id, dstConn);
    const record = rt.meshRepository.get(created.mesh.id)!;
    record.mesh.links = [
      {
        id: "l1",
        sourceDepotId: d1.id,
        targetDepotId: d2.id,
        direction: "one_way",
      },
    ];
    rt.meshRepository.save(record);
    const plan = rt.generatePlan(created.mesh.id, d1.id, d2.id);
    expect(plan).toBeDefined();
    if (!plan || "allowed" in plan) {
      throw new Error("plan generation failed");
    }
    expect(plan.operations.length).toBeGreaterThan(0);
    const session = rt.sessions.createSession(record.mesh);
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    rt.safety.recordDryRun(created.mesh.id);
    rt.sessions.approvePlan(session.id, plan);
    const runResult = await rt.runApprovedSession(session.id, {
      confirmedDestructive: true,
    });
    expect(runResult).toBe(true);
    const readBack = dstConn.readFile("/file.txt");
    expect(typeof readBack === "object" && readBack !== null && !("code" in readBack)).toBe(true);
  });

  it("exclude_filter_wins_over_include_filter", () => {
    expect(
      pathMatchesFilter("foo.tmp", [
        { pattern: "*", mode: "include" },
        { pattern: "*.tmp", mode: "exclude" },
      ]),
    ).toBe(false);
  });

  it("detect_simple_cycle", () => {
    const mesh = {
      id: "m",
      name: "Cycle",
      tags: [],
      depots: [
        { id: "a", name: "A", kind: "local" as const, root: "/a", accessMode: "read_write" as const },
        { id: "b", name: "B", kind: "local" as const, root: "/b", accessMode: "read_write" as const },
      ],
      links: [
        { id: "l1", sourceDepotId: "a", targetDepotId: "b", direction: "one_way" as const },
        { id: "l2", sourceDepotId: "b", targetDepotId: "a", direction: "one_way" as const },
      ],
      policy: {
        deletePolicy: "never" as const,
        conflictPolicy: "prefer_authoritative" as const,
        retryMaxAttempts: 3,
        verificationMode: "size_mtime" as const,
      },
    };
    const validation = validateTopology(mesh);
    expect(validation.hasCycle).toBe(true);
    const graph = projectTopologyGraph(mesh);
    expect(graph.warnings.length).toBeGreaterThan(0);
  });
});
