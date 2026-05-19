// [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Repository factory — phase 16

import { InMemoryMeshRepository } from "./memory-mesh-repository";
import { JsonMeshRepository } from "./json-mesh-repository";
import type { MeshRepository } from "./mesh-repository";

export function createMeshRepository(): MeshRepository {
  const dataDir = process.env.MESH_DATA_DIR;
  if (dataDir) {
    return new JsonMeshRepository(dataDir);
  }
  return new InMemoryMeshRepository();
}
