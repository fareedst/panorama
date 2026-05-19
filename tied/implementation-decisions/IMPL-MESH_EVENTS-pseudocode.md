# IMPL-MESH_EVENTS essence pseudocode

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Append-only event log and audit helpers

## recordMeshUpdated

PROCEDURE IMPL-MESH_EVENTS_recordMeshUpdated(meshId, action)
  APPEND SyncEvent type mesh_updated

## recordOperationCompleted / recordOperationFailed

PROCEDURE IMPL-MESH_EVENTS_recordOperationCompleted(operationId, details)
  APPEND event operation_completed

PROCEDURE IMPL-MESH_EVENTS_recordOperationFailed(operationId, error)
  APPEND event operation_failed

## recordAudit

// how: Auth denials and permission checks logged for monitoring.

PROCEDURE IMPL-MESH_EVENTS_recordAudit(permission, payload)
  APPEND audit-style event with role and outcome
