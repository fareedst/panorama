# IMPL-MESH_CONNECTOR essence pseudocode

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Connector contract and test doubles

## ConnectorContract

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Declarative connector surface for inventory scans and executor mutations; shared by local, remote stub, virtual, and test doubles.

CONTRACT Connector
  INPUT: depot root path or remote config
  OUTPUT: file listings, read buffers, write/copy results

## FakeConnector

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory path → content map for unit tests; base class for VirtualConnector seeding.

PROCEDURE IMPL-MESH_CONNECTOR_fake_list(path)
  RETURN entries under in-memory store prefix

PROCEDURE IMPL-MESH_CONNECTOR_fake_copy(sourcePath, targetPath)
  COPY bytes in memory map

## LocalFilesystemConnector

// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Real FS implementation for local depots.

PROCEDURE IMPL-MESH_CONNECTOR_localFilesystem_list(root, relativePath)
  READ directory via fs; RETURN file metadata

PROCEDURE IMPL-MESH_CONNECTOR_localFilesystem_copy(from, to)
  COPY file on disk respecting policy filters

## RemoteConnector

// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Contract-compliant stub; no network I/O in this release.

PROCEDURE IMPL-MESH_CONNECTOR_remote_healthCheck(root)
  RETURN ok false message remote depot not configured for live sync

PROCEDURE IMPL-MESH_CONNECTOR_remote_listEntries(path)
  RETURN unsupported error for list read write delete copy

## VirtualConnector

// [IMPL-MESH_CONNECTOR] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Derivative FakeConnector seeded with deterministic synthetic readme file or caller-provided stubs for labs.

PROCEDURE IMPL-MESH_CONNECTOR_virtual_seed(paths)
  FOR each seeded path ENSURE deterministic bytes exist via inherited fake write paths

PROCEDURE IMPL-MESH_CONNECTOR_virtual_healthCheck(root)
  RETURN synthetic ok message distinguishing virtual inventory from filesystem connectors
