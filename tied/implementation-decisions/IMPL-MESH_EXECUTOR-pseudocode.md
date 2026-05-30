# IMPL-MESH_EXECUTOR essence pseudocode

// [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [IMPL-MESH_EVENTS] [REQ-MESH_PLATFORM]: Execute approved sync operations via source/target connectors; optional EventService emits operation lifecycle events.

## executeOperation

// [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [IMPL-MESH_EVENTS] [REQ-MESH_PLATFORM]: how — run one SyncOperation through connectors; honor delete policy; emit started/completed/failed events.

CONTRACT ExecuteOperation
  INPUT: operation, source Connector, target Connector, policy, optional EventService
  OUTPUT: OperationResult { operationId, success, error?, attempts, skipped? }

PROCEDURE IMPL-MESH_EXECUTOR_executeOperation(operation, source, target, policy, events?)
  CALL events.recordOperationStarted(operation.id) when events present
  IF operation.kind = delete AND NOT allowsDelete(policy) THEN
    CALL events.recordOperationFailed(operation.id, "delete blocked by policy") when events present
    RETURN { operationId, success: false, error: "delete blocked by policy", attempts: 1, skipped: true }
  SWITCH operation.kind
    CASE copy OR update:
      DATA data = source.readFile(operation.sourcePath)
      IF connector error THEN
        DATA result = { success: false, error: connector message, attempts: 1 }
        BREAK
      ASSIGN targetPath = operation.targetPath OR operation.sourcePath
      DATA writeErr = target.writeFile(targetPath, data)
      IF connector error THEN result = { success: false, error: writeErr message, attempts: 1 }
      ELSE result = { success: true, attempts: 1 }
    CASE delete:
      DATA delErr = target.deleteFile(operation.sourcePath)
      IF connector error THEN result = { success: false, error: delErr message, attempts: 1 }
      ELSE result = { success: true, attempts: 1 }
    DEFAULT mkdir OR verify OR unknown:
      result = { success: true, attempts: 1, skipped: true }
  IF result.success THEN CALL events.recordOperationCompleted(operation.id) when events present
  ELSE CALL events.recordOperationFailed(operation.id, result.error OR "unknown") when events present
  RETURN result with operationId

## executeChangeSet

// [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — iterate change set operations in order; retry failed (non-skipped) ops up to policy.retryMaxAttempts; record final attempt count per op.

CONTRACT ExecuteChangeSet
  INPUT: changeSet, source Connector, target Connector, policy, maxAttempts = policy.retryMaxAttempts
  OUTPUT: OperationResult[] (one per operation, in order)

PROCEDURE IMPL-MESH_EXECUTOR_executeChangeSet(changeSet, source, target, policy, maxAttempts)
  DATA results = empty list
  FOR EACH op IN changeSet.operations IN ORDER
    DATA attempt = 0
    DATA last = undefined
    WHILE attempt < maxAttempts
      INCREMENT attempt
      last = CALL IMPL-MESH_EXECUTOR_executeOperation(op, source, target, policy, events)
      IF last.success OR last.skipped THEN BREAK inner loop
    APPEND { ...last, attempts: attempt } to results
  RETURN results
