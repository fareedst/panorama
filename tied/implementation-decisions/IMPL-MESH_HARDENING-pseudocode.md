# IMPL-MESH_HARDENING essence pseudocode

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency limits and retry policy for executor

## acquireSlot / releaseSlot

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — limit concurrent operations per mesh via activeCount vs maxConcurrent pairing.

PROCEDURE IMPL-MESH_HARDENING_acquireSlot(meshId)
  IF activeCount >= maxConcurrent THEN RETURN false
  INCREMENT activeCount; RETURN true

## shouldRetry

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Decide whether executor failures warrant another attempt before giving up.

PROCEDURE IMPL-MESH_HARDENING_shouldRetry(attempt, error)
  IF attempt >= maxRetries THEN RETURN false
  RETURN retryable error codes

## backoffBetweenExecutorAttempts

// [IMPL-MESH_HARDENING] [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Pause-aware delay before next executor attempt increases exponentially using HardeningService retries.

PROCEDURE IMPL-MESH_HARDENING_delayBeforeNextAttempt(scheduledAttemptIndex)
  READ baseRetryMs FROM config
  COMPUTE backoff := baseRetryMs * 2^(scheduledAttemptIndex-1)
  AWAIT timers until elapsed OR cancellation flag clears session

## throttleOutboundApproxBytes

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Optional bandwidth pacing after successful transfers using approximated connector byte counts.

PROCEDURE IMPL-MESH_HARDENING_throttleOutboundBytes(bytesApprox)
  IF maxBandwidthBytesPerSecond absent THEN RETURN
  COMPUTE dwellMs FROM bytesApprox divided by bandwidth cap
  AWAIT timers for dwellMs

## optimisticConfigurationVersionBump

// [IMPL-MESH_HARDENING] [IMPL-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Increase mesh configurationVersion atomically alongside mesh mutations surfaced through MeshService depot-service and API callers.

PROCEDURE IMPL-MESH_HARDENING_incrementConfigurationVersion(previousRecord)
  RETURN previousRecord.configurationVersion OR 1 plus one with fresh updatedAt stamp

PROCEDURE IMPL-MESH_HARDENING_rejectWhenExpectedMismatch(requestedExpected, persisted)
  IF requestedExpected set AND persisted.configurationVersion mismatches THEN RETURN stale_configuration fault
