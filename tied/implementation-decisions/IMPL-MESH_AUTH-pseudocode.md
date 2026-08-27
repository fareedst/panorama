# IMPL-MESH_AUTH essence pseudocode

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Role-based permission matrix with audit callback on denial

## Summary contract

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: bound role matrix inputs, outputs, and audit callback for all auth blocks below

```
IMPL-MESH_AUTH_Summary():
  INPUT: role MeshRole; permission MeshPermission; x-mesh-role header value
  OUTPUT: boolean allow checks; permission lists; require faults; parsed MeshRole
  DATA: ROLE_PERMISSIONS map viewer|operator|admin → MeshPermission sets
  PRE: role and permission enums available
  POST: can/require/parseMeshRole enforce matrix and audit denials
  EFFECTS: IO (audit callback on denial)
  FAILURE_MODES: PERMISSION_DENIED
  TERMINATION: total
```

## Can

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Static ROLE_PERMISSIONS map viewer|operator|admin to MeshPermission sets; can checks membership.

```
IMPL-MESH_AUTH_can(role, permission):
  INPUT: role MeshRole; permission MeshPermission
  OUTPUT: boolean
  PRE: role exists in ROLE_PERMISSIONS
  POST: returns true when permission in role set else false
  EFFECTS: pure
  TERMINATION: total
  RETURN permission IN ROLE_PERMISSIONS[role]
```

## PermissionsForRole

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: return spread of permissions granted to role

```
IMPL-MESH_AUTH_permissionsForRole(role):
  INPUT: role MeshRole
  OUTPUT: MeshPermission[]
  PRE: role exists in ROLE_PERMISSIONS
  POST: full permission list for role returned
  EFFECTS: pure
  TERMINATION: total
  RETURN spread of ROLE_PERMISSIONS[role]
```

## Require

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Allow when can succeeds; otherwise audit denied entry and return permission_denied fault.

```
IMPL-MESH_AUTH_require(role, permission):
  INPUT: role MeshRole; permission MeshPermission; auditLog callback from constructor
  OUTPUT: { allowed true } | { allowed false, code permission_denied, message }
  PRE: auditLog callback available on denial path
  POST: allowed true when can succeeds; otherwise audited denial fault returned
  EFFECTS: IO
  FAILURE_MODES: PERMISSION_DENIED
  TERMINATION: total
  IF CALL can(role, permission) THEN RETURN { allowed: true }
  CALL auditLog({ timestamp, role, permission, outcome denied })
  RETURN { allowed: false, code: permission_denied, message: role cannot permission }
```

## ParseMeshRole

// [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: how: Accept viewer|operator|admin header values; default admin when header missing or unknown.

```
IMPL-MESH_AUTH_parseMeshRole(headerValue):
  INPUT: headerValue string | null from x-mesh-role
  OUTPUT: MeshRole
  PRE: header parsed from request
  POST: known role returned; admin default for missing or unknown values
  EFFECTS: pure
  TERMINATION: total
  IF headerValue IN viewer|operator|admin THEN RETURN headerValue
  RETURN admin
```
