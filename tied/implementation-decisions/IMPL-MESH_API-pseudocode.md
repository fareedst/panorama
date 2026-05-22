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
  INPUT: service result union
  OUTPUT: null when success | Response 400/404 on domain or service error

PROCEDURE IMPL-MESH_API_handleServiceResult(result)
  IF isDomainValidationError(result) THEN RETURN jsonError(400)
  IF MeshServiceError THEN RETURN jsonError(404 when mesh_not_found else 400)
  RETURN null

## ListCreateMeshRoute

// [IMPL-MESH_API] [IMPL-MESH_CRUD] [REQ-MESH_API] [REQ-MESH_PLATFORM]: GET lists DTO meshes; POST creates after create_mesh permission and records audit event.

PROCEDURE IMPL-MESH_API_GET_mesh_list(request)
  CALL requirePermission(view_mesh)
  DATA meshes = CALL meshService.listMeshes(includeArchived from query)
  RETURN Response.json with toDtoMesh per record (no secrets)

PROCEDURE IMPL-MESH_API_POST_mesh_create(request)
  CALL requirePermission(create_mesh)
  PARSE JSON body
  DATA result = CALL meshService.createMesh(body)
  MAP errors via handleServiceResult
  RECORD event mesh created
  RETURN 201 with DTO mesh

## MeshSubRoutes

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Per-mesh `[meshId]` routes delegate to depot/link/topology/plan/session/conflict/event/schedule/import-export services with DTO sanitization.

PROCEDURE IMPL-MESH_API_mesh_subroute(meshId, operation)
  CALL requirePermission appropriate to operation
  LOAD mesh via meshService or runtime helper
  DELEGATE to depotService | sessionService | planning | safety checks
  RETURN JSON DTO responses without credential secret fields

## SessionsRoute

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session lifecycle and progress over HTTP.

PROCEDURE IMPL-MESH_API_GET_sessions(meshId, optional sessionId query)
  IF sessionId THEN RETURN session plus getSessionProgress
  ELSE RETURN sessions listForMesh meshId

PROCEDURE IMPL-MESH_API_POST_sessions_start(meshId, sessionId, confirmedDestructive, optional changeSet)
  CALL checkExecution on changeSet OR approved plan from session
  CALL runApprovedSession; RETURN session executed progress

PROCEDURE IMPL-MESH_API_POST_sessions_pause_resume_cancel(meshId, sessionId, action)
  ON cancel CALL cancelSessionExecution THEN sessions.cancel
  DELEGATE pause resume to SessionService

## CredentialsRoute

// [IMPL-MESH_API] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: POST creates masked credential reference rows after manage_credentials permission; never returns secret material.

PROCEDURE IMPL-MESH_API_POST_credentials(request)
  CALL requirePermission manage_credentials
  PARSE label from JSON body
  CALL CredentialReferenceStore.create
  RETURN 201 with credential DTO or 400 validation fault
