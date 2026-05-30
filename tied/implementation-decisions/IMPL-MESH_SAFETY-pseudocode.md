# IMPL-MESH_SAFETY essence pseudocode

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: Guardrails before plan generation and execution

## MeshSafetyProfile

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: per-mesh profile tracks dry-run completion and successful sync count with defaults when unseen.

CONTRACT MeshSafetyProfile
  INPUT: meshId
  OUTPUT: { hasCompletedDryRun, successfulSyncCount }
  DATA: profiles map keyed by meshId

PROCEDURE IMPL-MESH_SAFETY_getProfile(meshId)
  RETURN profile from map OR { hasCompletedDryRun: false, successfulSyncCount: 0 }

## recordDryRun

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: mark mesh as having completed at least one dry-run plan.

PROCEDURE IMPL-MESH_SAFETY_recordDryRun(meshId)
  MERGE profile hasCompletedDryRun true into profiles map

## recordSuccessfulSync

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: increment successfulSyncCount and ensure hasCompletedDryRun true.

PROCEDURE IMPL-MESH_SAFETY_recordSuccessfulSync(meshId)
  INCREMENT successfulSyncCount on profile
  SET hasCompletedDryRun true

## checkTopologySafe

// [IMPL-MESH_SAFETY] [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: delegate to validateTopology; block when cycle detected.

CONTRACT checkTopologySafe
  INPUT: mesh
  OUTPUT: SafetyCheckResult

PROCEDURE IMPL-MESH_SAFETY_checkTopologySafe(mesh)
  DATA validation = CALL validateTopology(mesh)
  IF validation.hasCycle THEN RETURN { allowed: false, code: topology_cycle, message }
  RETURN { allowed: true }

## checkCanGeneratePlan

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: dry-run always allowed; live plan requires prior dry-run when isDryRun false.

CONTRACT checkCanGeneratePlan
  INPUT: meshId, isDryRun default true
  OUTPUT: SafetyCheckResult

PROCEDURE IMPL-MESH_SAFETY_checkCanGeneratePlan(meshId, isDryRun)
  IF isDryRun THEN RETURN { allowed: true }
  IF NOT profile.hasCompletedDryRun THEN RETURN { allowed: false, code: dry_run_required }
  RETURN { allowed: true }

## checkCanExecutePlan

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: enforce dry-run prerequisite, large delete threshold, high-risk confirmation, and quarantine blocks.

CONTRACT checkCanExecutePlan
  INPUT: meshId, changeSet, options { confirmedDestructive, isDryRun }
  OUTPUT: SafetyCheckResult with optional requiresConfirmation
  DATA: LARGE_DELETE_THRESHOLD = 10, quarantinePaths set

PROCEDURE IMPL-MESH_SAFETY_checkCanExecutePlan(meshId, changeSet, options)
  IF options.isDryRun THEN RETURN { allowed: true }
  DATA dryRunCheck = checkCanGeneratePlan(meshId, false)
  IF NOT dryRunCheck.allowed THEN RETURN dryRunCheck
  COUNT deletes = operations where kind delete
  COUNT highRisk = operations where riskLevel high
  IF deletes.length >= LARGE_DELETE_THRESHOLD AND NOT options.confirmedDestructive
    THEN RETURN { allowed: false, code: large_delete_confirmation_required, requiresConfirmation: true }
  IF highRisk.length > 0 AND NOT options.confirmedDestructive
    THEN RETURN { allowed: false, code: destructive_confirmation_required, requiresConfirmation: true }
  FOR each op in changeSet.operations
    IF isQuarantined(op.sourcePath) THEN RETURN { allowed: false, code: quarantine_blocked }
  RETURN { allowed: true }

## quarantinePath

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: add path to quarantine set blocking future execution.

PROCEDURE IMPL-MESH_SAFETY_quarantinePath(path)
  ADD path to quarantinePaths set

## isQuarantined

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: test whether path is in quarantine set.

PROCEDURE IMPL-MESH_SAFETY_isQuarantined(path)
  RETURN quarantinePaths has path
