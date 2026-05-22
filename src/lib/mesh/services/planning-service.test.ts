// [IMPL-MESH_PLANNING] [REQ-MESH_PLATFORM]: Planning tests — phase 10

import { describe, it, expect } from "vitest";
import { validateMesh, isDomainValidationError, defaultPolicy } from "../domain";
import type { InventorySnapshot } from "./inventory-service";
import { PlanningService, paginateChangeSetOperations } from "./planning-service";

function mesh() {
  const m = validateMesh({ name: "Plan Mesh", policy: defaultPolicy() });
  if (isDomainValidationError(m)) {
    throw new Error("mesh");
  }
  return m;
}

function snap(depotId: string, entries: InventorySnapshot["entries"]): InventorySnapshot {
  return { depotId, scannedAt: new Date().toISOString(), entries };
}

describe("PlanningService [IMPL-MESH_PLANNING]", () => {
  const planner = new PlanningService();

  it("identical_inventories_generate_empty_change_set", () => {
    const entries = [{ path: "/a.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", entries),
      targetInventory: snap("t", entries),
    });
    expect(plan.operations).toHaveLength(0);
  });

  it("missing_target_file_generates_copy_operation", () => {
    const source = [{ path: "/new.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", source),
      targetInventory: snap("t", []),
    });
    expect(plan.operations.some((o) => o.kind === "copy")).toBe(true);
  });

  it("newer_source_file_generates_update_operation_when_policy_allows", () => {
    const source = [{ path: "/a.txt", isDirectory: false, size: 1, mtimeMs: 200 }];
    const target = [{ path: "/a.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", source),
      targetInventory: snap("t", target),
    });
    expect(plan.operations.some((o) => o.kind === "update")).toBe(true);
  });

  it("delete_operation_not_generated_under_never_delete_policy", () => {
    const target = [{ path: "/orphan.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", []),
      targetInventory: snap("t", target),
    });
    expect(plan.operations.filter((o) => o.kind === "delete")).toHaveLength(0);
  });

  it("delete_operation_generated_when_policy_allows", () => {
    const m = validateMesh({
      name: "Del",
      policy: { ...defaultPolicy(), deletePolicy: "allow" },
    });
    if (isDomainValidationError(m)) {
      throw new Error("mesh");
    }
    const target = [{ path: "/orphan.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: m,
      sourceInventory: snap("s", []),
      targetInventory: snap("t", target),
    });
    expect(plan.operations.some((o) => o.kind === "delete")).toBe(true);
  });

  it("path_mapping_applies_before_planning", () => {
    const source = [{ path: "/src/a.txt", isDirectory: false, size: 1, mtimeMs: 100 }];
    const plan = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", source),
      targetInventory: snap("t", []),
      pathMappings: [{ fromPrefix: "/src", toPrefix: "/dst" }],
    });
    const copy = plan.operations.find((o) => o.kind === "copy");
    expect(copy?.targetPath).toBe("/dst/a.txt");
  });

  it("paginateChangeSetOperations_slices_operations", () => {
    const full = planner.generateDryRunPlan({
      mesh: mesh(),
      sourceInventory: snap("s", [
        { path: "/1.txt", isDirectory: false, size: 1, mtimeMs: 100 },
        { path: "/2.txt", isDirectory: false, size: 1, mtimeMs: 101 },
        { path: "/3.txt", isDirectory: false, size: 1, mtimeMs: 102 },
      ]),
      targetInventory: snap("t", []),
    });
    expect(full.operations.length).toBeGreaterThanOrEqual(3);
    const page = paginateChangeSetOperations(full, 1, 1);
    expect(page.changeSet.operations).toHaveLength(1);
    expect(page.returnedOperations).toBe(1);
    expect(page.totalOperations).toBe(full.operations.length);
    expect(page.offset).toBe(1);
    const untouched = paginateChangeSetOperations(full);
    expect(untouched.changeSet.operations).toHaveLength(full.operations.length);
  });
});
