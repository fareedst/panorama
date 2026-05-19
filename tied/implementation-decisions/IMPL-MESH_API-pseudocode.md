# IMPL-MESH_API essence pseudocode

// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: L5 HTTP handlers delegate to MeshRuntime; auth via x-mesh-role; DTOs strip secrets

## ApiHelpers

// how: Shared helpers wire Next.js Request to getMeshRuntime, role parsing, and error mapping.

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

// how: GET list meshes; POST create mesh after create_mesh permission.

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

// how: Per-mesh routes under [meshId] delegate to runtime services (depots, links, topology, plan, sessions, conflicts, events, schedule, import/export).

PROCEDURE IMPL-MESH_API_mesh_subroute(meshId, operation)
  CALL requirePermission appropriate to operation
  LOAD mesh via meshService or runtime helper
  DELEGATE to depotService | sessionService | planning | safety checks
  RETURN JSON DTO responses without credential secret fields
