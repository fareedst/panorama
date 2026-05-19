# IMPL-MESH_AUTH essence pseudocode

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Role-based permission matrix with audit callback

## RoleMatrix

// how: Static ROLE_PERMISSIONS map viewer|operator|admin to permission sets.

CONTRACT can
  INPUT: role MeshRole; permission MeshPermission
  OUTPUT: boolean

PROCEDURE IMPL-MESH_AUTH_can(role, permission)
  RETURN permission IN ROLE_PERMISSIONS[role]

## require

// how: Deny with code when permission missing; audit on deny via constructor callback.

CONTRACT require
  INPUT: role; permission
  OUTPUT: { allowed true } | { allowed false, code, message }

PROCEDURE IMPL-MESH_AUTH_require(role, permission)
  IF CALL can(role, permission) THEN RETURN { allowed: true }
  // [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: audit denied access
  CALL auditLog(denied entry)
  RETURN { allowed: false, code: permission_denied }

## parseMeshRole

// how: Default viewer when header missing or unknown.

PROCEDURE IMPL-MESH_AUTH_parseMeshRole(header)
  IF header IN viewer|operator|admin THEN RETURN header
  RETURN viewer
