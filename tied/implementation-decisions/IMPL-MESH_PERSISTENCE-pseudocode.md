# IMPL-MESH_PERSISTENCE essence pseudocode

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: JSON file persistence for MeshRecord[] under MESH_DATA_DIR with in-memory cache and repository factory.

## JsonMeshRepositoryConstruction

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: ensure data directory exists; load meshes.json into normalized in-memory map on startup.

CONTRACT JsonMeshRepositoryConstruction
  INPUT: dataDir string
  OUTPUT: JsonMeshRepository instance
  DATA: file meshes.json under dataDir

PROCEDURE IMPL-MESH_PERSISTENCE_construct(dataDir)
  IF dataDir missing on disk THEN CALL mkdir dataDir recursive
  ASSIGN filePath = join(dataDir, "meshes.json")
  CALL IMPL-MESH_PERSISTENCE_load()
  RETURN repository

## load

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: parse meshes.json array; coerce each row via normalizeMeshRecordVersion; empty map when file absent.

PROCEDURE IMPL-MESH_PERSISTENCE_load()
  IF meshes.json missing THEN ASSIGN cache = empty map; RETURN
  DATA rows = PARSE JSON array from file
  ASSIGN cache = MAP each row BY mesh.id WITH normalizeMeshRecordVersion(clone(row))

## save

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: normalize record, upsert in cache by mesh.id, write full cache array to meshes.json.

PROCEDURE IMPL-MESH_PERSISTENCE_save(record)
  DATA normalized = CALL normalizeMeshRecordVersion(clone(record))
  SET cache[mesh.id] = normalized
  CALL IMPL-MESH_PERSISTENCE_persist()

## get

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return cloned normalized record from cache or undefined when absent.

PROCEDURE IMPL-MESH_PERSISTENCE_get(meshId)
  IF meshId not in cache THEN RETURN undefined
  RETURN clone(normalizeMeshRecordVersion(cache[meshId]))

## delete

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: remove meshId from cache and rewrite meshes.json.

PROCEDURE IMPL-MESH_PERSISTENCE_delete(meshId)
  REMOVE meshId from cache
  CALL IMPL-MESH_PERSISTENCE_persist()

## list

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return cloned active records; include archived only when includeArchived option true.

PROCEDURE IMPL-MESH_PERSISTENCE_list(options?)
  DATA includeArchived = options.includeArchived OR false
  RETURN FILTER cache values WHERE includeArchived OR status = active
    MAP clone(normalizeMeshRecordVersion(each))

## persist

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: synchronous write of cache values as JSON array to meshes.json.

PROCEDURE IMPL-MESH_PERSISTENCE_persist()
  WRITE JSON.stringify([...cache.values()]) to meshes.json

## createMeshRepository

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: select JsonMeshRepository when process.env.MESH_DATA_DIR set; otherwise InMemoryMeshRepository.

PROCEDURE IMPL-MESH_PERSISTENCE_createMeshRepository()
  DATA dataDir = process.env.MESH_DATA_DIR
  IF dataDir is non-empty THEN RETURN JsonMeshRepository(dataDir)
  RETURN InMemoryMeshRepository()
