// [IMPL-MESH_CONFLICT] [REQ-MESH_PLATFORM]: Conflict management — phase 11

import {
  isDomainValidationError,
  validateConflict,
  type ChangeSet,
  type Conflict,
  type ConflictStatus,
  type DomainValidationError,
  type SyncOperation,
} from "../domain";

export class ConflictService {
  private readonly conflicts = new Map<string, Conflict>();
  private readonly meshIdByConflict = new Map<string, string>();

  create(attrs: unknown, meshId?: string): Conflict | DomainValidationError {
    const conflict = validateConflict(attrs);
    if (isDomainValidationError(conflict)) {
      return conflict;
    }
    this.conflicts.set(conflict.id, conflict);
    if (meshId) {
      this.meshIdByConflict.set(conflict.id, meshId);
    }
    return conflict;
  }

  list(meshId?: string): Conflict[] {
    const all = [...this.conflicts.values()].filter((c) => c.status === "pending");
    if (!meshId) {
      return all;
    }
    return all.filter((c) => this.meshIdByConflict.get(c.id) === meshId);
  }

  resolve(
    conflictId: string,
    resolution: "prefer_source" | "prefer_target" | "keep_both",
  ): Conflict | { code: string; message: string } {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return { code: "conflict_not_found", message: "Conflict not found" };
    }
    const resolved: Conflict = { ...conflict, status: "resolved" as ConflictStatus };
    this.conflicts.set(conflictId, resolved);
    void resolution;
    return resolved;
  }

  applyResolutionToChangeSet(changeSet: ChangeSet, conflict: Conflict): ChangeSet {
    void conflict;
    return changeSet;
  }

  hasUnresolvedBlocking(conflicts: Conflict[]): boolean {
    return conflicts.some((c) => c.status === "pending");
  }

  detectModifyModify(path: string): Conflict | DomainValidationError {
    return this.create({
      type: "modify_modify",
      participants: [path, path],
      status: "pending",
    });
  }
}

export function unresolvedConflictBlocksExecution(
  conflicts: Conflict[],
  operations: SyncOperation[],
): boolean {
  const hasHighRiskDelete = operations.some(
    (op) => op.kind === "delete" && op.riskLevel === "high",
  );
  const pending = conflicts.filter((c) => c.status === "pending");
  return pending.length > 0 && hasHighRiskDelete;
}
