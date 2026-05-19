# IMPL-MESH_RUNTIME essence pseudocode

// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composition root wiring L2 services, connectors, and cross-cutting auth/safety

## MeshRuntimeConstructor

// how: Instantiate repository, event/session/conflict services, mesh+depot services, safety, auth with audit to events.

PROCEDURE IMPL-MESH_RUNTIME_construct(optional meshRepository)
  DATA repository = meshRepository OR createMeshRepository()
  CREATE EventService, SessionService, ConflictService, CredentialReferenceStore
  CREATE InventoryService, PlanningService, ExecutorService(events)
  CREATE SafetyService, AuthorizationService(audit→events), ScheduleService, MonitoringService
  CREATE MeshService(repository, activeSessionMeshIds from sessions)
  CREATE DepotService(repository)
  INIT connector map empty

## authorize

// how: Delegate to AuthorizationService; push denied attempts to auditEntries.

PROCEDURE IMPL-MESH_RUNTIME_authorize(role, permission)
  DATA result = CALL auth.require(role, permission)
  IF NOT result.allowed THEN append auditEntries denied row
  RETURN result

## generatePlan

// how: Topology safety, inventory both depots, planning dry-run, recordDryRun when isDryRun.

PROCEDURE IMPL-MESH_RUNTIME_generatePlan(meshId, sourceDepotId, targetDepotId, isDryRun)
  LOAD mesh; CALL safety.checkTopologySafe
  REGISTER local connectors; SCAN inventories
  DATA plan = CALL planning.generateDryRunPlan
  IF isDryRun THEN CALL safety.recordDryRun(meshId)
  RETURN plan

## runApprovedSession

// how: Safety check execution; executor runs operations; record success on completion.

PROCEDURE IMPL-MESH_RUNTIME_runApprovedSession(sessionId, options)
  LOAD session and approved plan
  CALL safety.checkCanExecutePlan with confirmedDestructive
  CALL executor.execute approved operations via connectors
  ON success CALL safety.recordSuccessfulSync

## getMeshRuntime singleton

// how: Module singleton resettable in tests via resetMeshRuntime.

PROCEDURE IMPL-MESH_RUNTIME_getMeshRuntime()
  IF singleton missing THEN construct MeshRuntime
  RETURN singleton
