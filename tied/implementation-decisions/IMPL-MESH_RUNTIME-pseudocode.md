# IMPL-MESH_RUNTIME essence pseudocode

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composition root wiring L2 services, connectors, and cross-cutting auth/safety

## MeshRuntimeConstructor

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — construct repository-backed runtime; instantiate L2 domain services, connector map, and cross-cutting auth/safety/event wiring per layered architecture.

CONTRACT MeshRuntimeConstructor
  INPUT: optional meshRepository
  OUTPUT: MeshRuntime instance with wired services
  DATA: meshRepository, sessionProgress map, sessionCancelFlags set, connectors map

PROCEDURE IMPL-MESH_RUNTIME_construct(optional meshRepository)
  DATA repository = meshRepository OR createMeshRepository()
  CREATE EventService, SessionService, ConflictService, CredentialReferenceStore
  CREATE InventoryService, PlanningService, ExecutorService(events)
  CREATE SafetyService, AuthorizationService(audit→events), ScheduleService, MonitoringService, ImportExportService, HardeningService
  CREATE MeshService(repository, activeSessionMeshIds from sessions)
  CREATE DepotService(repository)
  INIT connector map empty
  INIT sessionProgress map and sessionCancelFlags set empty

## authorize

// [IMPL-MESH_RUNTIME] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH]: how — delegate to AuthorizationService.require; append auditEntries row when denied.

CONTRACT authorize
  INPUT: role, permission
  OUTPUT: AuthorizationResult with allowed flag
  DATA: auditEntries array

PROCEDURE IMPL-MESH_RUNTIME_authorize(role, permission)
  DATA result = CALL auth.require(role, permission)
  IF NOT result.allowed THEN append auditEntries denied row with timestamp
  RETURN result

## getConnectorForDepot

// [IMPL-MESH_RUNTIME] [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: how — resolve depot kind to connector; cache in connectors map; VirtualConnector as default for unknown kinds without registering.

CONTRACT getConnectorForDepot
  INPUT: depot with id, kind, root
  OUTPUT: Connector instance
  DATA: connectors map keyed by depot.id

PROCEDURE IMPL-MESH_RUNTIME_getConnectorForDepot(depot)
  IF connectors map hit THEN RETURN connector
  IF depot.kind local THEN LocalFilesystemConnector(depot.root); register; RETURN
  IF depot.kind remote THEN RemoteConnector(depot.root) stub no network; register; RETURN
  IF depot.kind virtual THEN VirtualConnector(); register; RETURN
  RETURN new VirtualConnector() without register

## getTopology

// [IMPL-MESH_RUNTIME] [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — load mesh record; delegate validateTopology and projectTopologyGraph for API consumers.

CONTRACT getTopology
  INPUT: meshId
  OUTPUT: { validation, graph } OR undefined when mesh missing
  DATA: meshRepository

PROCEDURE IMPL-MESH_RUNTIME_getTopology(meshId)
  LOAD record from meshRepository
  IF record missing THEN RETURN undefined
  RETURN { validation: validateTopology(record.mesh), graph: projectTopologyGraph(record.mesh) }

## generatePlan

// [IMPL-MESH_RUNTIME] [IMPL-MESH_PLANNING] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — topology safety check, register local connectors, inventory both depots, dry-run planning, recordDryRun when isDryRun.

CONTRACT generatePlan
  INPUT: meshId, sourceDepotId, targetDepotId, isDryRun default true
  OUTPUT: ChangeSet OR SafetyCheckResult OR undefined
  DATA: mesh record, source/target depots, inventories

PROCEDURE IMPL-MESH_RUNTIME_generatePlan(meshId, sourceDepotId, targetDepotId, isDryRun)
  LOAD mesh record; IF missing THEN RETURN undefined
  DATA topoCheck = CALL safety.checkTopologySafe(record.mesh)
  IF NOT topoCheck.allowed THEN RETURN topoCheck
  RESOLVE sourceDepot and targetDepot from mesh.depots
  IF either depot missing THEN RETURN undefined
  CALL registerLocalDepotConnector for source and target when kind local
  DATA sourceInv = inventory.scanDepot(source, getConnectorForDepot(source))
  DATA targetInv = inventory.scanDepot(target, getConnectorForDepot(target))
  IF either inventory has error code THEN RETURN undefined
  DATA plan = CALL planning.generateDryRunPlan(mesh, sourceInv, targetInv)
  IF isDryRun THEN CALL safety.recordDryRun(meshId)
  RETURN plan

## checkExecution

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY]: how — delegate plan execution guardrails to SafetyService.checkCanExecutePlan.

CONTRACT checkExecution
  INPUT: meshId, changeSet, optional confirmedDestructive
  OUTPUT: SafetyCheckResult

PROCEDURE IMPL-MESH_RUNTIME_checkExecution(meshId, changeSet, confirmedDestructive)
  RETURN safety.checkCanExecutePlan(meshId, changeSet, { confirmedDestructive })

