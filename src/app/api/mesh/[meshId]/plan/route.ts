// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Dry-run plan API with safety

import { getRuntime, jsonError, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";

type Params = { params: Promise<{ meshId: string }> };

export async function POST(request: Request, { params }: Params) {
  const denied = requirePermission(request, "run_sync");
  if (denied) {
    return denied;
  }
  const { meshId } = await params;
  const body = (await request.json()) as {
    sourceDepotId: string;
    targetDepotId: string;
    dryRun?: boolean;
  };
  const rt = getRuntime();
  const plan = rt.generatePlan(
    meshId,
    body.sourceDepotId,
    body.targetDepotId,
    body.dryRun !== false,
  );
  if (!plan) {
    return jsonError(400, "plan_failed", "Could not generate plan");
  }
  if ("allowed" in plan && plan.allowed === false) {
    return jsonError(400, plan.code ?? "safety_blocked", plan.message ?? "Blocked");
  }
  return Response.json({ changeSet: plan });
}
