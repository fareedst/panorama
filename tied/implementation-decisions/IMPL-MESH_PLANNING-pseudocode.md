# IMPL-MESH_PLANNING essence pseudocode

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM] [REQ-MESH_HARDENING]: Dry-run change set from inventory diff with policy filters, path mapping, and optional operation pagination.

## generateDryRunPlan

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM]: how — diff source vs target inventory snapshots into copy/update/delete operations respecting mesh policy and optional filters/mappings.

CONTRACT GenerateDryRunPlan
  INPUT: { mesh, sourceInventory, targetInventory, filters?, pathMappings? }
  OUTPUT: ChangeSet { id, operations[] }
  DATA: uses pathMatchesFilter, applyPathMapping, allowsDelete from IMPL-MESH_POLICY

PROCEDURE IMPL-MESH_PLANNING_generateDryRunPlan(input)
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

## paginateChangeSetOperations

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — slice change-set operations for oversized API responses; preserve changeSet id and return pagination metadata.

CONTRACT PaginateChangeSetOperations
  INPUT: changeSet, operationOffset?, operationLimit?
  OUTPUT: { changeSet, totalOperations, offset, requestedLimit?, returnedOperations }

PROCEDURE IMPL-MESH_PLANNING_paginateChangeSetOperations(changeSet, operationOffset?, operationLimit?)
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
