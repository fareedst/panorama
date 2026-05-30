# IMPL-MESH_CONNECTOR essence pseudocode

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Connector contract and in-memory, local FS, remote stub, and virtual implementations

## ConnectorContract

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Declarative connector surface for inventory scans and executor mutations; shared by local, remote stub, virtual, and test doubles.

CONTRACT Connector
  INPUT: depot root path or remote config
  OUTPUT: health status, file listings, read buffers, write/delete results or normalized ConnectorError
  DATA: capabilities canList canRead canWrite canDelete

## FakeConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory path → content map for unit tests; base class for VirtualConnector seeding.

PROCEDURE IMPL-MESH_CONNECTOR_fake_seedFile(path, data, mtimeMs)
  NORMALIZE path; STORE bytes in files map; ENSURE parent dirs in dirs set

PROCEDURE IMPL-MESH_CONNECTOR_fake_listEntries(rootPath)
  IF root not in dirs or files THEN RETURN not_found
  RETURN immediate child entries under root prefix from dirs and files maps

PROCEDURE IMPL-MESH_CONNECTOR_fake_statEntry(path)
  IF path is directory in dirs THEN RETURN directory entry
  IF path in files THEN RETURN file entry with size and mtimeMs
  RETURN not_found

PROCEDURE IMPL-MESH_CONNECTOR_fake_readFile(path)
  IF NOT capabilities.canRead THEN RETURN unsupported
  IF path in files THEN RETURN bytes ELSE RETURN not_found

PROCEDURE IMPL-MESH_CONNECTOR_fake_writeFile(path, data)
  IF NOT capabilities.canWrite THEN RETURN unsupported
  ENSURE parent dirs; STORE bytes with mtimeMs now

PROCEDURE IMPL-MESH_CONNECTOR_fake_deleteFile(path)
  IF NOT capabilities.canDelete THEN RETURN unsupported
  IF path removed from files THEN RETURN void ELSE RETURN not_found

PROCEDURE IMPL-MESH_CONNECTOR_fake_healthCheck()
  RETURN ok true message fake connector healthy

## LocalFilesystemConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: Real FS implementation for local depots with basePath confinement.

PROCEDURE IMPL-MESH_CONNECTOR_localFilesystem_healthCheck(basePath)
  IF basePath missing on disk THEN RETURN ok false message base path missing
  RETURN ok true message local filesystem healthy

PROCEDURE IMPL-MESH_CONNECTOR_localFilesystem_listEntries(basePath, relativePath)
  RESOLVE path under basePath; READ directory via fs
  RETURN file metadata entries or list_failed ConnectorError

PROCEDURE IMPL-MESH_CONNECTOR_localFilesystem_readWriteDelete(basePath, path, operation)
  RESOLVE path under basePath preventing escape
  PERFORM read | write | delete via fs; ON failure RETURN normalized ConnectorError

## RemoteConnector

// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Contract-compliant stub; no network I/O in this release.

PROCEDURE IMPL-MESH_CONNECTOR_remote_healthCheck(root)
  RETURN ok false message remote depot not configured for live sync

PROCEDURE IMPL-MESH_CONNECTOR_remote_mutations(path)
  RETURN unsupported error for listEntries statEntry readFile writeFile deleteFile

## VirtualConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Derivative FakeConnector seeded with deterministic /virtual/readme.txt or caller-provided stubs for labs.

PROCEDURE IMPL-MESH_CONNECTOR_virtual_seed(paths)
  IF caller seeds provided THEN seedFile each path with encoded content
  ELSE seedFile /virtual/readme.txt with synthetic readme bytes and fixed mtimeMs

PROCEDURE IMPL-MESH_CONNECTOR_virtual_healthCheck()
  RETURN ok true message virtual connector synthetic healthy
