// [IMPL-MESH_API] [REQ-MESH_API]: Sync link delete API — phase 15

import {
  getRuntime,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";
import { removeLinkFromMesh } from "@/lib/mesh/services/topology-service";

type Params = { params: Promise<{ meshId: string; linkId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const denied = requirePermission(_request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId, linkId } = await params;
  const rt = getRuntime();
  const record = rt.meshRepository.get(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  record.mesh = removeLinkFromMesh(record.mesh, linkId);
  record.updatedAt = new Date().toISOString();
  rt.meshRepository.save(record);
  rt.events.recordMeshUpdated(meshId, "link_removed");
  return Response.json({ mesh: toDtoMesh(record.mesh) });
}
