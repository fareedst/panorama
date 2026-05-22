// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composed mesh runtime — wires L2 services for API and tests

import { LocalFilesystemConnector } from "../connector/local-filesystem-connector";
import { RemoteConnector } from "../connector/remote-connector";
import { VirtualConnector } from "../connector/virtual-connector";
import type { Connector } from "../connector/types";
import type { ChangeSet, Depot, Mesh, SyncOperation } from "../domain";
import { createMeshRepository } from "../repositories/create-mesh-repository";
import type { MeshRepository } from "../repositories/mesh-repository";
import {
  AuthorizationService,
  type MeshPermission,
  type MeshRole,
} from "../services/authorization-service";
import { ConflictService } from "../services/conflict-service";
import { CredentialReferenceStore } from "../services/credential-service";
import { DepotService } from "../services/depot-service";
import { EventService } from "../services/event-service";
import { ExecutorService, type OperationResult } from "../services/executor-service";
import { HardeningService } from "../services/hardening-service";
import { ImportExportService } from "../services/import-export-service";
import { InventoryService } from "../services/inventory-service";
import { MeshService } from "../services/mesh-service";
import { MonitoringService } from "../services/monitoring-service";
import { PlanningService } from "../services/planning-service";
import { SafetyService } from "../services/safety-service";
import { ScheduleService } from "../services/schedule-service";
import { SessionService } from "../services/session-service";
import { projectTopologyGraph, validateTopology } from "../services/topology-service";
import type { SafetyCheckResult } from "../services/safety-service";

export class MeshRuntime {
  readonly meshRepository: MeshRepository;
  readonly events = new EventService();
  readonly sessions = new SessionService();
  readonly conflicts = new ConflictService();
  readonly credentials = new CredentialReferenceStore();
  readonly inventory = new InventoryService();
  readonly planning = new PlanningService();
  readonly executor = new ExecutorService(this.events);
  readonly safety = new SafetyService();
  readonly auth = new AuthorizationService((entry) => {
    this.events.recordAudit(entry.permission, {
      role: entry.role,
      outcome: entry.outcome,
    });
  });
  readonly schedules = new ScheduleService();
  readonly monitoring = new MonitoringService();
  readonly importExport = new ImportExportService();
  readonly hardening = new HardeningService();
  readonly meshService: MeshService;
  readonly depotService: DepotService;
  readonly connectors = new Map<string, Connector>();
  readonly auditEntries: {
    timestamp: string;
    role: MeshRole;
    permission: MeshPermission;
    outcome: string;
  }[] = [];
  private readonly sessionProgress = new Map<
    string,
    { completed: number; failed: number; total: number }
  >();
  private readonly sessionCancelFlags = new Set<string>();

  constructor(meshRepository?: MeshRepository) {
    this.meshRepository = meshRepository ?? createMeshRepository();
    this.meshService = new MeshService(
      this.meshRepository,
      () => this.sessions.getActiveMeshIds(),
    );
    this.depotService = new DepotService(this.meshRepository);
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH]: authorize — delegate to auth service; audit denials
  authorize(role: MeshRole, permission: MeshPermission) {
    const result = this.auth.require(role, permission);
    if (!result.allowed) {
      this.auditEntries.push({
        timestamp: new Date().toISOString(),
        role,
        permission,
        outcome: "denied",
      });
    }
    return result;
  }

  registerConnector(depotId: string, connector: Connector): void {
    this.connectors.set(depotId, connector);
  }

