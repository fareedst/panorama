# IMPL-MESH_PLANNING essence pseudocode

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM] [REQ-MESH_HARDENING]: Dry-run change set from inventory diff with policy filters, path mapping, and optional operation pagination.

## Summary contract

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM]: bound dry-run planning and pagination inputs

```
IMPL-MESH_PLANNING_Summary():
  INPUT: mesh; source and target inventory snapshots; filters; pathMappings; pagination offsets
  OUTPUT: ChangeSet with operations; paginated change-set slice with metadata
  DATA: uses pathMatchesFilter, applyPathMapping, allowsDelete from IMPL-MESH_POLICY
  PRE: inventory snapshots and mesh policy available
  POST: dry-run plan generated or empty plan on validation failure; pagination preserves changeSet id
  EFFECTS: pure
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
```

## GenerateDryRunPlan

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM]: how — diff source vs target inventory snapshots into copy/update/delete operations respecting mesh policy and optional filters/mappings.

```
IMPL-MESH_PLANNING_generateDryRunPlan(input):
  INPUT: { mesh, sourceInventory, targetInventory, filters?, pathMappings? }
  OUTPUT: ChangeSet { id, operations[] }
  PRE: source and target inventory snapshots available
  POST: validated change set with copy/update/delete operations or empty plan on validation error
  EFFECTS: pure
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  BUILD sourceMap and targetMap keyed by entry.path
  ASSIGN filters = input.filters OR empty
  ASSIGN mappings = input.pathMappings OR empty
  FOR EACH source file entry IN sourceMap
    IF entry.isDirectory THEN CONTINUE
    IF NOT pathMatchesFilter(path, filters) THEN CONTINUE
    DATA targetPath = applyPathMapping(path, mappings)
    DATA targetEntry = targetMap.get(targetPath)
    IF targetEntry absent THEN
      APPEND copy operation { sourcePath: path, targetPath, riskLevel: low }
      CONTINUE
    IF sourceEntry.mtimeMs AND targetEntry.mtimeMs AND sourceEntry.mtimeMs > targetEntry.mtimeMs THEN
      APPEND update operation { sourcePath: path, targetPath, riskLevel: medium }
  FOR EACH target file entry IN targetMap
    IF entry.isDirectory OR sourceMap has same path THEN CONTINUE
    IF allowsDelete(input.mesh.policy) THEN
      APPEND delete operation { sourcePath: path, riskLevel: high }
  DATA changeSet = CALL validateChangeSet({ operations })
  IF domain validation error THEN RETURN { id: "plan-empty", operations: [] }
  RETURN { ...changeSet, id: "plan-" + now timestamp }
```

## PaginateChangeSetOperations

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — slice change-set operations for oversized API responses; preserve changeSet id and return pagination metadata.

```
IMPL-MESH_PLANNING_paginateChangeSetOperations(changeSet, operationOffset?, operationLimit?):
  INPUT: changeSet, operationOffset?, operationLimit?
  OUTPUT: { changeSet, totalOperations, offset, requestedLimit?, returnedOperations }
  PRE: changeSet with operations array available
  POST: sliced operations returned with pagination metadata; unchanged when offset and limit absent
  EFFECTS: pure
  TERMINATION: total
  DATA totalOperations = changeSet.operations.length
  IF operationOffset absent AND operationLimit absent THEN
    RETURN { changeSet unchanged, totalOperations, offset: 0, returnedOperations: totalOperations }
  DATA offset = MAX(0, operationOffset OR 0)
  DATA end = IF operationLimit absent THEN undefined ELSE MAX(offset, offset + MAX(0, operationLimit))
  DATA slice = changeSet.operations.slice(offset, end)
  RETURN {
    changeSet: { ...changeSet, operations: slice },
    totalOperations,
    offset,
    requestedLimit: operationLimit OR undefined,
    returnedOperations: slice.length
  }
```
