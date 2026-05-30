// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: L5 HTTP handlers delegate to MeshRuntime; auth via x-mesh-role; DTOs strip secrets

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";

// [IMPL-MESH_API] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: GET lists DTO meshes; POST creates after create_mesh permission and records audit event.
export async function GET(request: Request) {
  const denied = requirePermission(request, "view_mesh");
  if (denied) {
    return denied;
  }
  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("includeArchived") === "true";
  const rt = getRuntime();
  const meshes = rt.meshService.listMeshes(includeArchived);
  return Response.json({
    meshes: meshes.map((r) => ({
      ...toDtoMesh(r.mesh),
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
}

// how: POST branch — require create_mesh, parse JSON, createMesh, record created event, return 201 DTO
export async function POST(request: Request) {
  const denied = requirePermission(request, "create_mesh");
  if (denied) {
    return denied;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON");
  }
  const rt = getRuntime();
  const result = rt.meshService.createMesh(body);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  if (result && typeof result === "object" && "mesh" in result) {
    rt.events.recordMeshUpdated(result.mesh.id, "created");
    return Response.json(
      { mesh: toDtoMesh(result.mesh), status: result.status },
      { status: 201 },
    );
  }
  return jsonError(500, "internal_error", "Unexpected result");
}
