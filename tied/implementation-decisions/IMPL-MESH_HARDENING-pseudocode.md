# IMPL-MESH_HARDENING essence pseudocode

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency limiter, exponential retry delay helper, optional outbound bandwidth pacing; optimistic configurationVersion enforced via mesh-record and MeshService (cross-IMPL).

## HardeningConfig

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — default maxConcurrentOperations=4 and retryBaseDelayMs=100; optional maxBandwidthBytesPerSecond for pacing.

CONTRACT HardeningConfig
  DATA: maxConcurrentOperations (number), retryBaseDelayMs (number), maxBandwidthBytesPerSecond? (number)

PROCEDURE IMPL-MESH_HARDENING_DEFAULT_CONFIG()
  RETURN { maxConcurrentOperations: 4, retryBaseDelayMs: 100 }

## ConcurrencyLimiter

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — queue tasks when active count reaches max; release slot in finally and dequeue next waiter.

CONTRACT ConcurrencyLimiterRun
  INPUT: fn (async task)
  OUTPUT: result of fn
  CONTROL: at most max concurrent tasks active at once

PROCEDURE IMPL-MESH_HARDENING_concurrencyLimiterRun(fn)
  IF activeCount >= max THEN AWAIT until queued resolver runs
  INCREMENT activeCount
  TRY
    RETURN AWAIT fn()
  FINALLY
    DECREMENT activeCount
    IF queue non-empty THEN DEQUEUE next resolver and invoke

## retryBackoffDelay

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — exponential backoff baseMs * 2^(attempt-1) for attempt ≥ 1.

CONTRACT RetryBackoffDelay
  INPUT: attempt (1-based), baseMs
  OUTPUT: delay milliseconds

PROCEDURE IMPL-MESH_HARDENING_retryBackoffDelay(attempt, baseMs)
  RETURN baseMs * 2^(attempt - 1)

PROCEDURE IMPL-MESH_HARDENING_getRetryDelay(attempt)
  RETURN CALL IMPL-MESH_HARDENING_retryBackoffDelay(attempt, config.retryBaseDelayMs)

## throttleOutboundBytes

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — after successful copy/update, sleep ceil(bytes/bps*1000) ms when bandwidth cap configured; no-op when cap absent or bytes ≤ 0.

CONTRACT ThrottleOutboundBytes
  INPUT: approxByteCount
  OUTPUT: void (async delay)

PROCEDURE IMPL-MESH_HARDENING_throttleOutboundBytes(approxByteCount)
  IF maxBandwidthBytesPerSecond absent OR ≤ 0 OR approxByteCount ≤ 0 THEN RETURN
  DATA dwellMs = CEIL(approxByteCount / maxBandwidthBytesPerSecond * 1000)
  IF dwellMs ≤ 0 THEN RETURN
  AWAIT timer for dwellMs

## RuntimeIntegration

// [IMPL-MESH_HARDENING] [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — MeshRuntime wraps session execution in limiter.run; executeOperationWithBackoffAndThrottle applies getRetryDelay between executor retries and throttleOutboundBytes after successful transfers.

PROCEDURE IMPL-MESH_HARDENING_runtimeExecuteWithBackoff(sessionId, mesh, op, connectors)
  FOR attempt FROM 1 TO mesh.policy.retryMaxAttempts
    DATA result = CALL executor.executeOperation(op, ...)
    IF result.success OR result.skipped OR session cancelled THEN BREAK
    IF attempt < retryMaxAttempts THEN AWAIT getRetryDelay(attempt + 1) OR cancel flag
  IF result.success AND op is copy/update THEN
    DATA size = source.statEntry(op.sourcePath).size when available
    CALL IMPL-MESH_HARDENING_throttleOutboundBytes(size)

## OptimisticConfigurationVersion

// [IMPL-MESH_HARDENING] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — nextMeshRecordAfterMeshMutation bumps configurationVersion +1 with fresh updatedAt; MeshService rejects patch when expectedConfigurationVersion mismatches.

PROCEDURE IMPL-MESH_HARDENING_incrementConfigurationVersion(record, mesh)
  DATA base = normalizeMeshRecordVersion(record).configurationVersion OR 1
  RETURN record with mesh clone, updatedAt now, configurationVersion base + 1

PROCEDURE IMPL-MESH_HARDENING_rejectWhenExpectedMismatch(requestedExpected, persisted)
  IF requestedExpected set AND persisted.configurationVersion ≠ requestedExpected THEN
    RETURN { code: stale_configuration, message: "Stale mesh configurationVersion; reload and retry" }
