// [IMPL-MESH_API] [REQ-MESH_API]: Depot create API — phase 15

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";

type Params = { params: Promise<{ meshId: string }> };

export async function POST(request: Request, { params }: Params) {
  const denied = requirePermission(request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON");
  }
  const rt = getRuntime();
  const result = rt.depotService.addDepot(meshId, body);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  if (result && typeof result === "object" && "id" in result && "name" in result) {
    rt.events.recordMeshUpdated(meshId, "depot_added");
    const record = rt.meshRepository.get(meshId);
    return Response.json(
      { depot: result, mesh: record ? toDtoMesh(record.mesh) : undefined },
      { status: 201 },
    );
  }
  return jsonError(500, "internal_error", "Unexpected result");
}
