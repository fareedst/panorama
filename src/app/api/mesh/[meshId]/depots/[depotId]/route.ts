// [IMPL-MESH_API] [REQ-MESH_API]: Depot update/delete API — phase 15

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";

type Params = { params: Promise<{ meshId: string; depotId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = requirePermission(request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId, depotId } = await params;
  const body = await request.json();
  const rt = getRuntime();
  const result = rt.depotService.updateDepot(meshId, depotId, body);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  if (result && typeof result === "object" && "id" in result) {
    return Response.json({ depot: result });
  }
  return jsonError(500, "internal_error", "Unexpected result");
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = requirePermission(_request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId, depotId } = await params;
  const rt = getRuntime();
  const result = rt.depotService.removeDepot(meshId, depotId);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  const record = rt.meshRepository.get(meshId);
  return Response.json({ mesh: record ? toDtoMesh(record.mesh) : null });
}
