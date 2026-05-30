// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM] [REQ-MESH_HARDENING]: Dry-run change set from inventory diff with policy filters, path mapping, and optional operation pagination.

import type { ChangeSet, Mesh, SyncOperation } from "../domain";
import { isDomainValidationError, validateChangeSet } from "../domain";
import type { InventorySnapshot } from "./inventory-service";
import { allowsDelete, pathMatchesFilter, type PathMapping, applyPathMapping } from "./policy-service";
import type { Filter } from "../domain";

export type PlanInput = {
  mesh: Mesh;
  sourceInventory: InventorySnapshot;
  targetInventory: InventorySnapshot;
  filters?: Filter[];
  pathMappings?: PathMapping[];
};

function entryMap(snapshot: InventorySnapshot): Map<string, InventorySnapshot["entries"][0]> {
  return new Map(snapshot.entries.map((e) => [e.path, e]));
}

export class PlanningService {
  // [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM]: how — diff source vs target inventory snapshots into copy/update/delete operations respecting mesh policy and optional filters/mappings.
  generateDryRunPlan(input: PlanInput): ChangeSet {
    const operations: SyncOperation[] = [];
    const sourceMap = entryMap(input.sourceInventory);
    const targetMap = entryMap(input.targetInventory);
    const filters = input.filters ?? [];
    const mappings = input.pathMappings ?? [];
    const policy = input.mesh.policy;

    for (const [path, sourceEntry] of sourceMap) {
      if (sourceEntry.isDirectory) {
        continue;
      }
      if (!pathMatchesFilter(path, filters)) {
        continue;
      }
      const targetPath = applyPathMapping(path, mappings);
      const targetEntry = targetMap.get(targetPath);
      if (!targetEntry) {
        operations.push({
          id: `op-copy-${path}`,
          kind: "copy",
          sourcePath: path,
          targetPath,
          riskLevel: "low",
        });
        continue;
      }
      if (
        sourceEntry.mtimeMs &&
        targetEntry.mtimeMs &&
        sourceEntry.mtimeMs > targetEntry.mtimeMs
      ) {
        operations.push({
          id: `op-update-${path}`,
          kind: "update",
          sourcePath: path,
          targetPath,
          riskLevel: "medium",
        });
      }
    }

    for (const [path, targetEntry] of targetMap) {
      if (targetEntry.isDirectory || sourceMap.has(path)) {
        continue;
      }
      if (allowsDelete(policy)) {
        operations.push({
          id: `op-delete-${path}`,
          kind: "delete",
          sourcePath: path,
          riskLevel: "high",
        });
      }
    }

    const changeSet = validateChangeSet({ operations });
    if (isDomainValidationError(changeSet)) {
      return { id: "plan-empty", operations: [] };
    }
    return { ...changeSet, id: `plan-${Date.now()}` };
  }
}

// [IMPL-MESH_PLANNING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — slice change-set operations for oversized API responses; preserve changeSet id and return pagination metadata.
export function paginateChangeSetOperations(
  changeSet: ChangeSet,
  operationOffset?: number,
  operationLimit?: number,
): {
  changeSet: ChangeSet;
  totalOperations: number;
  offset: number;
  requestedLimit?: number;
  returnedOperations: number;
} {
  const totalOperations = changeSet.operations.length;
  if (operationOffset == null && operationLimit == null) {
    return {
      changeSet,
      totalOperations,
      offset: 0,
      returnedOperations: totalOperations,
    };
  }
  const offset = Math.max(0, operationOffset ?? 0);
  const end =
    operationLimit == null ? undefined : Math.max(offset, offset + Math.max(0, operationLimit));
  const slice = changeSet.operations.slice(offset, end);
  return {
    changeSet: { ...changeSet, operations: slice },
    totalOperations,
    offset,
    requestedLimit: operationLimit ?? undefined,
    returnedOperations: slice.length,
  };
}
