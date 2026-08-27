# IMPL-MESH_RUNTIME essence pseudocode

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composition root wiring L2 services, connectors, and cross-cutting auth/safety

## MeshRuntimeConstructor

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — construct repository-backed runtime; instantiate L2 domain services, connector map, and cross-cutting auth/safety/event wiring per layered architecture.

```
IMPL-MESH_RUNTIME_construct(optional meshRepository):
  INPUT: optional meshRepository
  OUTPUT: MeshRuntime instance with wired services
  DATA: meshRepository, sessionProgress map, sessionCancelFlags set, connectors map
  PRE: optional repository override may be provided
  POST: MeshRuntime constructed with L2 services, connector map, and cross-cutting wiring
  EFFECTS: State
  TERMINATION: total
  DATA repository = meshRepository OR createMeshRepository()
  CREATE EventService, SessionService, ConflictService, CredentialReferenceStore
  CREATE InventoryService, PlanningService, ExecutorService(events)
  CREATE SafetyService, AuthorizationService(audit→events), ScheduleService, MonitoringService, ImportExportService, HardeningService
  CREATE MeshService(repository, activeSessionMeshIds from sessions)
  CREATE DepotService(repository)
  INIT connector map empty
  INIT sessionProgress map and sessionCancelFlags set empty
```

## authorize

// [IMPL-MESH_RUNTIME] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH]: how — delegate to AuthorizationService.require; append auditEntries row when denied.

```
IMPL-MESH_RUNTIME_authorize(role, permission):
  INPUT: role, permission
  OUTPUT: AuthorizationResult with allowed flag
  DATA: auditEntries array
  PRE: role and permission provided
  POST: authorization result returned; audit entry appended when denied
  EFFECTS: State
  TERMINATION: total
  DATA result = CALL auth.require(role, permission)
  IF NOT result.allowed THEN append auditEntries denied row with timestamp
  RETURN result
```

## getConnectorForDepot

// [IMPL-MESH_RUNTIME] [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: how — resolve depot kind to connector; cache in connectors map; VirtualConnector as default for unknown kinds without registering.

```
IMPL-MESH_RUNTIME_getConnectorForDepot(depot):
  INPUT: depot with id, kind, root
  OUTPUT: Connector instance
  DATA: connectors map keyed by depot.id
  PRE: depot with id, kind, and root available
  POST: connector resolved and cached per depot kind; VirtualConnector default for unknown kinds
  EFFECTS: State
  TERMINATION: total
  IF connectors map hit THEN RETURN connector
  IF depot.kind local THEN LocalFilesystemConnector(depot.root); register; RETURN
  IF depot.kind remote THEN RemoteConnector(depot.root) stub no network; register; RETURN
  IF depot.kind virtual THEN VirtualConnector(); register; RETURN
  RETURN new VirtualConnector() without register
```

## getTopology

// [IMPL-MESH_RUNTIME] [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — load mesh record; delegate validateTopology and projectTopologyGraph for API consumers.

```
IMPL-MESH_RUNTIME_getTopology(meshId):
  INPUT: meshId
  OUTPUT: { validation, graph } OR undefined when mesh missing
  DATA: meshRepository
  PRE: meshId provided
  POST: topology validation and graph projection returned OR undefined when mesh missing
  EFFECTS: pure
  TERMINATION: total
  LOAD record from meshRepository
  IF record missing THEN RETURN undefined
  RETURN { validation: validateTopology(record.mesh), graph: projectTopologyGraph(record.mesh) }
```

## generatePlan

// [IMPL-MESH_RUNTIME] [IMPL-MESH_PLANNING] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — topology safety check, register local connectors, inventory both depots, dry-run planning, recordDryRun when isDryRun.

```
IMPL-MESH_RUNTIME_generatePlan(meshId, sourceDepotId, targetDepotId, isDryRun):
  INPUT: meshId, sourceDepotId, targetDepotId, isDryRun default true
  OUTPUT: ChangeSet OR SafetyCheckResult OR undefined
  DATA: mesh record, source/target depots, inventories
  PRE: meshId and depot ids available
  POST: dry-run or live plan returned OR safety/topology block OR undefined when mesh/depots missing
  EFFECTS: State
  FAILURE_MODES: TOPOLOGY_CYCLE; DRY_RUN_REQUIRED
  TERMINATION: total
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
```

## checkExecution

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_SAFETY]: how — delegate plan execution guardrails to SafetyService.checkCanExecutePlan.

