// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Track pending sync conflicts, resolve lifecycle, and gate destructive execution

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

  // [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: L1 validateConflict; store by id; optionally index meshId for scoped list.
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

  // [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return pending conflicts; filter by meshId when provided.
  list(meshId?: string): Conflict[] {
    const all = [...this.conflicts.values()].filter((c) => c.status === "pending");
    if (!meshId) {
      return all;
    }
    return all.filter((c) => this.meshIdByConflict.get(c.id) === meshId);
  }

  // [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Mark conflict resolved; return conflict_not_found when id missing; resolution strategy recorded but not applied to changeSet in this release.
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

  // [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: True when any supplied conflict remains pending.
  hasUnresolvedBlocking(conflicts: Conflict[]): boolean {
    return conflicts.some((c) => c.status === "pending");
  }

  // [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Factory for modify_modify pending conflict on a single path pair.
  detectModifyModify(path: string): Conflict | DomainValidationError {
    return this.create({
      type: "modify_modify",
      participants: [path, path],
      status: "pending",
    });
  }
}

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Block destructive execution when pending conflicts coexist with high-risk delete operations
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
