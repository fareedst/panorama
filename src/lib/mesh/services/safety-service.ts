// [IMPL-MESH_SAFETY] [REQ-MESH_SAFETY] [REQ-MESH_PLATFORM]: Safety guardrails — phase 23

import type { ChangeSet, Mesh } from "../domain";
import { validateTopology } from "./topology-service";

export type SafetyCheckResult = {
  allowed: boolean;
  code?: string;
  message?: string;
  requiresConfirmation?: boolean;
};

export type MeshSafetyProfile = {
  hasCompletedDryRun: boolean;
  successfulSyncCount: number;
};

const LARGE_DELETE_THRESHOLD = 10;

export class SafetyService {
  private readonly profiles = new Map<string, MeshSafetyProfile>();

  getProfile(meshId: string): MeshSafetyProfile {
    return (
      this.profiles.get(meshId) ?? {
        hasCompletedDryRun: false,
        successfulSyncCount: 0,
      }
    );
  }

  recordDryRun(meshId: string): void {
    const p = this.getProfile(meshId);
    this.profiles.set(meshId, { ...p, hasCompletedDryRun: true });
  }

  recordSuccessfulSync(meshId: string): void {
    const p = this.getProfile(meshId);
    this.profiles.set(meshId, {
      ...p,
      hasCompletedDryRun: true,
      successfulSyncCount: p.successfulSyncCount + 1,
    });
  }

  checkTopologySafe(mesh: Mesh): SafetyCheckResult {
    const validation = validateTopology(mesh);
    if (validation.hasCycle) {
      return {
        allowed: false,
        code: "topology_cycle",
        message: "Unsafe topology: cycle detected",
      };
    }
    return { allowed: true };
  }

  checkCanGeneratePlan(meshId: string, isDryRun = true): SafetyCheckResult {
    if (isDryRun) {
      return { allowed: true };
    }
    const profile = this.getProfile(meshId);
    if (!profile.hasCompletedDryRun) {
      return {
        allowed: false,
        code: "dry_run_required",
        message: "First sync requires a dry-run plan before execution",
      };
    }
    return { allowed: true };
  }

  checkCanExecutePlan(
    meshId: string,
    changeSet: ChangeSet,
    options: { confirmedDestructive?: boolean; isDryRun?: boolean } = {},
  ): SafetyCheckResult {
    if (options.isDryRun) {
      return { allowed: true };
    }

    const dryRunCheck = this.checkCanGeneratePlan(meshId, false);
    if (!dryRunCheck.allowed) {
      return dryRunCheck;
    }

    const deletes = changeSet.operations.filter((op) => op.kind === "delete");
    const highRisk = changeSet.operations.filter((op) => op.riskLevel === "high");

    if (deletes.length >= LARGE_DELETE_THRESHOLD && !options.confirmedDestructive) {
      return {
        allowed: false,
        code: "large_delete_confirmation_required",
        message: `Delete set has ${deletes.length} operations; confirmation required`,
        requiresConfirmation: true,
      };
    }

    if (highRisk.length > 0 && !options.confirmedDestructive) {
      return {
        allowed: false,
        code: "destructive_confirmation_required",
        message: "Destructive operations require explicit confirmation",
        requiresConfirmation: true,
      };
    }

    for (const op of changeSet.operations) {
      if (this.isQuarantined(op.sourcePath)) {
        return {
          allowed: false,
          code: "quarantine_blocked",
          message: `Path is quarantined: ${op.sourcePath}`,
        };
      }
    }

    return { allowed: true };
  }

  private readonly quarantinePaths = new Set<string>();

  quarantinePath(path: string): void {
    this.quarantinePaths.add(path);
  }

  isQuarantined(path: string): boolean {
    return this.quarantinePaths.has(path);
  }
}
