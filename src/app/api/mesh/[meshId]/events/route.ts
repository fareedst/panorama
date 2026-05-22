// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Event log API

import { getRuntime, jsonError } from "@/lib/mesh/api/mesh-api-helpers";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  const rt = getRuntime();
  if (!rt.meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  const active = rt.sessions.listForMesh(meshId).find((s) => s.state === "running");
  return Response.json({
    events: rt.events.queryByMesh(meshId),
    progress: active ? rt.getSessionProgress(active.id) : undefined,
  });
}
