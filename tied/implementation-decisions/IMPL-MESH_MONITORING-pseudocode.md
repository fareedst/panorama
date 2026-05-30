# IMPL-MESH_MONITORING essence pseudocode

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Aggregate operational dashboard summary from mesh records, sync sessions, and pending conflict count.

## buildSummary

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — count active and failed sessions; pass through pending conflict count; map each mesh record to health row.

CONTRACT BuildSummary
  INPUT: meshes MeshRecord[], sessions SyncSession[], events SyncEvent[], pendingConflicts number
  OUTPUT: MonitoringSummary
  DATA: active states = running | scanning | paused

PROCEDURE IMPL-MESH_MONITORING_buildSummary(meshes, sessions, events, pendingConflicts)
  DATA activeSessionCount = COUNT sessions WHERE state IN active states
  DATA failedSessionCount = COUNT sessions WHERE state = failed
  DATA meshHealth = FOR EACH mesh record MAP { meshId, name, status, depotCount: depots.length }
  RETURN {
    activeSessionCount,
    failedSessionCount,
    pendingConflictCount: pendingConflicts,
    meshHealth
  }

## sessionHistory

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — return sessions sorted by meshSnapshot.capturedAt descending (newest first).

CONTRACT SessionHistory
  INPUT: sessions SyncSession[]
  OUTPUT: SyncSession[] sorted copy

PROCEDURE IMPL-MESH_MONITORING_sessionHistory(sessions)
  RETURN COPY sessions SORTED BY meshSnapshot.capturedAt DESCENDING
