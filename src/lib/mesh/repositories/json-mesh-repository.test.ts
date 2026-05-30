// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: JSON file persistence for MeshRecord[] under MESH_DATA_DIR with in-memory cache and repository factory.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { JsonMeshRepository } from "./json-mesh-repository";
import { MeshService } from "../services/mesh-service";
import { DepotService } from "../services/depot-service";
import { isDomainValidationError } from "../domain";
import { addLinkToMesh } from "../services/topology-service";
import { nextMeshRecordAfterMeshMutation } from "../mesh-record";

describe("JsonMeshRepository [IMPL-MESH_PERSISTENCE]", () => {
  // [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — normalize record, upsert in cache by mesh.id, write full cache array to meshes.json.
  it("save_and_load_mesh", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-persist-"));
    try {
      const repo = new JsonMeshRepository(dir);
      const svc = new MeshService(repo);
      const created = svc.createMesh({ name: "Persisted" });
      expect(isDomainValidationError(created)).toBe(false);
      if (isDomainValidationError(created) || "code" in created) {
        throw new Error("setup");
      }
      const repo2 = new JsonMeshRepository(dir);
      const loaded = repo2.get(created.mesh.id);
      expect(loaded?.mesh.name).toBe("Persisted");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("save_and_load_mesh_with_depots_and_links", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-persist-full-"));
    try {
      const repo = new JsonMeshRepository(dir);
      const meshSvc = new MeshService(repo);
      const depotSvc = new DepotService(repo);
      const created = meshSvc.createMesh({ name: "Full" });
      if (isDomainValidationError(created) || "code" in created) {
        throw new Error("setup");
      }
      const d1 = depotSvc.addDepot(created.mesh.id, {
        name: "A",
        kind: "local",
        root: "/a",
      });
      const d2 = depotSvc.addDepot(created.mesh.id, {
        name: "B",
        kind: "local",
        root: "/b",
      });
      if (isDomainValidationError(d1) || isDomainValidationError(d2) || "code" in d1 || "code" in d2) {
        throw new Error("depots");
      }
      const record = repo.get(created.mesh.id)!;
      const withLink = addLinkToMesh(record.mesh, {
        sourceDepotId: d1.id,
        targetDepotId: d2.id,
        direction: "one_way",
      });
      if (isDomainValidationError(withLink) || "code" in withLink) {
        throw new Error("link");
      }
      const linked = nextMeshRecordAfterMeshMutation(record, withLink);
      repo.save(linked);

      const repo2 = new JsonMeshRepository(dir);
      const loaded = repo2.get(created.mesh.id)!;
      expect(loaded.mesh.depots).toHaveLength(2);
      expect(loaded.mesh.links).toHaveLength(1);
      expect(loaded.mesh.policy.retryMaxAttempts).toBeGreaterThanOrEqual(1);
      expect(loaded.configurationVersion).toBe(4);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("coerces_missing_configuration_version_on_reload", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-cv-coerce-"));
    try {
      const repo = new JsonMeshRepository(dir);
      const meshSvc = new MeshService(repo);
      const created = meshSvc.createMesh({ name: "Legacy" });
      if (isDomainValidationError(created) || "code" in created) {
        throw new Error("setup");
      }
      const filePath = join(dir, "meshes.json");
      const rows = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>[];
      for (const r of rows) {
        delete r.configurationVersion;
      }
      writeFileSync(filePath, JSON.stringify(rows));

      const repo2 = new JsonMeshRepository(dir);
      const loaded = repo2.get(created.mesh.id);
      expect(loaded?.configurationVersion).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("policy_round_trips_via_mesh_service", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-policy-"));
    try {
      const repo = new JsonMeshRepository(dir);
      const meshSvc = new MeshService(repo);
      const created = meshSvc.createMesh({ name: "Policy Mesh" });
      if (isDomainValidationError(created) || "code" in created) {
        throw new Error("setup");
      }
      const basePolicy = created.mesh.policy;
      const patched = meshSvc.updateMeshMetadata(created.mesh.id, {
        policy: { ...basePolicy, deletePolicy: "allow" as const },
      });
      if (isDomainValidationError(patched) || "code" in patched) throw new Error("patch");

      const repo2 = new JsonMeshRepository(dir);
      const loaded = repo2.get(created.mesh.id)!;
      expect(loaded.mesh.policy.deletePolicy).toBe("allow");
      expect(loaded.mesh.policy.retryMaxAttempts).toBe(created.mesh.policy.retryMaxAttempts);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
