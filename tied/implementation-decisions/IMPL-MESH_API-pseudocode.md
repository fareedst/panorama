# IMPL-MESH_API essence pseudocode

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: L5 HTTP handlers delegate to MeshRuntime; auth via x-mesh-role; DTOs strip secrets

## ApiHelpers

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Shared helpers wire Next.js Request to getMeshRuntime, X-Mesh-Role parsing, permission gate, and typed error mapping.

CONTRACT requirePermission
  INPUT: request Request; permission MeshPermission
  OUTPUT: null when allowed | Response 403 when denied

PROCEDURE IMPL-MESH_API_requirePermission(request, permission)
  DATA role = parseMeshRole(request.headers x-mesh-role)
  DATA result = CALL MeshRuntime.authorize(role, permission)
  IF NOT result.allowed THEN RETURN jsonError(403, permission_denied)
  RETURN null

CONTRACT handleServiceResult
  INPUT: service result union (MeshRecord | DomainValidationError | MeshServiceError)
  OUTPUT: null when success | Response 400/404/409 on domain or service error

PROCEDURE IMPL-MESH_API_handleServiceResult(result)
  IF isDomainValidationError(result) THEN RETURN jsonError(400)
  IF MeshServiceError THEN
    IF code mesh_not_found THEN RETURN jsonError(404)
    IF code stale_configuration THEN RETURN jsonError(409)
    ELSE RETURN jsonError(400)
  RETURN null

## ListCreateMeshRoute

// [IMPL-MESH_API] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: GET lists DTO meshes; POST creates after create_mesh permission and records audit event.

PROCEDURE IMPL-MESH_API_GET_mesh_list(request)
  CALL requirePermission(view_mesh)
  DATA includeArchived = query includeArchived equals true
  DATA meshes = CALL meshService.listMeshes(includeArchived)
  RETURN Response.json meshes mapped to toDtoMesh plus status and timestamps (no secrets)

PROCEDURE IMPL-MESH_API_POST_mesh_create(request)
  CALL requirePermission(create_mesh)
  PARSE JSON body; ON invalid JSON RETURN 400 invalid_json
  DATA result = CALL meshService.createMesh(body)
  MAP errors via handleServiceResult
  RECORD event mesh created
  RETURN 201 with DTO mesh and status

## MeshSubRoutes

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Per-mesh `[meshId]` routes delegate to depot/link/topology/plan/session/conflict/event/schedule/import-export services with DTO sanitization.

PROCEDURE IMPL-MESH_API_mesh_subroute(meshId, operation)
  CALL requirePermission appropriate to operation
  LOAD mesh via meshService or runtime helper
  DELEGATE to depotService | sessionService | planning | safety checks
  RETURN JSON DTO responses without credential secret fields

## SessionsRoute

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session lifecycle and progress over HTTP.

PROCEDURE IMPL-MESH_API_GET_sessions(meshId, optional sessionId query)
  IF mesh missing THEN RETURN 404 mesh_not_found
  IF sessionId THEN
    IF session missing THEN RETURN 404 session_not_found
    RETURN session plus getSessionProgress
  ELSE RETURN sessions listForMesh meshId

PROCEDURE IMPL-MESH_API_POST_sessions_create(meshId)
  CALL requirePermission(run_sync)
  CREATE session from mesh record; RECORD session lifecycle event
  RETURN 201 session

PROCEDURE IMPL-MESH_API_POST_sessions_approve(meshId, sessionId, changeSet)
  CALL requirePermission(run_sync)
  CALL sessions.approvePlan(sessionId, changeSet)
  RETURN approved true

PROCEDURE IMPL-MESH_API_POST_sessions_start(meshId, sessionId, confirmedDestructive, optional changeSet)
  CALL requirePermission(run_sync)
  IF changeSet THEN CALL checkExecution on changeSet ELSE IF approved plan THEN CALL checkExecution on plan
  ON safety blocked RETURN 400 with requiresConfirmation when applicable
  CALL runApprovedSession; RETURN session executed progress

PROCEDURE IMPL-MESH_API_POST_sessions_pause_resume(meshId, sessionId, action pause|resume)
  CALL requirePermission(pause_cancel_sync)
  DELEGATE pause or resume to SessionService; MAP errors via handleServiceResult

PROCEDURE IMPL-MESH_API_POST_sessions_cancel(meshId, sessionId)
  CALL requirePermission(pause_cancel_sync)
  CALL cancelSessionExecution THEN sessions.cancel
  MAP errors via handleServiceResult; RETURN session

## CredentialsRoute

// [IMPL-MESH_API] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: POST creates credential reference after manage_credentials permission; response omits secret material.

PROCEDURE IMPL-MESH_API_POST_credentials(request)
  CALL requirePermission manage_credentials
  PARSE label from JSON body default credential
  CALL CredentialReferenceStore.create
  ON domain validation fault RETURN 400
  RETURN 201 with credential id and label (no secrets)
