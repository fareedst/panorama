# IMPL-MESH_HARDENING essence pseudocode

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency limits and retry policy for executor

## acquireSlot / releaseSlot

// how: Limit concurrent operations per mesh to maxConcurrent.

PROCEDURE IMPL-MESH_HARDENING_acquireSlot(meshId)
  IF activeCount >= maxConcurrent THEN RETURN false
  INCREMENT activeCount; RETURN true

## shouldRetry

PROCEDURE IMPL-MESH_HARDENING_shouldRetry(attempt, error)
  IF attempt >= maxRetries THEN RETURN false
  RETURN retryable error codes
