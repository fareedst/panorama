// [IMPL-MESH_API] [REQ-MESH_IMPORT_EXPORT]: Export mesh configuration — phase 27

import { getRuntime, jsonError, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const denied = requirePermission(_request, "view_mesh");
  if (denied) {
    return denied;
  }
  const { meshId } = await params;
  const rt = getRuntime();
  const record = rt.meshService.getMesh(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json(rt.importExport.exportMesh(record.mesh));
}
