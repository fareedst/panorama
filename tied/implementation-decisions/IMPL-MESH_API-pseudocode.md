# IMPL-MESH_API essence pseudocode

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: L5 HTTP handlers delegate to MeshRuntime; auth via x-mesh-role; DTOs strip secrets

## Summary contract

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: bound module inputs, outputs, and shared data for all HTTP route blocks below

```
IMPL-MESH_API_Summary():
  INPUT: Next.js Request; meshId path segments; JSON bodies; x-mesh-role header
  OUTPUT: JSON DTO responses; HTTP 400/403/404/409 on domain or auth errors
  DATA: MeshPermission enum; MeshRuntime services; DTO mappers stripping credential secrets
  PRE: request routed to mesh API handler
  POST: permission checked; service result mapped to sanitized JSON response
  EFFECTS: IO, State
  FAILURE_MODES: PERMISSION_DENIED; INVALID_JSON; MESH_NOT_FOUND; STALE_CONFIGURATION
  TERMINATION: total
```

## RequirePermission

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Shared helper wires Next.js Request to getMeshRuntime, X-Mesh-Role parsing, permission gate, and typed error mapping.

```
IMPL-MESH_API_RequirePermission(request, permission):
  INPUT: request Request; permission MeshPermission
  OUTPUT: null when allowed | Response 403 when denied
  PRE: request includes parseable x-mesh-role header
  POST: returns null when role authorized for permission else 403 jsonError
  EFFECTS: pure
  FAILURE_MODES: PERMISSION_DENIED
  TERMINATION: total
  DATA role = parseMeshRole(request.headers x-mesh-role)
  DATA result = CALL MeshRuntime.authorize(role, permission)
  IF NOT result.allowed THEN RETURN jsonError(403, permission_denied)
  RETURN null
```

## HandleServiceResult

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Maps domain validation and service errors to typed HTTP responses.

```
IMPL-MESH_API_HandleServiceResult(result):
  INPUT: service result union (MeshRecord | DomainValidationError | MeshServiceError)
  OUTPUT: null when success | Response 400/404/409 on domain or service error
  PRE: service call completed
  POST: success returns null; errors mapped to appropriate status
  EFFECTS: pure
  FAILURE_MODES: DOMAIN_VALIDATION; MESH_NOT_FOUND; STALE_CONFIGURATION; SERVICE_ERROR
  TERMINATION: total
  IF isDomainValidationError(result) THEN RETURN jsonError(400)
  IF MeshServiceError THEN
    IF code mesh_not_found THEN RETURN jsonError(404)
    IF code stale_configuration THEN RETURN jsonError(409)
    ELSE RETURN jsonError(400)
  RETURN null
```

## ListCreateMeshRoute

// [IMPL-MESH_API] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: GET lists DTO meshes; POST creates after create_mesh permission and records audit event.

```
IMPL-MESH_API_GET_mesh_list(request):
  INPUT: request with optional includeArchived query
  OUTPUT: JSON array of DTO meshes without secrets
  PRE: caller has view_mesh permission
  POST: meshes listed with status and timestamps; no credential secrets in payload
  EFFECTS: IO
  TERMINATION: total
  CALL requirePermission(view_mesh)
  DATA includeArchived = query includeArchived equals true
  DATA meshes = CALL meshService.listMeshes(includeArchived)
  RETURN Response.json meshes mapped to toDtoMesh plus status and timestamps (no secrets)

IMPL-MESH_API_POST_mesh_create(request):
  INPUT: request with JSON mesh create body
  OUTPUT: 201 DTO mesh response or HTTP error
  PRE: caller has create_mesh permission; valid JSON body
  POST: mesh created and audit event recorded; response omits secrets
  EFFECTS: IO, State
  FAILURE_MODES: PERMISSION_DENIED; INVALID_JSON; DOMAIN_VALIDATION
  TERMINATION: total
  CALL requirePermission(create_mesh)
  PARSE JSON body; ON invalid JSON RETURN 400 invalid_json
  DATA result = CALL meshService.createMesh(body)
  MAP errors via handleServiceResult
  RECORD event mesh created
  RETURN 201 with DTO mesh and status
```

## MeshSubRoutes

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_API]: Per-mesh `[meshId]` routes delegate to depot/link/topology/plan/session/conflict/event/schedule/import-export services with DTO sanitization.

