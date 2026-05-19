// [IMPL-MESH_EXECUTOR] [REQ-MESH_PLATFORM]: Executor tests — phase 13

import { describe, it, expect } from "vitest";
import { FakeConnector } from "../connector/fake-connector";
import { defaultPolicy, validateChangeSet, isDomainValidationError } from "../domain";
import { ExecutorService } from "./executor-service";
import { EventService } from "./event-service";

describe("ExecutorService [IMPL-MESH_EXECUTOR]", () => {
  it("copy_operation_calls_connector_read_and_write", () => {
    const src = new FakeConnector();
    const dst = new FakeConnector();
    src.seedFile("/a.txt", new TextEncoder().encode("data"));
    const executor = new ExecutorService();
    const result = executor.executeOperation(
      { id: "op1", kind: "copy", sourcePath: "/a.txt", targetPath: "/a.txt", riskLevel: "low" },
      src,
      dst,
      defaultPolicy(),
    );
    expect(result.success).toBe(true);
    const readBack = dst.readFile("/a.txt");
    expect(readBack).not.toHaveProperty("code");
    expect(ArrayBuffer.isView(readBack)).toBe(true);
  });

  it("delete_operation_requires_delete_policy", () => {
    const src = new FakeConnector();
    const dst = new FakeConnector();
    dst.seedFile("/del.txt", new TextEncoder().encode("x"));
    const executor = new ExecutorService();
    const result = executor.executeOperation(
      { id: "op2", kind: "delete", sourcePath: "/del.txt", riskLevel: "high" },
      src,
      dst,
      defaultPolicy(),
    );
    expect(result.skipped).toBe(true);
    expect(result.success).toBe(false);
  });

  it("failed_operation_records_error", () => {
    const src = new FakeConnector();
    const dst = new FakeConnector();
    const executor = new ExecutorService();
    const result = executor.executeOperation(
      { id: "op3", kind: "copy", sourcePath: "/missing.txt", riskLevel: "low" },
      src,
      dst,
      defaultPolicy(),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("retry_operation_increments_attempt_count", () => {
    const src = new FakeConnector();
    const dst = new FakeConnector();
    const executor = new ExecutorService();
    const cs = validateChangeSet({
      operations: [
        { id: "op4", kind: "copy", sourcePath: "/nope.txt", riskLevel: "low" },
      ],
    });
    if (isDomainValidationError(cs)) {
      throw new Error("cs");
    }
    const results = executor.executeChangeSet(cs, src, dst, {
      ...defaultPolicy(),
      retryMaxAttempts: 2,
    });
    expect(results[0].attempts).toBe(2);
  });

  it("executor_emits_operation_events", () => {
    const events = new EventService();
    const src = new FakeConnector();
    const dst = new FakeConnector();
    src.seedFile("/e.txt", new TextEncoder().encode("e"));
    const executor = new ExecutorService(events);
    executor.executeOperation(
      { id: "op5", kind: "copy", sourcePath: "/e.txt", targetPath: "/e.txt", riskLevel: "low" },
      src,
      dst,
      defaultPolicy(),
    );
    const types = events.list().map((e) => e.type);
    expect(types).toContain("operation_started");
    expect(types).toContain("operation_completed");
  });

  it("repeated_copy_operation_is_idempotent", () => {
    const src = new FakeConnector();
    const dst = new FakeConnector();
    src.seedFile("/idem.txt", new TextEncoder().encode("same"));
    const executor = new ExecutorService();
    const op = {
      id: "op6",
      kind: "copy" as const,
      sourcePath: "/idem.txt",
      targetPath: "/idem.txt",
      riskLevel: "low" as const,
    };
    executor.executeOperation(op, src, dst, defaultPolicy());
    const second = executor.executeOperation(op, src, dst, defaultPolicy());
    expect(second.success).toBe(true);
  });
});
