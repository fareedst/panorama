// [IMPL-MESH_API] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: Credential reference API — POST body supplies label (optional explicit id); domain validator allocates id when omitted ([IMPL-MESH_DOMAIN_TYPES] resolveEntityId)

import { getRuntime, jsonError, requirePermission } from "@/lib/mesh/api/mesh-api-helpers";
import { isDomainValidationError } from "@/lib/mesh/domain";

export async function POST(request: Request) {
  const denied = requirePermission(request, "manage_credentials");
  if (denied) {
    return denied;
  }
  const body = (await request.json()) as { label?: string };
  const created = getRuntime().credentials.create({ label: body.label ?? "credential" });
  if (isDomainValidationError(created)) {
    return jsonError(400, created.code, created.message);
  }
  return Response.json({ credential: created }, { status: 201 });
}
