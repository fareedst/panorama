// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Dry-run plan API with safety

import { getRuntime, jsonError, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";
import type { ChangeSet } from "@/lib/mesh/domain";
import { paginateChangeSetOperations } from "@/lib/mesh/services/planning-service";

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
    operationOffset?: number;
    operationLimit?: number;
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
  const changeSet = plan as ChangeSet;
  const page = paginateChangeSetOperations(
    changeSet,
    body.operationOffset,
    body.operationLimit,
  );
  return Response.json({
    changeSet: page.changeSet,
    operationTotalCount: page.totalOperations,
    operationReturnedCount: page.returnedOperations,
    operationOffset: page.offset,
    operationRequestedLimit: page.requestedLimit ?? null,
  });
}