## getSessionProgress

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — expose execution counters for API polling.

CONTRACT getSessionProgress
  INPUT: sessionId
  OUTPUT: { completed, failed, total }

PROCEDURE IMPL-MESH_RUNTIME_getSessionProgress(sessionId)
  RETURN sessionProgress map entry OR { completed: 0, failed: 0, total: 0 }

## cancelSessionExecution

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_E2E_RELEASE]: how — signal in-flight runApprovedSession loop to stop via sessionCancelFlags.

CONTRACT cancelSessionExecution
  INPUT: sessionId
  OUTPUT: void side effect on sessionCancelFlags

PROCEDURE IMPL-MESH_RUNTIME_cancelSessionExecution(sessionId)
  ADD sessionId to sessionCancelFlags set

## runApprovedSession

// [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [IMPL-MESH_SESSION] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_E2E_RELEASE] [REQ-MESH_PLATFORM]: how — execute approved plan per link; honor pause/cancel; async fire-and-forget when MESH_ASYNC_SYNC; record lifecycle with meshId.

CONTRACT runApprovedSession
  INPUT: sessionId, optional confirmedDestructive
  OUTPUT: true OR false OR SafetyCheckResult when blocked
  DATA: session, approved plan, links, sessionProgress, sessionCancelFlags

PROCEDURE IMPL-MESH_RUNTIME_runApprovedSession(sessionId, options)
  LOAD session and approved plan
  IF session OR plan missing THEN RETURN false
  DATA meshId = session.meshSnapshot.mesh.id
  DATA safetyCheck = checkExecution(meshId, plan, options.confirmedDestructive)
  IF NOT safetyCheck.allowed THEN RETURN safetyCheck
  DATA links = mesh.links OR empty
  IF links.length === 0 THEN RETURN false
  REMOVE sessionId from sessionCancelFlags
  INIT sessionProgress total = plan.operations.length * links.length
  CALL sessions.start(sessionId)
  CALL events.recordSessionLifecycle(sessionId, running, meshId)
  DEFINE run = async loop over links
    RESOLVE source and target depots for link; IF missing THEN continue
    GET sourceConn and targetConn via getConnectorForDepot
    FOR each op in plan.operations
      IF sessionCancelFlags has sessionId THEN cancel session; record lifecycle cancelled; return
      IF session state paused THEN poll every 100ms until resumed or cancelled
      IF sessionCancelFlags has sessionId THEN cancel session; return
      DATA result = await executeOperationWithBackoffAndThrottle(sessionId, mesh, op, sourceConn, targetConn)
      INCREMENT sessionProgress completed when success OR failed when not success and not skipped
      IF MESH_ASYNC_SYNC THEN await delay 400ms between ops
  IF NOT cancelled after loop THEN complete session; recordSuccessfulSync(meshId); lifecycle completed
  IF MESH_ASYNC_SYNC THEN invoke run without awaiting limiter; RETURN true
  ELSE await hardening.limiter.run(run); RETURN true

## executeOperationWithBackoffAndThrottle

// [IMPL-MESH_RUNTIME] [IMPL-MESH_HARDENING] [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — execute one operation via ExecutorService with policy.retryMaxAttempts, cancel-aware exponential backoff between failures, outbound byte throttle after successful copy/update.

CONTRACT executeOperationWithBackoffAndThrottle
  INPUT: sessionId, mesh, op, sourceConn, targetConn
  OUTPUT: OperationResult
  DATA: policy.retryMaxAttempts, sessionCancelFlags

PROCEDURE IMPL-MESH_RUNTIME_executeOperationWithBackoffAndThrottle(sessionId, mesh, op, sourceConn, targetConn)
  IF sessionCancelFlags has sessionId THEN RETURN cancelled OperationResult
  FOR attempt 1 .. policy.retryMaxAttempts
    DATA result = CALL executor.executeOperation(op, sourceConn, targetConn, policy)
    IF success OR skipped OR sessionCancelFlags has sessionId THEN BREAK
    IF attempt < max THEN AWAIT hardening.getRetryDelay backoff unless cancelled mid-wait via 10ms polling
  IF success AND NOT skipped AND op.kind in copy|update THEN
    DATA meta = sourceConn.statEntry(op.sourcePath)
    IF meta valid file with positive size THEN await hardening.throttleOutboundBytes(meta.size)
  RETURN final OperationResult

## getMeshRuntime singleton

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — module singleton wiring L5 callers to one MeshRuntime instance; resetMeshRuntime restores fresh instance for isolation tests.

CONTRACT getMeshRuntime
  INPUT: none
  OUTPUT: shared MeshRuntime instance
  DATA: globalRuntime module variable

PROCEDURE IMPL-MESH_RUNTIME_getSingleton()
  IF globalRuntime undefined THEN globalRuntime = new MeshRuntime()
  RETURN globalRuntime

PROCEDURE IMPL-MESH_RUNTIME_resetSingleton()
  globalRuntime = new MeshRuntime()
