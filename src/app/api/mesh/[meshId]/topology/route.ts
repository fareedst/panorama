// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Topology graph API

import { getRuntime, jsonError } from "@/lib/mesh/api/mesh-api-helpers";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  const topo = getRuntime().getTopology(meshId);
  if (!topo) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json(topo);
}
