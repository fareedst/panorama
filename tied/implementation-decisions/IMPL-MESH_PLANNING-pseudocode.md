# IMPL-MESH_PLANNING essence pseudocode

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Dry-run change set from inventory diff

## generateDryRunPlan

// how: Compare source and target inventory listings; emit copy/update/delete operations per policy.

PROCEDURE IMPL-MESH_PLANNING_generateDryRunPlan({ mesh, sourceInventory, targetInventory })
  FOR each source file
    IF missing on target THEN add copy operation
    IF different hash THEN add update
  FOR each target-only file per policy
    MAY add delete operation
  RETURN ChangeSet with operations array and summary counts
