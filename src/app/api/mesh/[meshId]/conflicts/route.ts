// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Conflicts API

import { getRuntime, jsonError } from "@/lib/mesh/api/mesh-api-helpers";
import { isDomainValidationError } from "@/lib/mesh/domain";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  if (!getRuntime().meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json({ conflicts: getRuntime().conflicts.list(meshId) });
}

export async function POST(request: Request, { params }: Params) {
  const { meshId } = await params;
  const body = await request.json();
  const rt = getRuntime();
  if (!rt.meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  if (body.action === "resolve") {
    const resolved = rt.conflicts.resolve(body.conflictId, body.resolution);
    if ("code" in resolved) {
      return jsonError(404, resolved.code, resolved.message);
    }
    rt.events.recordConflictResolved(body.conflictId);
    return Response.json({ conflict: resolved });
  }
  const created = rt.conflicts.create(body, meshId);
  if (isDomainValidationError(created)) {
    return jsonError(400, created.code, created.message);
  }
  return Response.json({ conflict: created }, { status: 201 });
}
