// [IMPL-MESH_RUNTIME] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Composed mesh runtime — wires L2 services for API and tests

import { FakeConnector } from "../connector/fake-connector";
import { LocalFilesystemConnector } from "../connector/local-filesystem-connector";
import type { Connector } from "../connector/types";
import type { ChangeSet, Mesh } from "../domain";
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
import { ExecutorService } from "../services/executor-service";
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
import type { Depot } from "../domain";
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
    return new FakeConnector();
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
    const link = mesh.links[0];
    if (!link) {
      return false;
    }
    const source = mesh.depots.find((d) => d.id === link.sourceDepotId);
    const target = mesh.depots.find((d) => d.id === link.targetDepotId);
    if (!source || !target) {
      return false;
    }
    this.sessions.start(sessionId);
    this.events.recordSessionLifecycle(sessionId, "running");
    await this.hardening.limiter.run(async () => {
      this.executor.executeChangeSet(
        plan,
        this.getConnectorForDepot(source),
        this.getConnectorForDepot(target),
        mesh.policy,
        mesh.policy.retryMaxAttempts,
      );
    });
    this.sessions.complete(sessionId);
    this.safety.recordSuccessfulSync(meshId);
    this.events.recordSessionLifecycle(sessionId, "completed");
    return true;
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
