# IMPL-MESH_SESSION essence pseudocode

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Sync session lifecycle, approved plan storage, and optional JSON persistence

## createSession

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: snapshot mesh at session start; initial state idle; track mesh in activeMeshIds.

```
IMPL-MESH_SESSION_createSession(mesh):
  INPUT: mesh
  OUTPUT: SyncSession OR DomainValidationError
  DATA: sessions map, activeMeshIds set
  PRE: mesh available for snapshot
  POST: session created in idle state with mesh snapshot; mesh id added to activeMeshIds
  EFFECTS: State, IO
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA snapshot = createMeshSnapshot(mesh)
  VALIDATE session { meshSnapshot: snapshot, state: idle }
  IF validation error THEN RETURN error
  GENERATE session id; STORE session
  ADD mesh.id to activeMeshIds
  CALL persistToDisk when dataDir configured
  RETURN session
```

## approvePlan

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: attach approved ChangeSet to session for executor; does not transition session state.

```
IMPL-MESH_SESSION_approvePlan(sessionId, changeSet):
  INPUT: sessionId, changeSet
  OUTPUT: void side effect on approvedPlans map
  DATA: approvedPlans map
  PRE: sessionId and changeSet available
  POST: changeSet stored in approvedPlans keyed by sessionId; persisted when dataDir configured
  EFFECTS: State, IO
  TERMINATION: total
  STORE changeSet in approvedPlans keyed by sessionId
  CALL persistToDisk when dataDir configured
```

## getApprovedPlan

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: retrieve stored ChangeSet for session.

```
IMPL-MESH_SESSION_getApprovedPlan(sessionId):
  INPUT: sessionId
  OUTPUT: ChangeSet | undefined
  PRE: sessionId provided
  POST: approved change set returned when stored else undefined
  EFFECTS: pure
  TERMINATION: total
  RETURN approvedPlans entry OR undefined
```

## transition

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: validate state machine transitions; remove mesh from activeMeshIds on terminal states.

```
IMPL-MESH_SESSION_transition(sessionId, nextState, error):
  INPUT: sessionId, nextState, optional error
  OUTPUT: SyncSession OR SessionServiceError
  DATA: VALID_TRANSITIONS table, activeMeshIds set
  PRE: sessionId and nextState provided
  POST: session state updated per VALID_TRANSITIONS; mesh removed from activeMeshIds on terminal states
  EFFECTS: State, IO
  FAILURE_MODES: SESSION_NOT_FOUND; INVALID_STATE_TRANSITION
  TERMINATION: total
  LOAD session; IF missing THEN RETURN session_not_found
  IF nextState NOT IN VALID_TRANSITIONS[session.state] THEN RETURN invalid_state_transition
  UPDATE session state
  IF nextState in completed|failed|cancelled THEN REMOVE mesh.id from activeMeshIds
  CALL persistToDisk when dataDir configured
  RETURN updated session
```

## start pause resume cancel complete

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: convenience wrappers calling transition with running, paused, running, cancelled, completed.

```
IMPL-MESH_SESSION_start(sessionId):
  INPUT: sessionId
  OUTPUT: SyncSession OR SessionServiceError
  PRE: sessionId provided
  POST: session transitioned to running via transition()
  EFFECTS: State
  TERMINATION: total
  RETURN transition(sessionId, running)

IMPL-MESH_SESSION_pause(sessionId):
  INPUT: sessionId
  OUTPUT: SyncSession OR SessionServiceError
  PRE: sessionId provided
  POST: session transitioned to paused via transition()
  EFFECTS: State
  TERMINATION: total
  RETURN transition(sessionId, paused)

IMPL-MESH_SESSION_resume(sessionId):
  INPUT: sessionId
  OUTPUT: SyncSession OR SessionServiceError
  PRE: sessionId provided
  POST: session transitioned to running via transition()
  EFFECTS: State
  TERMINATION: total
  RETURN transition(sessionId, running)

IMPL-MESH_SESSION_cancel(sessionId):
  INPUT: sessionId
  OUTPUT: SyncSession OR SessionServiceError
  PRE: sessionId provided
  POST: session transitioned to cancelled via transition()
  EFFECTS: State
  TERMINATION: total
  RETURN transition(sessionId, cancelled)

IMPL-MESH_SESSION_complete(sessionId):
  INPUT: sessionId
  OUTPUT: SyncSession OR SessionServiceError
  PRE: sessionId provided
  POST: session transitioned to completed via transition()
  EFFECTS: State
  TERMINATION: total
  RETURN transition(sessionId, completed)
```

## getActiveMeshIds

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return mesh ids for sessions not in completed, failed, or cancelled states (CRUD hard-delete guard).

```
IMPL-MESH_SESSION_getActiveMeshIds():
  INPUT: none
  OUTPUT: ReadonlySet of mesh ids
  DATA: activeMeshIds set maintained on create and terminal transition
  PRE: activeMeshIds set initialized
  POST: readonly set of mesh ids with non-terminal sessions returned
  EFFECTS: pure
  TERMINATION: total
  RETURN activeMeshIds set
```

## JSON persistence

// [IMPL-MESH_SESSION] [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: when dataDir or MESH_DATA_DIR set, load and save sync-sessions.json with sessions and approvedPlans.

```
IMPL-MESH_SESSION_loadFromDisk():
  INPUT: dataDir option or MESH_DATA_DIR env
  OUTPUT: hydrated sessions and approvedPlans on construct
  DATA: sync-sessions.json under dataDir
  PRE: dataDir or MESH_DATA_DIR may be configured
  POST: sessions and approvedPlans hydrated from disk when file present; activeMeshIds rebuilt
  EFFECTS: IO, State
  TERMINATION: total
  IF dataDir missing OR file missing THEN RETURN
  PARSE JSON; VALIDATE each session and approved plan
  SKIP invalid rows with diagnostic warn
  REBUILD activeMeshIds from non-terminal sessions

IMPL-MESH_SESSION_persistToDisk():
  INPUT: dataDir option or MESH_DATA_DIR env
  OUTPUT: disk write on mutations
  DATA: sync-sessions.json under dataDir
  PRE: dataDir configured
  POST: sessions and approvedPlans written to sync-sessions.json version 1
  EFFECTS: IO
  TERMINATION: total
  IF dataDir missing THEN RETURN
  WRITE { version: 1, sessions, approvedPlans } to sync-sessions.json
```