  registerLocalDepotConnector(depot: Depot): void {
    if (depot.kind === "local") {
      this.registerConnector(depot.id, new LocalFilesystemConnector(depot.root));
    }
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: Depot kind → connector — local FS, remote stub, virtual synthetic, default VirtualConnector (pseudocode IMPL-MESH_RUNTIME_getConnectorForDepot)
  getConnectorForDepot(depot: Depot): Connector {
    const existing = this.connectors.get(depot.id);
    if (existing) {
      return existing;
    }
    if (depot.kind === "local") {
      const local = new LocalFilesystemConnector(depot.root);
      this.registerConnector(depot.id, local);
      return local;
    }
    if (depot.kind === "remote") {
      const remote = new RemoteConnector(depot.root);
      this.registerConnector(depot.id, remote);
      return remote;
    }
    if (depot.kind === "virtual") {
      const virtual = new VirtualConnector();
      this.registerConnector(depot.id, virtual);
      return virtual;
    }
    return new VirtualConnector();
  }

  getTopology(meshId: string) {
    const record = this.meshRepository.get(meshId);
    if (!record) {
      return undefined;
    }
    return {
      validation: validateTopology(record.mesh),
      graph: projectTopologyGraph(record.mesh),
    };
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_PLANNING] [IMPL-MESH_SAFETY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: generatePlan — topology check, inventory, dry-run planning
  generatePlan(
    meshId: string,
    sourceDepotId: string,
    targetDepotId: string,
    isDryRun = true,
  ): ChangeSet | SafetyCheckResult | undefined {
    const record = this.meshRepository.get(meshId);
    if (!record) {
      return undefined;
    }
    const topoCheck = this.safety.checkTopologySafe(record.mesh);
    if (!topoCheck.allowed) {
      return topoCheck;
    }
    const sourceDepot = record.mesh.depots.find((d) => d.id === sourceDepotId);
    const targetDepot = record.mesh.depots.find((d) => d.id === targetDepotId);
    if (!sourceDepot || !targetDepot) {
      return undefined;
    }
    this.registerLocalDepotConnector(sourceDepot);
    this.registerLocalDepotConnector(targetDepot);
    const sourceInv = this.inventory.scanDepot(sourceDepot, this.getConnectorForDepot(sourceDepot));
    const targetInv = this.inventory.scanDepot(targetDepot, this.getConnectorForDepot(targetDepot));
    if ("code" in sourceInv || "code" in targetInv) {
      return undefined;
    }
    const plan = this.planning.generateDryRunPlan({
      mesh: record.mesh,
      sourceInventory: sourceInv,
      targetInventory: targetInv,
    });
    if (isDryRun) {
      this.safety.recordDryRun(meshId);
    }
    return plan;
  }

  checkExecution(
    meshId: string,
    changeSet: ChangeSet,
    confirmedDestructive?: boolean,
  ): SafetyCheckResult {
    return this.safety.checkCanExecutePlan(meshId, changeSet, { confirmedDestructive });
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [REQ-MESH_PLATFORM]: Expose execution counters for API polling
  getSessionProgress(sessionId: string) {
    return this.sessionProgress.get(sessionId) ?? { completed: 0, failed: 0, total: 0 };
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [REQ-MESH_E2E_RELEASE]: Signal in-flight runApprovedSession loop to stop
  cancelSessionExecution(sessionId: string): void {
    this.sessionCancelFlags.add(sessionId);
  }

  // [IMPL-MESH_RUNTIME] [IMPL-MESH_EXECUTOR] [IMPL-MESH_SESSION] [REQ-MESH_E2E_RELEASE]: runApprovedSession — execute plan per link; honor pause/cancel; async when MESH_ASYNC_SYNC
  async runApprovedSession(
    sessionId: string,
    options?: { confirmedDestructive?: boolean },
  ): Promise<boolean | SafetyCheckResult> {
    const session = this.sessions.getSession(sessionId);
    const plan = this.sessions.getApprovedPlan(sessionId);
    if (!session || !plan) {
      return false;
    }
    const meshId = session.meshSnapshot.mesh.id;
    const safetyCheck = this.checkExecution(meshId, plan, options?.confirmedDestructive);
    if (!safetyCheck.allowed) {
      return safetyCheck;
    }
    const mesh = session.meshSnapshot.mesh;
    const links = mesh.links.length > 0 ? mesh.links : [];
    if (links.length === 0) {
      return false;
    }
    this.sessionCancelFlags.delete(sessionId);
    const totalOps = plan.operations.length * links.length;
    this.sessionProgress.set(sessionId, {
      completed: 0,
      failed: 0,
      total: totalOps,
    });
    this.sessions.start(sessionId);
    this.events.recordSessionLifecycle(sessionId, "running", meshId);

    const run = async () => {
      const delayMs = process.env.MESH_ASYNC_SYNC === "1" ? 400 : 0;
      for (const link of links) {
        const source = mesh.depots.find((d) => d.id === link.sourceDepotId);
        const target = mesh.depots.find((d) => d.id === link.targetDepotId);
        if (!source || !target) {
          continue;
        }
        const sourceConn = this.getConnectorForDepot(source);
        const targetConn = this.getConnectorForDepot(target);
        for (const op of plan.operations) {
          if (this.sessionCancelFlags.has(sessionId)) {
            this.sessions.cancel(sessionId);
            this.events.recordSessionLifecycle(sessionId, "cancelled", meshId);
            return;
          }
          const current = this.sessions.getSession(sessionId);
          if (current?.state === "paused") {
            await new Promise<void>((resolve) => {
              const check = setInterval(() => {
                const s = this.sessions.getSession(sessionId);
                if (!s || s.state !== "paused" || this.sessionCancelFlags.has(sessionId)) {
                  clearInterval(check);
                  resolve();
                }
              }, 100);
            });
          }
          if (this.sessionCancelFlags.has(sessionId)) {
            this.sessions.cancel(sessionId);
            return;
          }
          const result = await this.executeOperationWithBackoffAndThrottle(
            sessionId,
            mesh,
            op,
            sourceConn,
            targetConn,
          );
          const prog = this.sessionProgress.get(sessionId)!;
          if (result.success) {
            prog.completed += 1;
          } else if (!result.skipped) {
            prog.failed += 1;
          }
          this.sessionProgress.set(sessionId, { ...prog });
          if (delayMs > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }
      }
      if (!this.sessionCancelFlags.has(sessionId)) {
        this.sessions.complete(sessionId);
        this.safety.recordSuccessfulSync(meshId);
        this.events.recordSessionLifecycle(sessionId, "completed", meshId);
      }
    };

    if (process.env.MESH_ASYNC_SYNC === "1") {
      void run();
      return true;
    }
    await this.hardening.limiter.run(run);
    return true;
  }

  // [IMPL-MESH_HARDENING] [REQ-MESH_HARDENING]: Retry backoff between attempts + optional outbound bytes pacing ([REQ-MESH_PLATFORM] prompts phase 29)
  private async executeOperationWithBackoffAndThrottle(
    sessionId: string,
    mesh: Mesh,
    op: SyncOperation,
    sourceConn: Connector,
    targetConn: Connector,
  ): Promise<OperationResult> {
    const policy = mesh.policy;

    if (this.sessionCancelFlags.has(sessionId)) {
      return { operationId: op.id, success: false, error: "cancelled", attempts: 0 };
    }

    let last: OperationResult | undefined;

    for (let attempt = 1; attempt <= policy.retryMaxAttempts; attempt++) {
      last = this.executor.executeOperation(op, sourceConn, targetConn, policy);

      if (last.success || last.skipped || this.sessionCancelFlags.has(sessionId)) {
        break;
      }

      if (attempt < policy.retryMaxAttempts) {
        const delayMs = this.hardening.getRetryDelay(attempt + 1);
        if (delayMs > 0) {
          await new Promise<void>((resolve) => {
            const deadline = Date.now() + delayMs;
            const tick = setInterval(() => {
              if (this.sessionCancelFlags.has(sessionId)) {
                clearInterval(tick);
                resolve();
                return;
              }
              if (Date.now() >= deadline) {
                clearInterval(tick);
                resolve();
              }
            }, 10);
          });
        }
      }
    }

    const result = last!;
    if (result.success && !result.skipped && (op.kind === "copy" || op.kind === "update")) {
      const meta = sourceConn.statEntry(op.sourcePath);
      if (!("code" in meta) && !meta.isDirectory && typeof meta.size === "number" && meta.size > 0) {
        await this.hardening.throttleOutboundBytes(meta.size);
      }
    }
    return result;
  }

  getMonitoringSummary() {
    return this.monitoring.buildSummary(
      this.meshService.listMeshes(true),
      this.sessions.listAll(),
      this.events.list(),
      this.conflicts.list().length,
    );
  }
}

let globalRuntime: MeshRuntime | undefined;

export function getMeshRuntime(): MeshRuntime {
  if (!globalRuntime) {
    globalRuntime = new MeshRuntime();
  }
  return globalRuntime;
}

export function resetMeshRuntime(): void {
  globalRuntime = new MeshRuntime();
}
