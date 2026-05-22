# IMPL-MESH_PLANNING essence pseudocode

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Dry-run change set from inventory diff

## generateDryRunPlan

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — diff source vs target inventory snapshots into copy/update/delete **change set** respecting mesh **policy**.

PROCEDURE IMPL-MESH_PLANNING_generateDryRunPlan({ mesh, sourceInventory, targetInventory })
  FOR each source file
    IF missing on target THEN add copy operation
    IF different hash THEN add update
  FOR each target-only file per policy
    MAY add delete operation
  RETURN ChangeSet with operations array and summary counts

## paginateChangeSetOperations

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Optional offset/limit slicing for oversized change-set responses returned via plan APIs.

PROCEDURE IMPL-MESH_PLANNING_paginateChangeSetOperations(changeSet, offset optional, limit optional)
  IF offset absent AND limit absent THEN RETURN full changeSet
  ELSE slice operations array contiguously preserving changeSet identifiers for bookkeeping
