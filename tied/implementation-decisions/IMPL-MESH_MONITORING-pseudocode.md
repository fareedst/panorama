# IMPL-MESH_MONITORING essence pseudocode

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Aggregate operational dashboard summary from mesh records, sync sessions, and pending conflict count.

## Summary contract

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: bound monitoring aggregation inputs and dashboard outputs

```
IMPL-MESH_MONITORING_Summary():
  INPUT: meshes MeshRecord[]; sessions SyncSession[]; events SyncEvent[]; pendingConflicts number
  OUTPUT: MonitoringSummary; sorted session history
  DATA: active states = running | scanning | paused
  PRE: mesh and session collections available
  POST: summary counts and mesh health rows returned; session history sorted newest first
  EFFECTS: pure
  TERMINATION: total
```

## BuildSummary

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — count active and failed sessions; pass through pending conflict count; map each mesh record to health row.

```
IMPL-MESH_MONITORING_buildSummary(meshes, sessions, events, pendingConflicts):
  INPUT: meshes MeshRecord[], sessions SyncSession[], events SyncEvent[], pendingConflicts number
  OUTPUT: MonitoringSummary
  PRE: meshes and sessions arrays available
  POST: summary includes active/failed session counts, pending conflicts, and per-mesh health rows
  EFFECTS: pure
  TERMINATION: total
  DATA activeSessionCount = COUNT sessions WHERE state IN active states
  DATA failedSessionCount = COUNT sessions WHERE state = failed
  DATA meshHealth = FOR EACH mesh record MAP { meshId, name, status, depotCount: depots.length }
  RETURN {
    activeSessionCount,
    failedSessionCount,
    pendingConflictCount: pendingConflicts,
    meshHealth
  }
```

## SessionHistory

// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — return sessions sorted by meshSnapshot.capturedAt descending (newest first).

```
IMPL-MESH_MONITORING_sessionHistory(sessions):
  INPUT: sessions SyncSession[]
  OUTPUT: SyncSession[] sorted copy
  PRE: sessions array available
  POST: defensive copy sorted by meshSnapshot.capturedAt descending
  EFFECTS: pure
  TERMINATION: total
  RETURN COPY sessions SORTED BY meshSnapshot.capturedAt DESCENDING
```
