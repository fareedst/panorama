// [IMPL-MESH_API] [REQ-MESH_MONITORING]: Monitoring dashboard API — phase 26

import { getRuntime, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";

export async function GET(request: Request) {
  const denied = requirePermission(request, "view_logs");
  if (denied) {
    return denied;
  }
  const rt = getRuntime();
  return Response.json({ summary: rt.getMonitoringSummary() });
}
