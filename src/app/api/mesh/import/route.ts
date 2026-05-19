// [IMPL-MESH_API] [REQ-MESH_IMPORT_EXPORT]: Import mesh configuration — phase 27

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";

export async function POST(request: Request) {
  const denied = requirePermission(request, "create_mesh");
  if (denied) {
    return denied;
  }
  const body = await request.json();
  const rt = getRuntime();
  const mesh = rt.importExport.importMesh(body);
  if ("code" in mesh && "message" in mesh && !("id" in mesh)) {
    return jsonError(400, mesh.code, mesh.message);
  }
  const created = rt.meshService.createMesh(mesh);
  const err = handleServiceResult(created);
  if (err) {
    return err;
  }
  if (created && typeof created === "object" && "mesh" in created) {
    return Response.json({ mesh: toDtoMesh(created.mesh) }, { status: 201 });
  }
  return jsonError(500, "internal_error", "Import failed");
}
