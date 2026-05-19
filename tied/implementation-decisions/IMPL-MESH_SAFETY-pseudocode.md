# IMPL-MESH_SAFETY essence pseudocode

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: Guardrails before plan execution and destructive ops

## MeshSafetyProfile

// how: Per-mesh profile tracks dry-run completion and successful sync count.

PROCEDURE IMPL-MESH_SAFETY_getProfile(meshId)
  RETURN profile from map or defaults

## checkTopologySafe

// how: Delegate to validateTopology; block when cycle.

PROCEDURE IMPL-MESH_SAFETY_checkTopologySafe(mesh)
  DATA validation = CALL validateTopology(mesh)
  IF validation.hasCycle THEN RETURN { allowed: false, topology_cycle }
  RETURN { allowed: true }

## checkCanGeneratePlan

// how: Dry-run always allowed; live plan requires prior dry-run when not isDryRun.

PROCEDURE IMPL-MESH_SAFETY_checkCanGeneratePlan(meshId, isDryRun)
  IF isDryRun THEN RETURN allowed
  IF NOT profile.hasCompletedDryRun THEN RETURN dry_run_required
  RETURN allowed

## checkCanExecutePlan

// how: Enforce first_sync_requires_dry_run and large_delete confirmation threshold.

PROCEDURE IMPL-MESH_SAFETY_checkCanExecutePlan(meshId, changeSet, options)
  IF NOT profile.hasCompletedDryRun THEN RETURN dry_run_required
  COUNT destructive ops in changeSet
  IF count >= LARGE_DELETE_THRESHOLD AND NOT options.confirmedDestructive
    THEN RETURN { allowed: false, requiresConfirmation: true }
  RETURN allowed
