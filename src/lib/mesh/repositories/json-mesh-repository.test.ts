// [REQ-MESH_PLATFORM]: Persistence round-trip — phase 16

import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { JsonMeshRepository } from "./json-mesh-repository";
import { MeshService } from "../services/mesh-service";
import { DepotService } from "../services/depot-service";
import { isDomainValidationError } from "../domain";
import { addLinkToMesh } from "../services/topology-service";

describe("JsonMeshRepository [IMPL-MESH_PERSISTENCE]", () => {
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
      record.mesh = withLink;
      repo.save(record);

      const repo2 = new JsonMeshRepository(dir);
      const loaded = repo2.get(created.mesh.id)!;
      expect(loaded.mesh.depots).toHaveLength(2);
      expect(loaded.mesh.links).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