```
IMPL-MESH_API_mesh_subroute(meshId, operation):
  INPUT: meshId; operation identifier; request context
  OUTPUT: JSON DTO response without credential secret fields
  PRE: mesh exists; caller has operation-appropriate permission
  POST: delegated service result returned as sanitized DTO
  EFFECTS: IO
  FAILURE_MODES: PERMISSION_DENIED; MESH_NOT_FOUND; SERVICE_ERROR
  TERMINATION: total
  CALL requirePermission appropriate to operation
  LOAD mesh via meshService or runtime helper
  DELEGATE to depotService | sessionService | planning | safety checks
  RETURN JSON DTO responses without credential secret fields
```

## SessionsRoute

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session lifecycle and progress over HTTP.

```
IMPL-MESH_API_GET_sessions(meshId, optional sessionId query):
  INPUT: meshId; optional sessionId query
  OUTPUT: session list or single session with progress
  PRE: mesh exists when listing or fetching session
  POST: sessions or session plus progress returned
  EFFECTS: IO
  FAILURE_MODES: MESH_NOT_FOUND; SESSION_NOT_FOUND
  TERMINATION: total
  IF mesh missing THEN RETURN 404 mesh_not_found
  IF sessionId THEN
    IF session missing THEN RETURN 404 session_not_found
    RETURN session plus getSessionProgress
  ELSE RETURN sessions listForMesh meshId

IMPL-MESH_API_POST_sessions_create(meshId):
  INPUT: meshId; create session request
  OUTPUT: 201 session response
  PRE: caller has run_sync permission; mesh exists
  POST: session created and lifecycle event recorded
  EFFECTS: IO, State
  TERMINATION: total
  CALL requirePermission(run_sync)
  CREATE session from mesh record; RECORD session lifecycle event
  RETURN 201 session

IMPL-MESH_API_POST_sessions_approve(meshId, sessionId, changeSet):
  INPUT: meshId; sessionId; changeSet
  OUTPUT: approved true response or HTTP error
  PRE: caller has run_sync permission; session exists
  POST: plan approved on session
  EFFECTS: IO, State
  TERMINATION: total
  CALL requirePermission(run_sync)
  CALL sessions.approvePlan(sessionId, changeSet)
  RETURN approved true

IMPL-MESH_API_POST_sessions_start(meshId, sessionId, confirmedDestructive, optional changeSet):
  INPUT: meshId; sessionId; confirmedDestructive flag; optional changeSet
  OUTPUT: executed session with progress or safety-blocked error
  PRE: caller has run_sync permission; approved plan or changeSet available
  POST: session execution started after safety checks pass
  EFFECTS: IO, State
  FAILURE_MODES: SAFETY_BLOCKED; REQUIRES_CONFIRMATION
  TERMINATION: total
  CALL requirePermission(run_sync)
  IF changeSet THEN CALL checkExecution on changeSet ELSE IF approved plan THEN CALL checkExecution on plan
  ON safety blocked RETURN 400 with requiresConfirmation when applicable
  CALL runApprovedSession; RETURN session executed progress

IMPL-MESH_API_POST_sessions_pause_resume(meshId, sessionId, action pause|resume):
  INPUT: meshId; sessionId; action pause|resume
  OUTPUT: updated session or HTTP error
  PRE: caller has pause_cancel_sync permission; session exists
  POST: session paused or resumed via SessionService
  EFFECTS: IO, State
  TERMINATION: total
  CALL requirePermission(pause_cancel_sync)
  DELEGATE pause or resume to SessionService; MAP errors via handleServiceResult

IMPL-MESH_API_POST_sessions_cancel(meshId, sessionId):
  INPUT: meshId; sessionId
  OUTPUT: cancelled session or HTTP error
  PRE: caller has pause_cancel_sync permission; session exists
  POST: session execution cancelled
  EFFECTS: IO, State
  TERMINATION: total
  CALL requirePermission(pause_cancel_sync)
  CALL cancelSessionExecution THEN sessions.cancel
  MAP errors via handleServiceResult; RETURN session
```

## CredentialsRoute

// [IMPL-MESH_API] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: POST creates credential reference after manage_credentials permission; response omits secret material.

```
IMPL-MESH_API_POST_credentials(request):
  INPUT: request with optional label in JSON body
  OUTPUT: 201 credential id and label without secrets
  PRE: caller has manage_credentials permission
  POST: credential reference created; response omits secret material
  EFFECTS: IO, State
  FAILURE_MODES: PERMISSION_DENIED; DOMAIN_VALIDATION
  TERMINATION: total
  CALL requirePermission manage_credentials
  PARSE label from JSON body default credential
  CALL CredentialReferenceStore.create
  ON domain validation fault RETURN 400
  RETURN 201 with credential id and label (no secrets)
```
