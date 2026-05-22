// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: API helpers — runtime, auth, and service error mapping

import { isDomainValidationError } from "../domain";
import type { MeshServiceError } from "../services/mesh-service";
import {
  parseMeshRole,
  type MeshPermission,
  type MeshRole,
} from "../services/authorization-service";
import { getMeshRuntime } from "../runtime/mesh-runtime";

export function getRuntime() {
  return getMeshRuntime();
}

export function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export function getRoleFromRequest(request: Request): MeshRole {
  return parseMeshRole(request.headers.get("x-mesh-role"));
}

// [IMPL-MESH_API] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: requirePermission — 403 when role lacks permission
export function requirePermission(
  request: Request,
  permission: MeshPermission,
): Response | null {
  const role = getRoleFromRequest(request);
  const rt = getRuntime();
  const result = rt.authorize(role, permission);
  if (!result.allowed) {
    return jsonError(403, result.code ?? "permission_denied", result.message ?? "Forbidden");
  }
  return null;
}

export function handleServiceResult<T>(
  result: T | MeshServiceError | { code: string; message: string; path?: string },
) {
  if (isDomainValidationError(result)) {
    return jsonError(400, result.code, result.message);
  }
  if (
    result &&
    typeof result === "object" &&
    "code" in result &&
    "message" in result &&
    !("mesh" in result)
  ) {
    const err = result as { code: string; message: string };
    const status =
      err.code === "mesh_not_found"
        ? 404
        : err.code === "stale_configuration"
          ? 409
          : 400;
    return jsonError(status, err.code, err.message);
  }
  return null;
}
