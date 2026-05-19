// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Plan and conflicts API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { POST as depotPost } from "./[meshId]/depots/route";
import { POST as linkPost } from "./[meshId]/links/route";
import { POST as planPost } from "./[meshId]/plan/route";
import { GET as conflictsGet } from "./[meshId]/conflicts/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

const adminHeaders = { "Content-Type": "application/json", "x-mesh-role": "admin" };

describe("mesh plan and conflicts API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  async function meshWithTwoDepots() {
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name: "Plan Mesh" }),
      }),
    );
    const { mesh } = await createRes.json();
    const d1 = await depotPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/depots`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name: "A", kind: "virtual", root: "/" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    const d2 = await depotPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/depots`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name: "B", kind: "virtual", root: "/" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    const dep1 = (await d1.json()).depot;
    const dep2 = (await d2.json()).depot;
    await linkPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/links`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          sourceDepotId: dep1.id,
          targetDepotId: dep2.id,
          direction: "one_way",
        }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    return mesh;
  }

  it("post_plan_returns_change_set", async () => {
    const mesh = await meshWithTwoDepots();
    const rt = (await import("@/lib/mesh/runtime/mesh-runtime")).getMeshRuntime();
    const record = rt.meshRepository.get(mesh.id)!;
    const depots = record.mesh.depots;
    const { FakeConnector } = await import("@/lib/mesh/connector/fake-connector");
    const src = new FakeConnector();
    src.seedFile("/file.txt", new TextEncoder().encode("x"));
    rt.registerConnector(depots[0].id, src);
    rt.registerConnector(depots[1].id, new FakeConnector());
    const res = await planPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/plan`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          sourceDepotId: depots[0].id,
          targetDepotId: depots[1].id,
          dryRun: true,
        }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.changeSet).toBeDefined();
  });

  it("get_conflicts_returns_list", async () => {
    const mesh = await meshWithTwoDepots();
    const res = await conflictsGet(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: mesh.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.conflicts)).toBe(true);
  });
});
