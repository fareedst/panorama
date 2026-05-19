# IMPL-MESH_MONITORING essence pseudocode

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Aggregate operational dashboard summary

## buildSummary

// how: Count active/failed sessions, pending conflicts, per-mesh health rows.

PROCEDURE IMPL-MESH_MONITORING_buildSummary(meshes, sessions, events, pendingConflicts)
  DATA activeSessionCount = sessions where state in running|scanning|paused
  DATA failedSessionCount = sessions where state failed
  DATA meshHealth = map meshes to id, name, status, depotCount
  RETURN MonitoringSummary

## sessionHistory

PROCEDURE IMPL-MESH_MONITORING_sessionHistory(sessions)
  SORT sessions by snapshot.capturedAt descending
  RETURN sorted list
