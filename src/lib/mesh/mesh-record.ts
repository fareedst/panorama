// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: MeshRecord lifecycle wrapper

import type { Mesh } from "./domain";

export type MeshLifecycleStatus = "active" | "archived";

export type MeshRecord = {
  mesh: Mesh;
  status: MeshLifecycleStatus;
  createdAt: string;
  updatedAt: string;
};
