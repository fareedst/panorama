# IMPL-MESH_SCHEDULE essence pseudocode

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: Per-mesh interval scheduling metadata

## Summary contract

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: bound per-mesh schedule store and due detection

```
IMPL-MESH_SCHEDULE_Summary():
  INPUT: meshId; schedule patch; now timestamp; run success flag and error
  OUTPUT: MeshSchedule records; due schedule list
  DATA: schedules map keyed by meshId
  PRE: meshId available for schedule operations
  POST: schedules retrieved, upserted, disabled, due-filtered, or run-recorded
  EFFECTS: State
  TERMINATION: total
```

## Get

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: return stored schedule or default manual enabled with runCount zero.

```
IMPL-MESH_SCHEDULE_get(meshId):
  INPUT: meshId
  OUTPUT: MeshSchedule
  PRE: meshId non-empty
  POST: stored schedule or default manual schedule returned
  EFFECTS: pure
  TERMINATION: total
  RETURN schedule from map OR { meshId, mode: manual, enabled: true, runCount: 0 }
```

## Upsert

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: merge patch into current schedule preserving meshId key.

```
IMPL-MESH_SCHEDULE_upsert(meshId, patch):
  INPUT: meshId; patch object
  OUTPUT: merged MeshSchedule
  PRE: meshId and patch available
  POST: merged schedule stored under meshId key
  EFFECTS: State
  TERMINATION: total
  DATA current = get(meshId)
  MERGE patch into current; STORE with meshId key
  RETURN merged schedule
```

## Disable

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: set enabled false and mode disabled via upsert.

```
IMPL-MESH_SCHEDULE_disable(meshId):
  INPUT: meshId
  OUTPUT: disabled MeshSchedule
  PRE: meshId available
  POST: schedule disabled via upsert
  EFFECTS: State
  TERMINATION: total
  RETURN upsert(meshId, { enabled: false, mode: disabled })
```

## DueSchedules

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: return interval schedules whose elapsed time since lastRunAt exceeds intervalMinutes; schedules without lastRunAt are immediately due.

```
IMPL-MESH_SCHEDULE_dueSchedules(now):
  INPUT: now timestamp default Date.now()
  OUTPUT: array of due MeshSchedule
  PRE: schedules map populated
  POST: enabled interval schedules due by elapsed time returned
  EFFECTS: pure
  TERMINATION: total
  FILTER schedules where enabled AND mode interval AND intervalMinutes set
  FOR each schedule
    IF lastRunAt missing THEN include as due
    ELSE IF now - lastRunAt >= intervalMinutes * 60000 THEN include as due
  RETURN filtered list
```

## RecordRun

// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: how: update lastRunAt, clear or set lastFailure, increment runCount.

```
IMPL-MESH_SCHEDULE_recordRun(meshId, success, error):
  INPUT: meshId; success boolean; optional error string
  OUTPUT: updated MeshSchedule stored
  PRE: meshId available
  POST: lastRunAt updated; lastFailure set or cleared; runCount incremented
  EFFECTS: State
  DATA_TRANSITION: schedule run metadata updated in map
  TERMINATION: total
  DATA schedule = get(meshId)
  SET lastRunAt to now ISO string
  SET lastFailure to error when NOT success ELSE clear
  INCREMENT runCount
  STORE updated schedule
```
