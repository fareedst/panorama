# IMPL-MESH_SESSION essence pseudocode

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Sync session lifecycle, approved plan storage, and optional JSON persistence

## createSession

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: snapshot mesh at session start; initial state idle; track mesh in activeMeshIds.

CONTRACT createSession
  INPUT: mesh
  OUTPUT: SyncSession OR DomainValidationError
  DATA: sessions map, activeMeshIds set

PROCEDURE IMPL-MESH_SESSION_createSession(mesh)
  DATA snapshot = createMeshSnapshot(mesh)
  VALIDATE session { meshSnapshot: snapshot, state: idle }
  IF validation error THEN RETURN error
  GENERATE session id; STORE session
  ADD mesh.id to activeMeshIds
  CALL persistToDisk when dataDir configured
  RETURN session

## approvePlan

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: attach approved ChangeSet to session for executor; does not transition session state.

CONTRACT approvePlan
  INPUT: sessionId, changeSet
  OUTPUT: void side effect on approvedPlans map
  DATA: approvedPlans map

PROCEDURE IMPL-MESH_SESSION_approvePlan(sessionId, changeSet)
  STORE changeSet in approvedPlans keyed by sessionId
  CALL persistToDisk when dataDir configured

## getApprovedPlan

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: retrieve stored ChangeSet for session.

PROCEDURE IMPL-MESH_SESSION_getApprovedPlan(sessionId)
  RETURN approvedPlans entry OR undefined

## transition

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: validate state machine transitions; remove mesh from activeMeshIds on terminal states.

CONTRACT transition
  INPUT: sessionId, nextState, optional error
  OUTPUT: SyncSession OR SessionServiceError
  DATA: VALID_TRANSITIONS table, activeMeshIds set

PROCEDURE IMPL-MESH_SESSION_transition(sessionId, nextState, error)
  LOAD session; IF missing THEN RETURN session_not_found
  IF nextState NOT IN VALID_TRANSITIONS[session.state] THEN RETURN invalid_state_transition
  UPDATE session state
  IF nextState in completed|failed|cancelled THEN REMOVE mesh.id from activeMeshIds
  CALL persistToDisk when dataDir configured
  RETURN updated session

## start pause resume cancel complete

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: convenience wrappers calling transition with running, paused, running, cancelled, completed.

PROCEDURE IMPL-MESH_SESSION_start(sessionId)
  RETURN transition(sessionId, running)

PROCEDURE IMPL-MESH_SESSION_pause(sessionId)
  RETURN transition(sessionId, paused)

PROCEDURE IMPL-MESH_SESSION_resume(sessionId)
  RETURN transition(sessionId, running)

PROCEDURE IMPL-MESH_SESSION_cancel(sessionId)
  RETURN transition(sessionId, cancelled)

PROCEDURE IMPL-MESH_SESSION_complete(sessionId)
  RETURN transition(sessionId, completed)

## getActiveMeshIds

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: return mesh ids for sessions not in completed, failed, or cancelled states (CRUD hard-delete guard).

CONTRACT getActiveMeshIds
  INPUT: none
  OUTPUT: ReadonlySet of mesh ids
  DATA: activeMeshIds set maintained on create and terminal transition

PROCEDURE IMPL-MESH_SESSION_getActiveMeshIds()
  RETURN activeMeshIds set

## JSON persistence

// [IMPL-MESH_SESSION] [IMPL-MESH_PERSISTENCE] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: when dataDir or MESH_DATA_DIR set, load and save sync-sessions.json with sessions and approvedPlans.

CONTRACT JSON persistence
  INPUT: dataDir option or MESH_DATA_DIR env
  OUTPUT: hydrated sessions and approvedPlans on construct; disk write on mutations
  DATA: sync-sessions.json under dataDir

PROCEDURE IMPL-MESH_SESSION_loadFromDisk()
  IF dataDir missing OR file missing THEN RETURN
  PARSE JSON; VALIDATE each session and approved plan
  SKIP invalid rows with diagnostic warn
  REBUILD activeMeshIds from non-terminal sessions

PROCEDURE IMPL-MESH_SESSION_persistToDisk()
  IF dataDir missing THEN RETURN
  WRITE { version: 1, sessions, approvedPlans } to sync-sessions.json
