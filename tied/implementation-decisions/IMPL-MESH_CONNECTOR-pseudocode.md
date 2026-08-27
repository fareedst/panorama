# IMPL-MESH_CONNECTOR essence pseudocode

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Connector contract and in-memory, local FS, remote stub, and virtual implementations

## Summary contract

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound connector surface for inventory scans and executor mutations

```
IMPL-MESH_CONNECTOR_Summary():
  INPUT: depot root path or remote config; relative paths for list/read/write/delete
  OUTPUT: health status, file listings, read buffers, write/delete results or normalized ConnectorError
  DATA: capabilities canList canRead canWrite canDelete
  PRE: connector instance constructed for depot kind
  POST: operations return normalized entries or ConnectorError codes
  EFFECTS: IO (local FS) | pure (fake/virtual) | stub (remote)
  FAILURE_MODES: NOT_FOUND; UNSUPPORTED; LIST_FAILED; BASE_PATH_MISSING
  TERMINATION: total
```

## ConnectorContract

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Declarative connector surface for inventory scans and executor mutations; shared by local, remote stub, virtual, and test doubles.

```
IMPL-MESH_CONNECTOR_ConnectorContract():
  INPUT: depot root path or remote config
  OUTPUT: health status, file listings, read buffers, write/delete results or normalized ConnectorError
  DATA: capabilities canList canRead canWrite canDelete
  PRE: connector implements listEntries, statEntry, readFile, writeFile, deleteFile, healthCheck
  POST: all mutations and reads confined to declared capabilities and depot root
  EFFECTS: varies by implementation kind
  TERMINATION: total
```

## FakeConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory path → content map for unit tests; base class for VirtualConnector seeding.

```
IMPL-MESH_CONNECTOR_fake_seedFile(path, data, mtimeMs):
  INPUT: path; data bytes; optional mtimeMs
  OUTPUT: seeded in-memory file entry
  PRE: fake connector initialized
  POST: normalized path stored with bytes and parent dirs ensured
  EFFECTS: State
  TERMINATION: total
  NORMALIZE path; STORE bytes in files map; ENSURE parent dirs in dirs set

IMPL-MESH_CONNECTOR_fake_listEntries(rootPath):
  INPUT: rootPath
  OUTPUT: immediate child entries or not_found error
  PRE: root exists in dirs or files map
  POST: child entries under root prefix returned
  EFFECTS: pure
  FAILURE_MODES: NOT_FOUND
  TERMINATION: total
  IF root not in dirs or files THEN RETURN not_found
  RETURN immediate child entries under root prefix from dirs and files maps

IMPL-MESH_CONNECTOR_fake_statEntry(path):
  INPUT: path
  OUTPUT: directory or file entry metadata or not_found
  PRE: path normalized
  POST: stat metadata returned for directory or file
  EFFECTS: pure
  FAILURE_MODES: NOT_FOUND
  TERMINATION: total
  IF path is directory in dirs THEN RETURN directory entry
  IF path in files THEN RETURN file entry with size and mtimeMs
  RETURN not_found

IMPL-MESH_CONNECTOR_fake_readFile(path):
  INPUT: path
  OUTPUT: file bytes or error
  PRE: capabilities.canRead true
  POST: bytes returned when path exists
  EFFECTS: pure
  FAILURE_MODES: UNSUPPORTED; NOT_FOUND
  TERMINATION: total
  IF NOT capabilities.canRead THEN RETURN unsupported
  IF path in files THEN RETURN bytes ELSE RETURN not_found

IMPL-MESH_CONNECTOR_fake_writeFile(path, data):
  INPUT: path; data bytes
  OUTPUT: void or error
  PRE: capabilities.canWrite true
  POST: bytes stored with current mtimeMs
  EFFECTS: State
  FAILURE_MODES: UNSUPPORTED
  TERMINATION: total
  IF NOT capabilities.canWrite THEN RETURN unsupported
  ENSURE parent dirs; STORE bytes with mtimeMs now

IMPL-MESH_CONNECTOR_fake_deleteFile(path):
  INPUT: path
  OUTPUT: void or error
  PRE: capabilities.canDelete true
  POST: path removed from files map when present
  EFFECTS: State
  FAILURE_MODES: UNSUPPORTED; NOT_FOUND
  TERMINATION: total
  IF NOT capabilities.canDelete THEN RETURN unsupported
  IF path removed from files THEN RETURN void ELSE RETURN not_found

IMPL-MESH_CONNECTOR_fake_healthCheck():
  INPUT: none
  OUTPUT: { ok: true, message }
  PRE: fake connector initialized
  POST: healthy status returned
  EFFECTS: pure
  TERMINATION: total
  RETURN ok true message fake connector healthy
```

## LocalFilesystemConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: Real FS implementation for local depots with basePath confinement.

```
IMPL-MESH_CONNECTOR_localFilesystem_healthCheck(basePath):
  INPUT: basePath
  OUTPUT: health status
  PRE: basePath configured
  POST: ok false when base missing; ok true when healthy
  EFFECTS: IO
  FAILURE_MODES: BASE_PATH_MISSING
  TERMINATION: total
  IF basePath missing on disk THEN RETURN ok false message base path missing
  RETURN ok true message local filesystem healthy

IMPL-MESH_CONNECTOR_localFilesystem_listEntries(basePath, relativePath):
  INPUT: basePath; relativePath
  OUTPUT: file metadata entries or list_failed ConnectorError
  PRE: basePath exists; path resolved under basePath
  POST: directory entries returned from fs
  EFFECTS: IO
  FAILURE_MODES: LIST_FAILED; PATH_ESCAPE
  TERMINATION: total
  RESOLVE path under basePath; READ directory via fs
  RETURN file metadata entries or list_failed ConnectorError

IMPL-MESH_CONNECTOR_localFilesystem_readWriteDelete(basePath, path, operation):
  INPUT: basePath; path; operation read|write|delete
  OUTPUT: operation result or normalized ConnectorError
  PRE: path resolved under basePath preventing escape
  POST: read/write/delete performed via fs
  EFFECTS: IO
  FAILURE_MODES: PATH_ESCAPE; READ_FAILED; WRITE_FAILED; DELETE_FAILED
  TERMINATION: total
  RESOLVE path under basePath preventing escape
  PERFORM read | write | delete via fs; ON failure RETURN normalized ConnectorError
```

## RemoteConnector

// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Contract-compliant stub; no network I/O in this release.

```
IMPL-MESH_CONNECTOR_remote_healthCheck(root):
  INPUT: root path config
  OUTPUT: not configured health status
  PRE: remote connector selected for depot kind remote
  POST: ok false with not configured message
  EFFECTS: pure
  TERMINATION: total
  RETURN ok false message remote depot not configured for live sync

IMPL-MESH_CONNECTOR_remote_mutations(path):
  INPUT: path; mutation operation
  OUTPUT: unsupported ConnectorError
  PRE: remote connector invoked
  POST: all list/stat/read/write/delete return unsupported
  EFFECTS: pure
  FAILURE_MODES: UNSUPPORTED
  TERMINATION: total
  RETURN unsupported error for listEntries statEntry readFile writeFile deleteFile
```

## VirtualConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Derivative FakeConnector seeded with deterministic /virtual/readme.txt or caller-provided stubs for labs.

```
IMPL-MESH_CONNECTOR_virtual_seed(paths):
  INPUT: optional caller-provided seed paths
  OUTPUT: seeded virtual connector state
  PRE: virtual connector constructed
  POST: default or caller paths seeded in files map
  EFFECTS: State
  TERMINATION: total
  IF caller seeds provided THEN seedFile each path with encoded content
  ELSE seedFile /virtual/readme.txt with synthetic readme bytes and fixed mtimeMs

IMPL-MESH_CONNECTOR_virtual_healthCheck():
  INPUT: none
  OUTPUT: healthy synthetic status
  PRE: virtual connector seeded
  POST: ok true returned
  EFFECTS: pure
  TERMINATION: total
  RETURN ok true message virtual connector synthetic healthy
```
