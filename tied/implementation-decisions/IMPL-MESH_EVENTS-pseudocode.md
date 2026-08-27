# IMPL-MESH_EVENTS essence pseudocode

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Append-only in-memory event log with optional JSON persistence under MESH_DATA_DIR; all entries validated via validateSyncEvent.

## Summary contract

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: bound append-only event log with optional disk persistence

```
IMPL-MESH_EVENTS_Summary():
  INPUT: event type, subject, payload; optional dataDir; query filters
  OUTPUT: SyncEvent records; filtered event lists
  DATA: in-memory events array; sync-events.json under MESH_DATA_DIR when configured
  CONTROL: append-only — no update or delete of prior events
  PRE: validateSyncEvent available at L1
  POST: validated events appended and optionally persisted; queries read-only
  EFFECTS: IO, State
  FAILURE_MODES: VALIDATION_FAILED; PARSE_FAILED
  TERMINATION: total
```

## EventServiceConstruction

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — construct with optional dataDir; when set, mkdir and load persisted sync-events.json on startup.

```
IMPL-MESH_EVENTS_construct(options):
  INPUT: options { dataDir? }
  OUTPUT: EventService instance
  PRE: options or process.env.MESH_DATA_DIR may provide dataDir
  POST: EventService returned with empty or restored events array
  EFFECTS: IO, State
  TERMINATION: total
  ASSIGN dataDir = options.dataDir OR process.env.MESH_DATA_DIR
  IF dataDir is non-empty THEN
    CALL mkdir dataDir recursive
    CALL IMPL-MESH_EVENTS_loadFromDisk()
  RETURN EventService with empty or restored events
```

## LoadFromDisk

// [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — read sync-events.json; validate each row; skip invalid with DIAGNOSTIC warn; start empty on missing or corrupt file.

```
IMPL-MESH_EVENTS_loadFromDisk():
  INPUT: dataDir and sync-events.json path
  OUTPUT: populated in-memory events array
  PRE: dataDir configured
  POST: valid persisted events loaded; invalid rows skipped with diagnostic
  EFFECTS: IO, State
  FAILURE_MODES: PARSE_FAILED
  TERMINATION: total
  IF dataDir absent THEN RETURN
  DATA path = join(dataDir, "sync-events.json")
  IF file missing THEN RETURN
  TRY parse JSON payload { version, events[] }
  FOR EACH row IN events
    DATA validated = CALL validateSyncEvent(row)
    IF valid THEN APPEND to in-memory events
    ELSE LOG DIAGNOSTIC skip invalid persisted event
  ON parse/read failure THEN LOG DIAGNOSTIC failed to load; leave events empty
```

## PersistToDisk

// [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — write version 1 envelope with full events array after each append when dataDir set.

```
IMPL-MESH_EVENTS_persistToDisk():
  INPUT: in-memory events array
  OUTPUT: sync-events.json written
  PRE: dataDir configured
  POST: version 1 envelope persisted with full events array
  EFFECTS: IO
  TERMINATION: total
  IF dataDir absent THEN RETURN
  WRITE JSON { version: 1, events: in-memory events } to sync-events.json
```

## AppendEvent

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — private helper builds SyncEvent with ISO timestamp, validates, pushes append-only, persists.

```
IMPL-MESH_EVENTS_append(type, subject, payload):
  INPUT: type, subject, payload
  OUTPUT: SyncEvent
  PRE: type, subject, payload pass validateSyncEvent
  POST: event appended to log and persisted when dataDir set
  EFFECTS: IO, State
  FAILURE_MODES: VALIDATION_FAILED
  TERMINATION: total
  DATA event = CALL validateSyncEvent { timestamp: now ISO, type, subject, payload }
  IF domain validation error THEN THROW validation message
  APPEND event to in-memory events
  CALL IMPL-MESH_EVENTS_persistToDisk()
  RETURN event
```

## RecordMeshUpdated

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit mesh configuration mutations with action in payload.

```
IMPL-MESH_EVENTS_recordMeshUpdated(meshId, action):
  INPUT: meshId; action string
  OUTPUT: SyncEvent
  PRE: meshId and action available
  POST: mesh_updated event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("mesh_updated", meshId, { action })
```

## RecordOperationStarted

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_started before executor performs connector I/O.

```
IMPL-MESH_EVENTS_recordOperationStarted(operationId):
  INPUT: operationId
  OUTPUT: SyncEvent
  PRE: operationId available
  POST: operation_started event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("operation_started", operationId, {})
```

## RecordOperationCompleted

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_completed after successful executor result.

```
IMPL-MESH_EVENTS_recordOperationCompleted(operationId):
  INPUT: operationId
  OUTPUT: SyncEvent
  PRE: operation completed successfully
  POST: operation_completed event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("operation_completed", operationId, {})
```

## RecordOperationFailed

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_failed with error string in payload.

```
IMPL-MESH_EVENTS_recordOperationFailed(operationId, error):
  INPUT: operationId; error string
  OUTPUT: SyncEvent
  PRE: operation failed with error message
  POST: operation_failed event appended with error payload
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("operation_failed", operationId, { error })
```

## RecordConflictResolved

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit conflict resolution by conflict id subject.

```
IMPL-MESH_EVENTS_recordConflictResolved(conflictId):
  INPUT: conflictId
  OUTPUT: SyncEvent
  PRE: conflict resolved
  POST: conflict_resolved event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("conflict_resolved", conflictId, {})
```

## RecordSessionLifecycle

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — record session state transitions with optional meshId in payload.

```
IMPL-MESH_EVENTS_recordSessionLifecycle(sessionId, state, meshId?):
  INPUT: sessionId; state; optional meshId
  OUTPUT: SyncEvent
  PRE: session lifecycle transition occurred
  POST: session_lifecycle event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("session_lifecycle", sessionId, { state, meshId })
```

## RecordAudit

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — generic audit events for auth denials and permission checks.

```
IMPL-MESH_EVENTS_recordAudit(subject, payload):
  INPUT: subject; payload object
  OUTPUT: SyncEvent
  PRE: audit subject and payload available
  POST: audit event appended
  EFFECTS: IO, State
  TERMINATION: total
  RETURN CALL IMPL-MESH_EVENTS_append("audit", subject, payload)
```

## QueryAndList

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — read-only filters over append-only log; list returns defensive copy.

```
IMPL-MESH_EVENTS_queryBySession(sessionId):
  INPUT: sessionId
  OUTPUT: SyncEvent[] matching session
  PRE: events array available
  POST: filtered events returned read-only
  EFFECTS: pure
  TERMINATION: total
  RETURN FILTER events WHERE subject = sessionId OR payload.sessionId = sessionId

IMPL-MESH_EVENTS_queryByMesh(meshId):
  INPUT: meshId
  OUTPUT: SyncEvent[] matching mesh
  PRE: events array available
  POST: filtered events returned read-only
  EFFECTS: pure
  TERMINATION: total
  RETURN FILTER events WHERE subject = meshId OR payload.meshId = meshId

IMPL-MESH_EVENTS_list():
  INPUT: none
  OUTPUT: shallow copy of events array preserving append order
  PRE: events array available
  POST: defensive copy returned
  EFFECTS: pure
  TERMINATION: total
  RETURN shallow copy of events array preserving append order
```
