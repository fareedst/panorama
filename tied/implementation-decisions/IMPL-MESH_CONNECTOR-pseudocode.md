# IMPL-MESH_CONNECTOR essence pseudocode

// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Connector contract and test doubles

## ConnectorContract

// how: Interface list/read/write/copy operations used by inventory and executor.

CONTRACT Connector
  INPUT: depot root path or remote config
  OUTPUT: file listings, read buffers, write/copy results

## FakeConnector

// how: In-memory map of path → content for unit tests and default runtime fallback.

PROCEDURE IMPL-MESH_CONNECTOR_fake_list(path)
  RETURN entries under in-memory store prefix

PROCEDURE IMPL-MESH_CONNECTOR_fake_copy(sourcePath, targetPath)
  COPY bytes in memory map

## LocalFilesystemConnector

// [IMPL-MESH_LOCAL_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Real FS implementation for local depots.

PROCEDURE IMPL-MESH_LOCAL_CONNECTOR_list(root, relativePath)
  READ directory via fs; RETURN file metadata

PROCEDURE IMPL-MESH_LOCAL_CONNECTOR_copy(from, to)
  COPY file on disk respecting policy filters