```
IMPL-MESH_RUNTIME_checkExecution(meshId, changeSet, confirmedDestructive):
  INPUT: meshId, changeSet, optional confirmedDestructive
  OUTPUT: SafetyCheckResult
  PRE: meshId and changeSet available
  POST: execution guardrail result from SafetyService returned
  EFFECTS: pure
  TERMINATION: total
  RETURN safety.checkCanExecutePlan(meshId, changeSet, { confirmedDestructive })
```

## getSessionProgress

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — expose execution counters for API polling.

```
IMPL-MESH_RUNTIME_getSessionProgress(sessionId):
  INPUT: sessionId
  OUTPUT: { completed, failed, total }
  PRE: sessionId provided
  POST: progress counters returned from map or zero defaults
  EFFECTS: pure
  TERMINATION: total
  RETURN sessionProgress map entry OR { completed: 0, failed: 0, total: 0 }
```

## cancelSessionExecution

// [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_E2E_RELEASE]: how — signal in-flight runApprovedSession loop to stop via sessionCancelFlags.

```
IMPL-MESH_RUNTIME_cancelSessionExecution(sessionId):
  INPUT: sessionId
  OUTPUT: void side effect on sessionCancelFlags
  PRE: sessionId provided
  POST: sessionId added to sessionCancelFlags set
  EFFECTS: State
  TERMINATION: total
  ADD sessionId to sessionCancelFlags set
```

## runApprovedSession

// [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [IMPL-MESH_SESSION] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_E2E_RELEASE] [REQ-MESH_PLATFORM]: how — execute approved plan per link; honor pause/cancel; async fire-and-forget when MESH_ASYNC_SYNC; record lifecycle with meshId.

```
IMPL-MESH_RUNTIME_runApprovedSession(sessionId, options):
  INPUT: sessionId, optional confirmedDestructive
  OUTPUT: true OR false OR SafetyCheckResult when blocked
  DATA: session, approved plan, links, sessionProgress, sessionCancelFlags
  PRE: session and approved plan available
  POST: approved plan executed per link with pause/cancel honored OR safety block OR false when missing session/plan/links
  EFFECTS: State, IO, Async
  FAILURE_MODES: DRY_RUN_REQUIRED; LARGE_DELETE_CONFIRMATION; DESTRUCTIVE_CONFIRMATION; QUARANTINE_BLOCKED
  TERMINATION: partial
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
```

## executeOperationWithBackoffAndThrottle

// [IMPL-MESH_RUNTIME] [IMPL-MESH_HARDENING] [IMPL-MESH_EXECUTOR] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — execute one operation via ExecutorService with policy.retryMaxAttempts, cancel-aware exponential backoff between failures, outbound byte throttle after successful copy/update.

```
IMPL-MESH_RUNTIME_executeOperationWithBackoffAndThrottle(sessionId, mesh, op, sourceConn, targetConn):
  INPUT: sessionId, mesh, op, sourceConn, targetConn
  OUTPUT: OperationResult
  DATA: policy.retryMaxAttempts, sessionCancelFlags
  PRE: operation and connectors available
  POST: operation executed with retry/backoff/throttle OR cancelled result when session flagged
  EFFECTS: IO, State
  TERMINATION: total
  IF sessionCancelFlags has sessionId THEN RETURN cancelled OperationResult
  FOR attempt 1 .. policy.retryMaxAttempts
    DATA result = CALL executor.executeOperation(op, sourceConn, targetConn, policy)
    IF success OR skipped OR sessionCancelFlags has sessionId THEN BREAK
    IF attempt < max THEN AWAIT hardening.getRetryDelay backoff unless cancelled mid-wait via 10ms polling
  IF success AND NOT skipped AND op.kind in copy|update THEN
    DATA meta = sourceConn.statEntry(op.sourcePath)
    IF meta valid file with positive size THEN await hardening.throttleOutboundBytes(meta.size)
  RETURN final OperationResult
```

## getMeshRuntime singleton

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — module singleton wiring L5 callers to one MeshRuntime instance; resetMeshRuntime restores fresh instance for isolation tests.

```
IMPL-MESH_RUNTIME_getSingleton():
  INPUT: none
  OUTPUT: shared MeshRuntime instance
  DATA: globalRuntime module variable
  PRE: none
  POST: shared MeshRuntime instance returned; created on first call
  EFFECTS: State
  TERMINATION: total
  IF globalRuntime undefined THEN globalRuntime = new MeshRuntime()
  RETURN globalRuntime

IMPL-MESH_RUNTIME_resetSingleton():
  INPUT: none
  OUTPUT: fresh MeshRuntime instance for isolation tests
  PRE: none
  POST: globalRuntime replaced with new MeshRuntime
  EFFECTS: State
  TERMINATION: total
  globalRuntime = new MeshRuntime()
```
