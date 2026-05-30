// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Role-based permission matrix with audit callback on denial

export type MeshRole = "viewer" | "operator" | "admin";

export type MeshPermission =
  | "view_mesh"
  | "create_mesh"
  | "edit_mesh"
  | "run_sync"
  | "pause_cancel_sync"
  | "resolve_conflict"
  | "manage_credentials"
  | "delete_mesh"
  | "view_logs"
  | "administer_connectors";

const ROLE_PERMISSIONS: Record<MeshRole, ReadonlySet<MeshPermission>> = {
  viewer: new Set(["view_mesh", "view_logs"]),
  operator: new Set([
    "view_mesh",
    "view_logs",
    "run_sync",
    "pause_cancel_sync",
    "resolve_conflict",
  ]),
  admin: new Set([
    "view_mesh",
    "create_mesh",
    "edit_mesh",
    "run_sync",
    "pause_cancel_sync",
    "resolve_conflict",
    "manage_credentials",
    "delete_mesh",
    "view_logs",
    "administer_connectors",
  ]),
};

export class AuthorizationService {
  constructor(private readonly auditLog: (entry: AuditEntry) => void = () => {}) {}

  // [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Static ROLE_PERMISSIONS map viewer|operator|admin to MeshPermission sets; can checks membership.
  can(role: MeshRole, permission: MeshPermission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
  }

  // [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Allow when can succeeds; otherwise audit denied entry and return permission_denied fault.
  require(role: MeshRole, permission: MeshPermission): AuthorizationResult {
    if (this.can(role, permission)) {
      return { allowed: true };
    }
    this.auditLog({
      timestamp: new Date().toISOString(),
      role,
      permission,
      outcome: "denied",
    });
    return {
      allowed: false,
      code: "permission_denied",
      message: `Role ${role} cannot ${permission}`,
    };
  }

  permissionsForRole(role: MeshRole): MeshPermission[] {
    return [...ROLE_PERMISSIONS[role]];
  }
}

export type AuthorizationResult = {
  allowed: boolean;
  code?: string;
  message?: string;
};

export type AuditEntry = {
  timestamp: string;
  role: MeshRole;
  permission: MeshPermission;
  outcome: "denied" | "allowed";
  subject?: string;
};

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Accept viewer|operator|admin header values; default admin when header missing or unknown.
export function parseMeshRole(headerValue: string | null): MeshRole {
  if (headerValue === "viewer" || headerValue === "operator" || headerValue === "admin") {
    return headerValue;
  }
  return "admin";
}
