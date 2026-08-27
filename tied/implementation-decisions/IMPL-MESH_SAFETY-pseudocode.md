# IMPL-MESH_SAFETY essence pseudocode

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: Guardrails before plan generation and execution

## Summary contract

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: bound safety profiles, plan/execution gates, and quarantine controls

```
IMPL-MESH_SAFETY_Summary():
  INPUT: meshId; mesh; changeSet; options { confirmedDestructive, isDryRun }; path
  OUTPUT: SafetyCheckResult; updated safety profiles; quarantine membership
  DATA: profiles map keyed by meshId; quarantinePaths set; LARGE_DELETE_THRESHOLD = 10
  PRE: mesh and changeSet available for safety checks
  POST: topology, dry-run, destructive, and quarantine gates evaluated; profiles updated on dry-run or successful sync
  EFFECTS: State
  FAILURE_MODES: TOPOLOGY_CYCLE; DRY_RUN_REQUIRED; LARGE_DELETE_CONFIRMATION; DESTRUCTIVE_CONFIRMATION; QUARANTINE_BLOCKED
  TERMINATION: total
```

## MeshSafetyProfile

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: per-mesh profile tracks dry-run completion and successful sync count with defaults when unseen.

```
IMPL-MESH_SAFETY_getProfile(meshId):
  INPUT: meshId
  OUTPUT: { hasCompletedDryRun, successfulSyncCount }
  PRE: meshId available
  POST: stored profile or default returned
  EFFECTS: pure
  TERMINATION: total
  RETURN profile from map OR { hasCompletedDryRun: false, successfulSyncCount: 0 }
```

## RecordDryRun

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: mark mesh as having completed at least one dry-run plan.

```
IMPL-MESH_SAFETY_recordDryRun(meshId):
  INPUT: meshId
  OUTPUT: updated profile in map
  PRE: meshId available
  POST: hasCompletedDryRun set true on profile
  EFFECTS: State
  TERMINATION: total
  MERGE profile hasCompletedDryRun true into profiles map
```

## RecordSuccessfulSync

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: increment successfulSyncCount and ensure hasCompletedDryRun true.

```
IMPL-MESH_SAFETY_recordSuccessfulSync(meshId):
  INPUT: meshId
  OUTPUT: updated profile in map
  PRE: meshId available
  POST: successfulSyncCount incremented; hasCompletedDryRun true
  EFFECTS: State
  TERMINATION: total
  INCREMENT successfulSyncCount on profile
  SET hasCompletedDryRun true
```

## CheckTopologySafe

// [IMPL-MESH_SAFETY] [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: delegate to validateTopology; block when cycle detected.

```
IMPL-MESH_SAFETY_checkTopologySafe(mesh):
  INPUT: mesh
  OUTPUT: SafetyCheckResult
  PRE: mesh topology graph available
  POST: allowed false when cycle detected else allowed true
  EFFECTS: pure
  FAILURE_MODES: TOPOLOGY_CYCLE
  TERMINATION: total
  DATA validation = CALL validateTopology(mesh)
  IF validation.hasCycle THEN RETURN { allowed: false, code: topology_cycle, message }
  RETURN { allowed: true }
```

## CheckCanGeneratePlan

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: dry-run always allowed; live plan requires prior dry-run when isDryRun false.

```
IMPL-MESH_SAFETY_checkCanGeneratePlan(meshId, isDryRun):
  INPUT: meshId, isDryRun default true
  OUTPUT: SafetyCheckResult
  PRE: safety profile available for meshId
  POST: dry-run always allowed; live plan blocked until dry-run completed
  EFFECTS: pure
  FAILURE_MODES: DRY_RUN_REQUIRED
  TERMINATION: total
  IF isDryRun THEN RETURN { allowed: true }
  IF NOT profile.hasCompletedDryRun THEN RETURN { allowed: false, code: dry_run_required }
  RETURN { allowed: true }
```

## CheckCanExecutePlan

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: enforce dry-run prerequisite, large delete threshold, high-risk confirmation, and quarantine blocks.

```
IMPL-MESH_SAFETY_checkCanExecutePlan(meshId, changeSet, options):
  INPUT: meshId, changeSet, options { confirmedDestructive, isDryRun }
  OUTPUT: SafetyCheckResult with optional requiresConfirmation
  PRE: changeSet operations available
  POST: execution allowed or blocked with confirmation requirement or quarantine fault
  EFFECTS: pure
  FAILURE_MODES: DRY_RUN_REQUIRED; LARGE_DELETE_CONFIRMATION; DESTRUCTIVE_CONFIRMATION; QUARANTINE_BLOCKED
  TERMINATION: total
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
```

## QuarantinePath

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: add path to quarantine set blocking future execution.

```
IMPL-MESH_SAFETY_quarantinePath(path):
  INPUT: path string
  OUTPUT: path added to quarantine set
  PRE: path non-empty
  POST: path present in quarantinePaths set
  EFFECTS: State
  TERMINATION: total
  ADD path to quarantinePaths set
```

## IsQuarantined

// [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: how: test whether path is in quarantine set.

```
IMPL-MESH_SAFETY_isQuarantined(path):
  INPUT: path string
  OUTPUT: boolean
  PRE: quarantinePaths set available
  POST: true when path in quarantine set
  EFFECTS: pure
  TERMINATION: total
  RETURN quarantinePaths has path
```
