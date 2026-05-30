// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: JSON file persistence for MeshRecord[] under MESH_DATA_DIR with in-memory cache and repository factory.

import { InMemoryMeshRepository } from "./memory-mesh-repository";
import { JsonMeshRepository } from "./json-mesh-repository";
import type { MeshRepository } from "./mesh-repository";

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — select JsonMeshRepository when process.env.MESH_DATA_DIR set; otherwise InMemoryMeshRepository.
export function createMeshRepository(): MeshRepository {
  const dataDir = process.env.MESH_DATA_DIR;
  if (dataDir) {
    return new JsonMeshRepository(dataDir);
  }
  return new InMemoryMeshRepository();
}
