// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: Mesh repository interface for CRUD and persistence swap

import type { MeshRecord } from "../mesh-record";

export type ListMeshesOptions = {
  includeArchived?: boolean;
};

export interface MeshRepository {
  save(record: MeshRecord): void;
  get(meshId: string): MeshRecord | undefined;
  delete(meshId: string): void;
  list(options?: ListMeshesOptions): MeshRecord[];
}
