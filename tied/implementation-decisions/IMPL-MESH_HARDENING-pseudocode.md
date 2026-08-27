# IMPL-MESH_HARDENING essence pseudocode

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency limiter, exponential retry delay helper, optional outbound bandwidth pacing; optimistic configurationVersion enforced via mesh-record and MeshService (cross-IMPL).

## Summary contract

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: bound concurrency, retry backoff, bandwidth pacing, and configurationVersion helpers

```
IMPL-MESH_HARDENING_Summary():
  INPUT: async task fn; retry attempt; byte count; mesh record mutations; expectedConfigurationVersion
  OUTPUT: task result; delay ms; throttled wait; bumped configurationVersion; stale_configuration fault
  DATA: maxConcurrentOperations=4; retryBaseDelayMs=100; optional maxBandwidthBytesPerSecond
  PRE: hardening config and runtime integration points available
  POST: concurrency limited execution; backoff delays computed; outbound bytes paced; version mismatch rejected
  EFFECTS: IO, State
  FAILURE_MODES: STALE_CONFIGURATION
  TERMINATION: total
```

## HardeningConfig

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — default maxConcurrentOperations=4 and retryBaseDelayMs=100; optional maxBandwidthBytesPerSecond for pacing.

```
IMPL-MESH_HARDENING_DEFAULT_CONFIG():
  INPUT: none
  OUTPUT: HardeningConfig { maxConcurrentOperations, retryBaseDelayMs, maxBandwidthBytesPerSecond? }
  PRE: none
  POST: default hardening config returned
  EFFECTS: pure
  TERMINATION: total
  RETURN { maxConcurrentOperations: 4, retryBaseDelayMs: 100 }
```

## ConcurrencyLimiterRun

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — queue tasks when active count reaches max; release slot in finally and dequeue next waiter.

```
IMPL-MESH_HARDENING_concurrencyLimiterRun(fn):
  INPUT: fn (async task)
  OUTPUT: result of fn
  PRE: limiter initialized with max concurrent slots
  POST: at most max concurrent tasks active; queued tasks run when slot freed
  EFFECTS: IO, State
  TERMINATION: total
  IF activeCount >= max THEN AWAIT until queued resolver runs
  INCREMENT activeCount
  TRY
    RETURN AWAIT fn()
  FINALLY
    DECREMENT activeCount
    IF queue non-empty THEN DEQUEUE next resolver and invoke
```

## RetryBackoffDelay

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — exponential backoff baseMs * 2^(attempt-1) for attempt ≥ 1.

```
IMPL-MESH_HARDENING_retryBackoffDelay(attempt, baseMs):
  INPUT: attempt (1-based), baseMs
  OUTPUT: delay milliseconds
  PRE: attempt >= 1 and baseMs positive
  POST: exponential backoff delay computed
  EFFECTS: pure
  TERMINATION: total
  RETURN baseMs * 2^(attempt - 1)

IMPL-MESH_HARDENING_getRetryDelay(attempt):
  INPUT: attempt (1-based)
  OUTPUT: delay milliseconds from configured retryBaseDelayMs
  PRE: hardening config available
  POST: retry delay returned via retryBackoffDelay helper
  EFFECTS: pure
  TERMINATION: total
  RETURN CALL IMPL-MESH_HARDENING_retryBackoffDelay(attempt, config.retryBaseDelayMs)
```

## ThrottleOutboundBytes

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — after successful copy/update, sleep ceil(bytes/bps*1000) ms when bandwidth cap configured; no-op when cap absent or bytes ≤ 0.

```
IMPL-MESH_HARDENING_throttleOutboundBytes(approxByteCount):
  INPUT: approxByteCount
  OUTPUT: void (async delay)
  PRE: optional maxBandwidthBytesPerSecond configured
  POST: async dwell applied when cap configured and bytes positive
  EFFECTS: IO
  TERMINATION: total
  IF maxBandwidthBytesPerSecond absent OR ≤ 0 OR approxByteCount ≤ 0 THEN RETURN
  DATA dwellMs = CEIL(approxByteCount / maxBandwidthBytesPerSecond * 1000)
  IF dwellMs ≤ 0 THEN RETURN
  AWAIT timer for dwellMs
```

## RuntimeIntegration

// [IMPL-MESH_HARDENING] [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — MeshRuntime wraps session execution in limiter.run; executeOperationWithBackoffAndThrottle applies getRetryDelay between executor retries and throttleOutboundBytes after successful transfers.

```
IMPL-MESH_HARDENING_runtimeExecuteWithBackoff(sessionId, mesh, op, connectors):
  INPUT: sessionId; mesh; SyncOperation; source and target connectors
  OUTPUT: OperationResult after retries and optional throttle
  PRE: mesh.policy.retryMaxAttempts configured; executor available
  POST: operation retried with backoff until success, skip, cancel, or max attempts; outbound bytes throttled on successful copy/update
  EFFECTS: IO, State
  TERMINATION: total
  FOR attempt FROM 1 TO mesh.policy.retryMaxAttempts
    DATA result = CALL executor.executeOperation(op, ...)
    IF result.success OR result.skipped OR session cancelled THEN BREAK
    IF attempt < retryMaxAttempts THEN AWAIT getRetryDelay(attempt + 1) OR cancel flag
  IF result.success AND op is copy/update THEN
    DATA size = source.statEntry(op.sourcePath).size when available
    CALL IMPL-MESH_HARDENING_throttleOutboundBytes(size)
```

## OptimisticConfigurationVersion

// [IMPL-MESH_HARDENING] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — nextMeshRecordAfterMeshMutation bumps configurationVersion +1 with fresh updatedAt; MeshService rejects patch when expectedConfigurationVersion mismatches.

```
IMPL-MESH_HARDENING_incrementConfigurationVersion(record, mesh):
  INPUT: persisted record; updated mesh payload
  OUTPUT: record with bumped configurationVersion and updatedAt
  PRE: record normalized via normalizeMeshRecordVersion
  POST: configurationVersion incremented by one with fresh updatedAt
  EFFECTS: State
  DATA_TRANSITION: mesh record version bumped for optimistic concurrency
  TERMINATION: total
  DATA base = normalizeMeshRecordVersion(record).configurationVersion OR 1
  RETURN record with mesh clone, updatedAt now, configurationVersion base + 1

IMPL-MESH_HARDENING_rejectWhenExpectedMismatch(requestedExpected, persisted):
  INPUT: requestedExpected configurationVersion; persisted record
  OUTPUT: null when match | stale_configuration fault
  PRE: persisted record includes configurationVersion
  POST: null when versions match or expected unset; stale fault when mismatch
  EFFECTS: pure
  FAILURE_MODES: STALE_CONFIGURATION
  TERMINATION: total
  IF requestedExpected set AND persisted.configurationVersion ≠ requestedExpected THEN
    RETURN { code: stale_configuration, message: "Stale mesh configurationVersion; reload and retry" }
```
