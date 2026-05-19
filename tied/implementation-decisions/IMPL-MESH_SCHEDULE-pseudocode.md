# IMPL-MESH_SCHEDULE essence pseudocode

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: Per-mesh interval scheduling metadata

## get / upsert / disable

PROCEDURE IMPL-MESH_SCHEDULE_get(meshId)
  RETURN schedule from map or default manual enabled

PROCEDURE IMPL-MESH_SCHEDULE_upsert(meshId, patch)
  MERGE patch into current schedule; STORE

PROCEDURE IMPL-MESH_SCHEDULE_disable(meshId)
  SET enabled false and mode disabled

## dueSchedules

// how: Return interval schedules whose elapsed time since lastRunAt exceeds intervalMinutes.

PROCEDURE IMPL-MESH_SCHEDULE_dueSchedules(now)
  FILTER schedules where enabled AND mode interval AND elapsed >= interval

## recordRun

PROCEDURE IMPL-MESH_SCHEDULE_recordRun(meshId, success, error)
  UPDATE lastRunAt, lastFailure on failure, increment runCount
