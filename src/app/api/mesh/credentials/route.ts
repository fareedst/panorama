// [IMPL-MESH_API] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: POST creates credential reference after manage_credentials permission; response omits secret material.

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
