// [REQ-MESH_SAFETY]: Safety service unit tests — phase 23

import { describe, it, expect, beforeEach } from "vitest";
import { SafetyService } from "./safety-service";
import type { ChangeSet } from "../domain";

describe("SafetyService [IMPL-MESH_SAFETY]", () => {
  let safety: SafetyService;

  beforeEach(() => {
    safety = new SafetyService();
  });

  it("first_sync_requires_dry_run", () => {
    const plan: ChangeSet = {
      id: "p1",
      operations: [{ id: "o1", kind: "copy", sourcePath: "/a", riskLevel: "low" }],
    };
    const result = safety.checkCanExecutePlan("m1", plan);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("dry_run_required");
  });

  it("large_delete_set_requires_confirmation", () => {
    safety.recordDryRun("m1");
    const ops = Array.from({ length: 12 }, (_, i) => ({
      id: `d${i}`,
      kind: "delete" as const,
      sourcePath: `/f${i}`,
      riskLevel: "high" as const,
    }));
    const result = safety.checkCanExecutePlan("m1", { id: "p", operations: ops });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.code).toBe("large_delete_confirmation_required");
  });

  it("allows_execution_after_dry_run_and_confirmation", () => {
    safety.recordDryRun("m1");
    const plan: ChangeSet = {
      id: "p1",
      operations: [
        { id: "o1", kind: "delete", sourcePath: "/a", riskLevel: "high" },
      ],
    };
    const blocked = safety.checkCanExecutePlan("m1", plan);
    expect(blocked.allowed).toBe(false);
    const ok = safety.checkCanExecutePlan("m1", plan, { confirmedDestructive: true });
    expect(ok.allowed).toBe(true);
  });

  it("quarantine_blocks_suspicious_operation", () => {
    safety.recordDryRun("m1");
    safety.quarantinePath("/bad");
    const plan: ChangeSet = {
      id: "p1",
      operations: [{ id: "o1", kind: "copy", sourcePath: "/bad", riskLevel: "low" }],
    };
    const result = safety.checkCanExecutePlan("m1", plan, { confirmedDestructive: true });
    expect(result.code).toBe("quarantine_blocked");
  });
});
