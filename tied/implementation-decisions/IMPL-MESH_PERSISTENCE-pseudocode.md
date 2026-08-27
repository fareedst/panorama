# IMPL-MESH_PERSISTENCE essence pseudocode

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: JSON file persistence for MeshRecord[] under MESH_DATA_DIR with in-memory cache and repository factory.

## Summary contract

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound repository construction, cache lifecycle, and factory selection

```
IMPL-MESH_PERSISTENCE_Summary():
  INPUT: dataDir string; meshId; MeshRecord payloads; includeArchived option
  OUTPUT: JsonMeshRepository instance; cloned records; persisted meshes.json
  DATA: file meshes.json under dataDir; in-memory cache map keyed by mesh.id
  PRE: MESH_DATA_DIR set for JSON persistence or fallback to in-memory repository
  POST: records normalized via normalizeMeshRecordVersion on load/save/get/list
  EFFECTS: IO, State
  FAILURE_MODES: PARSE_FAILED; PERSIST_FAILED
  TERMINATION: total
```

## JsonMeshRepositoryConstruction

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: ensure data directory exists; load meshes.json into normalized in-memory map on startup.

```
IMPL-MESH_PERSISTENCE_construct(dataDir):
  INPUT: dataDir string
  OUTPUT: JsonMeshRepository instance
  PRE: dataDir path provided
  POST: data directory ensured; meshes.json loaded into cache; repository returned
  EFFECTS: IO, State
  TERMINATION: total
  IF dataDir missing on disk THEN CALL mkdir dataDir recursive
  ASSIGN filePath = join(dataDir, "meshes.json")
  CALL IMPL-MESH_PERSISTENCE_load()
  RETURN repository
```

## Load

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: parse meshes.json array; coerce each row via normalizeMeshRecordVersion; empty map when file absent.

```
IMPL-MESH_PERSISTENCE_load():
  INPUT: meshes.json at configured filePath
  OUTPUT: populated in-memory cache map
  PRE: filePath assigned on repository
  POST: cache contains normalized records keyed by mesh.id or empty when file absent
  EFFECTS: IO, State
  FAILURE_MODES: PARSE_FAILED
  TERMINATION: total
  IF meshes.json missing THEN ASSIGN cache = empty map; RETURN
  DATA rows = PARSE JSON array from file
  ASSIGN cache = MAP each row BY mesh.id WITH normalizeMeshRecordVersion(clone(row))
```

## Save

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: normalize record, upsert in cache by mesh.id, write full cache array to meshes.json.

```
IMPL-MESH_PERSISTENCE_save(record):
  INPUT: MeshRecord record
  OUTPUT: persisted meshes.json reflecting updated cache
  PRE: record includes mesh.id
  POST: normalized record upserted in cache and written to disk
  EFFECTS: IO, State
  DATA_TRANSITION: cache updated then meshes.json rewritten
  TERMINATION: total
  DATA normalized = CALL normalizeMeshRecordVersion(clone(record))
  SET cache[mesh.id] = normalized
  CALL IMPL-MESH_PERSISTENCE_persist()
```

## Get

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return cloned normalized record from cache or undefined when absent.

```
IMPL-MESH_PERSISTENCE_get(meshId):
  INPUT: meshId string
  OUTPUT: cloned MeshRecord or undefined
  PRE: cache loaded
  POST: cloned normalized record returned when present
  EFFECTS: pure
  TERMINATION: total
  IF meshId not in cache THEN RETURN undefined
  RETURN clone(normalizeMeshRecordVersion(cache[meshId]))
```

## Delete

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: remove meshId from cache and rewrite meshes.json.

```
IMPL-MESH_PERSISTENCE_delete(meshId):
  INPUT: meshId string
  OUTPUT: persisted meshes.json without removed mesh
  PRE: meshId may or may not exist in cache
  POST: meshId removed from cache and file rewritten
  EFFECTS: IO, State
  DATA_TRANSITION: cache entry removed then meshes.json rewritten
  TERMINATION: total
  REMOVE meshId from cache
  CALL IMPL-MESH_PERSISTENCE_persist()
```

## List

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return cloned active records; include archived only when includeArchived option true.

```
IMPL-MESH_PERSISTENCE_list(options?):
  INPUT: optional { includeArchived: boolean }
  OUTPUT: cloned MeshRecord[]
  PRE: cache loaded
  POST: active records returned; archived included only when option true
  EFFECTS: pure
  TERMINATION: total
  DATA includeArchived = options.includeArchived OR false
  RETURN FILTER cache values WHERE includeArchived OR status = active
    MAP clone(normalizeMeshRecordVersion(each))
```

## Persist

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: synchronous write of cache values as JSON array to meshes.json.

```
IMPL-MESH_PERSISTENCE_persist():
  INPUT: in-memory cache map
  OUTPUT: meshes.json file on disk
  PRE: filePath configured
  POST: full cache serialized to meshes.json
  EFFECTS: IO
  FAILURE_MODES: PERSIST_FAILED
  TERMINATION: total
  WRITE JSON.stringify([...cache.values()]) to meshes.json
```

## CreateMeshRepository

// [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: select JsonMeshRepository when process.env.MESH_DATA_DIR set; otherwise InMemoryMeshRepository.

```
IMPL-MESH_PERSISTENCE_createMeshRepository():
  INPUT: process.env.MESH_DATA_DIR
  OUTPUT: JsonMeshRepository | InMemoryMeshRepository instance
  PRE: runtime environment available
  POST: JSON-backed repository when dataDir set else in-memory fallback
  EFFECTS: IO, State
  TERMINATION: total
  DATA dataDir = process.env.MESH_DATA_DIR
  IF dataDir is non-empty THEN RETURN JsonMeshRepository(dataDir)
  RETURN InMemoryMeshRepository()
```
