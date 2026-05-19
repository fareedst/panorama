// [IMPL-MESH_API] [REQ-MESH_SCHEDULE]: Schedule API — phase 25

import { getRuntime, jsonError, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  const rt = getRuntime();
  if (!rt.meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json({ schedule: rt.schedules.get(meshId) });
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = requirePermission(request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId } = await params;
  const body = (await request.json()) as {
    mode?: "manual" | "interval" | "disabled";
    intervalMinutes?: number;
    enabled?: boolean;
  };
  const rt = getRuntime();
  if (!rt.meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json({ schedule: rt.schedules.upsert(meshId, body) });
}
