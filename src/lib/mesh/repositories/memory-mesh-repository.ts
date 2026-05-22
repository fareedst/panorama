// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: In-memory mesh repository for unit tests and default runtime

import { normalizeMeshRecordVersion, type MeshRecord } from "../mesh-record";
import type { ListMeshesOptions, MeshRepository } from "./mesh-repository";

export class InMemoryMeshRepository implements MeshRepository {
  private readonly store = new Map<string, MeshRecord>();

  save(record: MeshRecord): void {
    this.store.set(record.mesh.id, structuredClone(normalizeMeshRecordVersion(record)));
  }

  get(meshId: string): MeshRecord | undefined {
    const record = this.store.get(meshId);
    return record ? structuredClone(normalizeMeshRecordVersion(record)) : undefined;
  }

  delete(meshId: string): void {
    this.store.delete(meshId);
  }

  list(options?: ListMeshesOptions): MeshRecord[] {
    const includeArchived = options?.includeArchived ?? false;
    return [...this.store.values()]
      .filter((record) => includeArchived || record.status === "active")
      .map((record) => structuredClone(normalizeMeshRecordVersion(record)));
  }
}
