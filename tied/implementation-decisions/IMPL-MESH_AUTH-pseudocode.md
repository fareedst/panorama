# IMPL-MESH_AUTH essence pseudocode

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Role-based permission matrix with audit callback on denial

## RoleMatrix

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Static ROLE_PERMISSIONS map viewer|operator|admin to MeshPermission sets; can checks membership.

CONTRACT can
  INPUT: role MeshRole; permission MeshPermission
  OUTPUT: boolean

PROCEDURE IMPL-MESH_AUTH_can(role, permission)
  RETURN permission IN ROLE_PERMISSIONS[role]

CONTRACT permissionsForRole
  INPUT: role MeshRole
  OUTPUT: MeshPermission[]

PROCEDURE IMPL-MESH_AUTH_permissionsForRole(role)
  RETURN spread of ROLE_PERMISSIONS[role]

## require

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Allow when can succeeds; otherwise audit denied entry and return permission_denied fault.

CONTRACT require
  INPUT: role MeshRole; permission MeshPermission; auditLog callback from constructor
  OUTPUT: { allowed true } | { allowed false, code permission_denied, message }

PROCEDURE IMPL-MESH_AUTH_require(role, permission)
  IF CALL can(role, permission) THEN RETURN { allowed: true }
  // [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: audit denied access before returning fault
  CALL auditLog({ timestamp, role, permission, outcome denied })
  RETURN { allowed: false, code: permission_denied, message: role cannot permission }

## parseMeshRole

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Accept viewer|operator|admin header values; default admin when header missing or unknown.

CONTRACT parseMeshRole
  INPUT: headerValue string | null from x-mesh-role
  OUTPUT: MeshRole

PROCEDURE IMPL-MESH_AUTH_parseMeshRole(headerValue)
  IF headerValue IN viewer|operator|admin THEN RETURN headerValue
  RETURN admin
