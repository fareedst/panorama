// [IMPL-MESH_AUTH] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Roles and permissions — phase 24

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

  can(role: MeshRole, permission: MeshPermission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
  }

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

export function parseMeshRole(headerValue: string | null): MeshRole {
  if (headerValue === "viewer" || headerValue === "operator" || headerValue === "admin") {
    return headerValue;
  }
  return "admin";
}
