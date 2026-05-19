# IMPL-MESH_SESSION essence pseudocode

// [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Sync session lifecycle and approved plan storage

## createSession

// how: Snapshot mesh at session start; state running.

PROCEDURE IMPL-MESH_SESSION_createSession(meshId, meshSnapshot)
  GENERATE session id
  STORE session with state running and snapshot
  RETURN session

## approvePlan

// how: Attach approved ChangeSet to session for executor.

PROCEDURE IMPL-MESH_SESSION_approvePlan(sessionId, changeSet)
  IF session missing THEN RETURN error
  SET approvedPlan on session
  SET state approved

## getActiveMeshIds

// how: Return mesh ids for sessions in running|scanning|paused states (CRUD hard-delete guard).

PROCEDURE IMPL-MESH_SESSION_getActiveMeshIds()
  RETURN mesh ids where session.state in active states
