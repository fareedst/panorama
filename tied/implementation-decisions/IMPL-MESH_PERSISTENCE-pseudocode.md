# IMPL-MESH_PERSISTENCE essence pseudocode

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: JSON file persistence and repository factory

## JsonMeshRepository

// how: Persist MeshRecord[] to single JSON file under data directory; load on init.

PROCEDURE IMPL-MESH_PERSISTENCE_save(record)
  MERGE into in-memory map by mesh.id
  WRITE file atomically (sync write for MVP)

PROCEDURE IMPL-MESH_PERSISTENCE_get(meshId)
  RETURN record from map

PROCEDURE IMPL-MESH_PERSISTENCE_list(options)
  FILTER by includeArchived flag

## createMeshRepository

// how: Return JsonMeshRepository when MESH_DATA_PATH set else InMemoryMeshRepository.

PROCEDURE IMPL-MESH_PERSISTENCE_createMeshRepository()
  IF env MESH_DATA_PATH THEN RETURN JsonMeshRepository(path)
  RETURN InMemoryMeshRepository()
