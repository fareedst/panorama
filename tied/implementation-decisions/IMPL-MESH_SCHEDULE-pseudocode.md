# IMPL-MESH_SCHEDULE essence pseudocode

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: Per-mesh interval scheduling metadata

## get

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: return stored schedule or default manual enabled with runCount zero.

CONTRACT get
  INPUT: meshId
  OUTPUT: MeshSchedule
  DATA: schedules map

PROCEDURE IMPL-MESH_SCHEDULE_get(meshId)
  RETURN schedule from map OR { meshId, mode: manual, enabled: true, runCount: 0 }

## upsert

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: merge patch into current schedule preserving meshId key.

PROCEDURE IMPL-MESH_SCHEDULE_upsert(meshId, patch)
  DATA current = get(meshId)
  MERGE patch into current; STORE with meshId key
  RETURN merged schedule

## disable

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: set enabled false and mode disabled via upsert.

PROCEDURE IMPL-MESH_SCHEDULE_disable(meshId)
  RETURN upsert(meshId, { enabled: false, mode: disabled })

## dueSchedules

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: return interval schedules whose elapsed time since lastRunAt exceeds intervalMinutes; schedules without lastRunAt are immediately due.

CONTRACT dueSchedules
  INPUT: now timestamp default Date.now()
  OUTPUT: array of due MeshSchedule
  DATA: schedules map values

PROCEDURE IMPL-MESH_SCHEDULE_dueSchedules(now)
  FILTER schedules where enabled AND mode interval AND intervalMinutes set
  FOR each schedule
    IF lastRunAt missing THEN include as due
    ELSE IF now - lastRunAt >= intervalMinutes * 60000 THEN include as due
  RETURN filtered list

## recordRun

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: update lastRunAt, clear or set lastFailure, increment runCount.

PROCEDURE IMPL-MESH_SCHEDULE_recordRun(meshId, success, error)
  DATA schedule = get(meshId)
  SET lastRunAt to now ISO string
  SET lastFailure to error when NOT success ELSE clear
  INCREMENT runCount
  STORE updated schedule
