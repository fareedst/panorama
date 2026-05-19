// [IMPL-MESH_API] [REQ-MESH_API]: Sync link create API — phase 15

import {
  getRuntime,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { isDomainValidationError, toDtoMesh } from "@/lib/mesh/domain";
import { addLinkToMesh } from "@/lib/mesh/services/topology-service";

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
  const record = rt.meshRepository.get(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  const updated = addLinkToMesh(record.mesh, body);
  if (isDomainValidationError(updated) || "code" in updated) {
    const code = isDomainValidationError(updated) ? updated.code : updated.code;
    const message = isDomainValidationError(updated) ? updated.message : updated.message;
    return jsonError(400, code, message);
  }
  record.mesh = updated;
  record.updatedAt = new Date().toISOString();
  rt.meshRepository.save(record);
  rt.events.recordMeshUpdated(meshId, "link_added");
  const link = updated.links[updated.links.length - 1];
  return Response.json({ link, mesh: toDtoMesh(updated) }, { status: 201 });
}
