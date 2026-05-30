# IMPL-MESH_POLICY essence pseudocode

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Path include/exclude glob filters, prefix path mapping, and delete-policy helpers for mesh sync planning and execution.

## pathMatchesFilter

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — evaluate filter list with globMatch; default allow when no filters; exclude match wins over include.

CONTRACT PathMatchesFilter
  INPUT: path string, filters Filter[]
  OUTPUT: boolean allow
  DATA: uses globMatch from neutral glob matcher (* and ?)

PROCEDURE IMPL-MESH_POLICY_pathMatchesFilter(path, filters)
  IF filters empty THEN RETURN true
  ASSIGN included = false
  ASSIGN excluded = false
  FOR EACH filter IN filters
    IF NOT globMatch(path, filter.pattern) THEN CONTINUE
    IF filter.mode = include THEN ASSIGN included = true
    IF filter.mode = exclude THEN ASSIGN excluded = true
  IF excluded THEN RETURN false
  RETURN included

## applyPathMapping

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — rewrite path when it starts with mapping.fromPrefix; first matching mapping wins.

CONTRACT ApplyPathMapping
  INPUT: path string, mappings PathMapping[]
  OUTPUT: mapped path string

PROCEDURE IMPL-MESH_POLICY_applyPathMapping(path, mappings)
  FOR EACH mapping IN mappings
    IF path starts with mapping.fromPrefix THEN
      RETURN mapping.toPrefix + remainder after fromPrefix
  RETURN path unchanged

## allowsDelete

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return true only when policy.deletePolicy = allow.

PROCEDURE IMPL-MESH_POLICY_allowsDelete(policy)
  RETURN policy.deletePolicy = "allow"

## defaultPolicy

// how — return non-destructive baseline policy (never delete, prefer_authoritative conflict, retryMaxAttempts 3, size_mtime verification).

PROCEDURE IMPL-MESH_POLICY_defaultPolicy()
  RETURN {
    deletePolicy: "never",
    conflictPolicy: "prefer_authoritative",
    retryMaxAttempts: 3,
    verificationMode: "size_mtime"
  }
