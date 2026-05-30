// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Track pending sync conflicts, resolve lifecycle, and gate destructive execution

import { describe, it, expect } from "vitest";
import { isDomainValidationError } from "../domain";
import {
  ConflictService,
  unresolvedConflictBlocksExecution,
} from "./conflict-service";

describe("ConflictService [IMPL-MESH_CONFLICT]", () => {
  it("modify_modify_conflict_is_detected", () => {
    const svc = new ConflictService();
    const conflict = svc.detectModifyModify("/shared.txt");
    expect(isDomainValidationError(conflict)).toBe(false);
    if (!isDomainValidationError(conflict)) {
      expect(conflict.type).toBe("modify_modify");
      expect(conflict.status).toBe("pending");
    }
  });

  it("resolve_conflict_by_preferring_source", () => {
    const svc = new ConflictService();
    const created = svc.create({
      type: "modify_modify",
      participants: ["a", "b"],
      status: "pending",
    });
    if (isDomainValidationError(created)) {
      throw new Error("create");
    }
    const resolved = svc.resolve(created.id, "prefer_source");
    if (!("code" in resolved)) {
      expect(resolved.status).toBe("resolved");
    }
  });

  it("resolve_conflict_by_keeping_both", () => {
    const svc = new ConflictService();
    const created = svc.create({
      type: "modify_modify",
      participants: ["a", "b"],
      status: "pending",
    });
    if (isDomainValidationError(created)) {
      throw new Error("create");
    }
    const resolved = svc.resolve(created.id, "keep_both");
    if (!("code" in resolved)) {
      expect(resolved.status).toBe("resolved");
    }
  });

  it("unresolved_conflict_blocks_destructive_execution", () => {
    const conflicts = [
      {
        id: "c1",
        type: "modify_modify" as const,
        participants: ["a", "b"],
        status: "pending" as const,
      },
    ];
    const ops = [
      {
        id: "op1",
        kind: "delete" as const,
        sourcePath: "/x",
        riskLevel: "high" as const,
      },
    ];
    expect(unresolvedConflictBlocksExecution(conflicts, ops)).toBe(true);
  });

  it("hasUnresolvedBlocking", () => {
    const svc = new ConflictService();
    svc.create({
      type: "modify_modify",
      participants: ["a", "b"],
      status: "pending",
    });
    expect(svc.hasUnresolvedBlocking(svc.list())).toBe(true);
  });
});
