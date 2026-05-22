# IMPL-MESH_RUNTIME essence pseudocode

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composition root wiring L2 services, connectors, and cross-cutting auth/safety

## MeshRuntimeConstructor

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — construct repository-backed runtime; instantiate L2 domain services, connector map, and cross-cutting auth/safety/event wiring per layered architecture.

PROCEDURE IMPL-MESH_RUNTIME_construct(optional meshRepository)
  DATA repository = meshRepository OR createMeshRepository()
  CREATE EventService, SessionService, ConflictService, CredentialReferenceStore
  CREATE InventoryService, PlanningService, ExecutorService(events)
  CREATE SafetyService, AuthorizationService(audit→events), ScheduleService, MonitoringService
  CREATE MeshService(repository, activeSessionMeshIds from sessions)
  CREATE DepotService(repository)
  INIT connector map empty

## authorize

// [IMPL-MESH_RUNTIME] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: Delegate to AuthorizationService; push denied attempts to auditEntries.

PROCEDURE IMPL-MESH_RUNTIME_authorize(role, permission)
  DATA result = CALL auth.require(role, permission)
  IF NOT result.allowed THEN append auditEntries denied row
  RETURN result

## generatePlan

// [IMPL-MESH_RUNTIME] [IMPL-MESH_PLANNING] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Topology check, inventory both depots with runtime-registered connectors, dry-run planning, recordDryRun.

PROCEDURE IMPL-MESH_RUNTIME_generatePlan(meshId, sourceDepotId, targetDepotId, isDryRun)
  LOAD mesh; CALL safety.checkTopologySafe
  REGISTER local connectors; SCAN inventories
  DATA plan = CALL planning.generateDryRunPlan
  IF isDryRun THEN CALL safety.recordDryRun(meshId)
  RETURN plan

## runApprovedSession

// [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [IMPL-MESH_SESSION] [REQ-MESH_E2E_RELEASE]: Execute approved plan per link; honor pause/cancel; async fire-and-forget when MESH_ASYNC_SYNC; record lifecycle with meshId for persistence.

PROCEDURE IMPL-MESH_RUNTIME_runApprovedSession(sessionId, options)
  LOAD session and approved plan
  CALL safety.checkCanExecutePlan with confirmedDestructive
  INIT sessionProgress total = len(links) * len(operations)
  DEFINE run = async loop over links and operations
    ON cancel flag: cancel session; record lifecycle cancelled; return
    ON paused: poll until resumed or cancelled
    CALL executeOperationWithBackoffAndThrottle for each operation
    INCREMENT sessionProgress completed or failed from result
    IF MESH_ASYNC_SYNC THEN await small delay between ops for E2E observability
  IF NOT cancelled after loop THEN complete session; recordSuccessfulSync; lifecycle completed
  IF MESH_ASYNC_SYNC THEN invoke run without awaiting limiter RETURN true early
  ELSE CALL hardening.limiter.run(run) RETURN true

## executeOperationWithBackoffAndThrottle

// [IMPL-MESH_RUNTIME] [IMPL-MESH_HARDENING] [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: Execute one operation via ExecutorService with policy.retryMaxAttempts, cancel-aware exponential backoff between failures, outbound byte throttle after successful copy/update.

PROCEDURE IMPL-MESH_RUNTIME_executeOperationWithBackoffAndThrottle(sessionId, mesh, op, sourceConn, targetConn)
  FOR attempt 1 .. policy.retryMaxAttempts
    DATA result = CALL executor.executeOperation(op, connectors, policy)
    IF success OR skipped OR cancelled THEN BREAK
    IF attempt < max THEN AWAIT hardening backoff delay unless cancelled mid-wait
  IF success AND mutating copy/update THEN CALL hardening throttle using stat-derived byte size WHEN positive
  RETURN final OperationResult

## getSessionProgress

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [REQ-MESH_PLATFORM]: Expose execution counters for API polling.

PROCEDURE IMPL-MESH_RUNTIME_getSessionProgress(sessionId)
  RETURN sessionProgress map entry OR zeroed completed failed total

## cancelSessionExecution

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [REQ-MESH_E2E_RELEASE]: Signal in-flight runApprovedSession loop to stop.

PROCEDURE IMPL-MESH_RUNTIME_cancelSessionExecution(sessionId)
  ADD sessionId to sessionCancelFlags set

## getConnectorForDepot

// [IMPL-MESH_RUNTIME] [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: LocalFilesystemConnector for local depots; RemoteConnector stub for remote; VirtualConnector for virtual and as default synthetic fallback for unknown kinds.

PROCEDURE IMPL-MESH_RUNTIME_getConnectorForDepot(depot)
  IF registered map hit THEN RETURN connector
  IF depot.kind local THEN LocalFilesystemConnector(depot.root); register
  IF depot.kind remote THEN RemoteConnector(root) stub no network; register
  IF depot.kind virtual THEN VirtualConnector default seed; register
  ELSE VirtualConnector synthetic default; optionally register

## getMeshRuntime singleton

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Module singleton wiring L5 callers to one MeshRuntime instance; resetMeshRuntime restores fresh instance for isolation tests.

PROCEDURE IMPL-MESH_RUNTIME_getSingleton()
  IF globalRuntime undefined THEN globalRuntime = new MeshRuntime()
  RETURN globalRuntime
