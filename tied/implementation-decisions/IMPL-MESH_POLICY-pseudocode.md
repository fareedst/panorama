# IMPL-MESH_POLICY essence pseudocode

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Path include/exclude glob filters, prefix path mapping, and delete-policy helpers for mesh sync planning and execution.

## Summary contract

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound filter, mapping, and delete-policy helpers for planning and execution

```
IMPL-MESH_POLICY_Summary():
  INPUT: path string; filters Filter[]; mappings PathMapping[]; mesh policy
  OUTPUT: allow boolean; mapped path; delete allowed boolean; default policy object
  DATA: uses globMatch from neutral glob matcher (* and ?)
  PRE: path and policy inputs available
  POST: filter evaluation, mapping rewrite, and delete policy checks applied
  EFFECTS: pure
  TERMINATION: total
```

## PathMatchesFilter

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — evaluate filter list with globMatch; default allow when no filters; exclude match wins over include.

```
IMPL-MESH_POLICY_pathMatchesFilter(path, filters):
  INPUT: path string, filters Filter[]
  OUTPUT: boolean allow
  PRE: path non-empty
  POST: true when no filters or include match without exclude; false when excluded
  EFFECTS: pure
  TERMINATION: total
  IF filters empty THEN RETURN true
  ASSIGN included = false
  ASSIGN excluded = false
  FOR EACH filter IN filters
    IF NOT globMatch(path, filter.pattern) THEN CONTINUE
    IF filter.mode = include THEN ASSIGN included = true
    IF filter.mode = exclude THEN ASSIGN excluded = true
  IF excluded THEN RETURN false
  RETURN included
```

## ApplyPathMapping

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — rewrite path when it starts with mapping.fromPrefix; first matching mapping wins.

```
IMPL-MESH_POLICY_applyPathMapping(path, mappings):
  INPUT: path string, mappings PathMapping[]
  OUTPUT: mapped path string
  PRE: path available
  POST: first matching prefix mapping applied or path unchanged
  EFFECTS: pure
  TERMINATION: total
  FOR EACH mapping IN mappings
    IF path starts with mapping.fromPrefix THEN
      RETURN mapping.toPrefix + remainder after fromPrefix
  RETURN path unchanged
```

## AllowsDelete

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return true only when policy.deletePolicy = allow.

```
IMPL-MESH_POLICY_allowsDelete(policy):
  INPUT: mesh policy object
  OUTPUT: boolean
  PRE: policy.deletePolicy set
  POST: true only when deletePolicy equals allow
  EFFECTS: pure
  TERMINATION: total
  RETURN policy.deletePolicy = "allow"
```

## DefaultPolicy

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return non-destructive baseline policy (never delete, prefer_authoritative conflict, retryMaxAttempts 3, size_mtime verification).

```
IMPL-MESH_POLICY_defaultPolicy():
  INPUT: none
  OUTPUT: default mesh policy object
  PRE: none
  POST: non-destructive baseline policy returned
  EFFECTS: pure
  TERMINATION: total
  RETURN {
    deletePolicy: "never",
    conflictPolicy: "prefer_authoritative",
    retryMaxAttempts: 3,
    verificationMode: "size_mtime"
  }
```
