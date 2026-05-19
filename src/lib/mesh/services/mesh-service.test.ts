// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: Mesh CRUD unit tests per IMPL-MESH_CRUD-pseudocode

import { describe, it, expect } from "vitest";
import { isDomainValidationError } from "../domain";
import { InMemoryMeshRepository } from "../repositories/memory-mesh-repository";
import { MeshService, type MeshServiceError } from "./mesh-service";

function isServiceError(result: unknown): result is MeshServiceError {
  return (
    typeof result === "object" &&
    result !== null &&
    "code" in result &&
    !isDomainValidationError(result)
  );
}

describe("REQ-MESH_CRUD mesh CRUD [IMPL-MESH_CRUD]", () => {
  it("create_mesh_with_name_and_description", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    const result = svc.createMesh({
      name: "Alpha",
      description: "Test mesh",
    });
    expect(isDomainValidationError(result)).toBe(false);
    if (!isDomainValidationError(result) && !isServiceError(result)) {
      expect(result.mesh.name).toBe("Alpha");
      expect(result.mesh.description).toBe("Test mesh");
      expect(result.status).toBe("active");
    }
  });

  it("reject_mesh_without_name", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    const result = svc.createMesh({ name: "" });
    expect(isDomainValidationError(result)).toBe(true);
  });

  it("update_mesh_name", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    const created = svc.createMesh({ name: "Old" });
    if (isDomainValidationError(created) || isServiceError(created)) {
      throw new Error("setup failed");
    }
    const updated = svc.updateMeshMetadata(created.mesh.id, { name: "New" });
    expect(isServiceError(updated)).toBe(false);
    if (!isServiceError(updated) && !isDomainValidationError(updated)) {
      expect(updated.mesh.name).toBe("New");
    }
  });

  it("update_mesh_tags", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    const created = svc.createMesh({ name: "Tagged" });
    if (isDomainValidationError(created) || isServiceError(created)) {
      throw new Error("setup failed");
    }
    const updated = svc.updateMeshMetadata(created.mesh.id, { tags: ["a", "b"] });
    if (!isServiceError(updated) && !isDomainValidationError(updated)) {
      expect(updated.mesh.tags).toEqual(["a", "b"]);
    }
  });

  it("archive_mesh_without_deleting_history", () => {
    const repo = new InMemoryMeshRepository();
    const svc = new MeshService(repo);
    const created = svc.createMesh({ name: "Archive Me" });
    if (isDomainValidationError(created) || isServiceError(created)) {
      throw new Error("setup failed");
    }
    const archived = svc.archiveMesh(created.mesh.id);
    if (!isServiceError(archived) && !isDomainValidationError(archived)) {
      expect(archived.status).toBe("archived");
    }
    expect(repo.get(created.mesh.id)?.status).toBe("archived");
  });

  it("prevent_hard_delete_when_mesh_has_active_session", () => {
    const repo = new InMemoryMeshRepository();
    const active = new Set<string>();
    const svc = new MeshService(repo, () => active);
    const created = svc.createMesh({ name: "Busy" });
    if (isDomainValidationError(created) || isServiceError(created)) {
      throw new Error("setup failed");
    }
    active.add(created.mesh.id);
    const result = svc.hardDeleteMesh(created.mesh.id);
    expect(isServiceError(result)).toBe(true);
    if (isServiceError(result)) {
      expect(result.code).toBe("mesh_has_active_session");
    }
  });

  it("list_meshes_excludes_archived_by_default", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    const a = svc.createMesh({ name: "Active" });
    const b = svc.createMesh({ name: "Gone" });
    if (
      isDomainValidationError(a) ||
      isServiceError(a) ||
      isDomainValidationError(b) ||
      isServiceError(b)
    ) {
      throw new Error("setup failed");
    }
    svc.archiveMesh(b.mesh.id);
    const list = svc.listMeshes(false);
    expect(list).toHaveLength(1);
    expect(list[0].mesh.name).toBe("Active");
  });

  it("list_meshes_can_include_archived", () => {
    const svc = new MeshService(new InMemoryMeshRepository());
    svc.createMesh({ name: "One" });
    svc.createMesh({ name: "Two" });
    const all = svc.listMeshes(true);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});
