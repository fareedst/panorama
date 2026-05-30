# IMPL-MESH_EVENTS essence pseudocode

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Append-only in-memory event log with optional JSON persistence under MESH_DATA_DIR; all entries validated via validateSyncEvent.

## EventServiceConstruction

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — construct with optional dataDir; when set, mkdir and load persisted sync-events.json on startup.

CONTRACT EventServiceConstruction
  INPUT: options { dataDir? }
  OUTPUT: EventService instance
  DATA: in-memory events array; dataDir from options OR process.env.MESH_DATA_DIR

PROCEDURE IMPL-MESH_EVENTS_construct(options)
  ASSIGN dataDir = options.dataDir OR process.env.MESH_DATA_DIR
  IF dataDir is non-empty THEN
    CALL mkdir dataDir recursive
    CALL IMPL-MESH_EVENTS_loadFromDisk()
  RETURN EventService with empty or restored events

## loadFromDisk

// [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — read sync-events.json; validate each row; skip invalid with DIAGNOSTIC warn; start empty on missing or corrupt file.

PROCEDURE IMPL-MESH_EVENTS_loadFromDisk()
  IF dataDir absent THEN RETURN
  DATA path = join(dataDir, "sync-events.json")
  IF file missing THEN RETURN
  TRY parse JSON payload { version, events[] }
  FOR EACH row IN events
    DATA validated = CALL validateSyncEvent(row)
    IF valid THEN APPEND to in-memory events
    ELSE LOG DIAGNOSTIC skip invalid persisted event
  ON parse/read failure THEN LOG DIAGNOSTIC failed to load; leave events empty

## persistToDisk

// [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — write version 1 envelope with full events array after each append when dataDir set.

PROCEDURE IMPL-MESH_EVENTS_persistToDisk()
  IF dataDir absent THEN RETURN
  WRITE JSON { version: 1, events: in-memory events } to sync-events.json

## append

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — private helper builds SyncEvent with ISO timestamp, validates, pushes append-only, persists.

CONTRACT AppendEvent
  INPUT: type, subject, payload
  OUTPUT: SyncEvent
  CONTROL: append-only — no update or delete of prior events

PROCEDURE IMPL-MESH_EVENTS_append(type, subject, payload)
  DATA event = CALL validateSyncEvent { timestamp: now ISO, type, subject, payload }
  IF domain validation error THEN THROW validation message
  APPEND event to in-memory events
  CALL IMPL-MESH_EVENTS_persistToDisk()
  RETURN event

## recordMeshUpdated

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit mesh configuration mutations with action in payload.

PROCEDURE IMPL-MESH_EVENTS_recordMeshUpdated(meshId, action)
  RETURN CALL IMPL-MESH_EVENTS_append("mesh_updated", meshId, { action })

## recordOperationStarted

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_started before executor performs connector I/O.

PROCEDURE IMPL-MESH_EVENTS_recordOperationStarted(operationId)
  RETURN CALL IMPL-MESH_EVENTS_append("operation_started", operationId, {})

## recordOperationCompleted

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_completed after successful executor result.

PROCEDURE IMPL-MESH_EVENTS_recordOperationCompleted(operationId)
  RETURN CALL IMPL-MESH_EVENTS_append("operation_completed", operationId, {})

## recordOperationFailed

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_failed with error string in payload.

PROCEDURE IMPL-MESH_EVENTS_recordOperationFailed(operationId, error)
  RETURN CALL IMPL-MESH_EVENTS_append("operation_failed", operationId, { error })

## recordConflictResolved

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit conflict resolution by conflict id subject.

PROCEDURE IMPL-MESH_EVENTS_recordConflictResolved(conflictId)
  RETURN CALL IMPL-MESH_EVENTS_append("conflict_resolved", conflictId, {})

## recordSessionLifecycle

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — record session state transitions with optional meshId in payload.

PROCEDURE IMPL-MESH_EVENTS_recordSessionLifecycle(sessionId, state, meshId?)
  RETURN CALL IMPL-MESH_EVENTS_append("session_lifecycle", sessionId, { state, meshId })

## recordAudit

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — generic audit events for auth denials and permission checks.

PROCEDURE IMPL-MESH_EVENTS_recordAudit(subject, payload)
  RETURN CALL IMPL-MESH_EVENTS_append("audit", subject, payload)

## queryAndList

// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — read-only filters over append-only log; list returns defensive copy.

PROCEDURE IMPL-MESH_EVENTS_queryBySession(sessionId)
  RETURN FILTER events WHERE subject = sessionId OR payload.sessionId = sessionId

PROCEDURE IMPL-MESH_EVENTS_queryByMesh(meshId)
  RETURN FILTER events WHERE subject = meshId OR payload.meshId = meshId

PROCEDURE IMPL-MESH_EVENTS_list()
  RETURN shallow copy of events array preserving append order
