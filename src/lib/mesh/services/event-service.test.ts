// [IMPL-MESH_EVENTS] [REQ-MESH_PLATFORM]: Event log tests — phase 14

import { describe, it, expect } from "vitest";
import { EventService } from "./event-service";

describe("EventService [IMPL-MESH_EVENTS]", () => {
  it("event_has_timestamp_type_subject_and_payload", () => {
    const svc = new EventService();
    const event = svc.recordMeshUpdated("mesh-1", "created");
    expect(event.timestamp).toBeTruthy();
    expect(event.type).toBe("mesh_updated");
    expect(event.subject).toBe("mesh-1");
    expect(event.payload.action).toBe("created");
  });

  it("operation_started_event_is_recorded", () => {
    const svc = new EventService();
    svc.recordOperationStarted("op-1");
    expect(svc.list().some((e) => e.type === "operation_started")).toBe(true);
  });

  it("operation_completed_event_is_recorded", () => {
    const svc = new EventService();
    svc.recordOperationCompleted("op-2");
    expect(svc.list().some((e) => e.type === "operation_completed")).toBe(true);
  });

  it("operation_failed_event_is_recorded", () => {
    const svc = new EventService();
    svc.recordOperationFailed("op-3", "boom");
    const failed = svc.list().find((e) => e.type === "operation_failed");
    expect(failed?.payload.error).toBe("boom");
  });

  it("mesh_updated_audit_event_is_recorded", () => {
    const svc = new EventService();
    svc.recordMeshUpdated("m1", "updated");
    expect(svc.queryByMesh("m1").length).toBeGreaterThan(0);
  });

  it("conflict_resolved_audit_event_is_recorded", () => {
    const svc = new EventService();
    svc.recordConflictResolved("c1");
    expect(svc.list().some((e) => e.type === "conflict_resolved")).toBe(true);
  });

  it("events_are_append_only", () => {
    const svc = new EventService();
    svc.recordOperationStarted("op-a");
    svc.recordOperationStarted("op-b");
    const list = svc.list();
    expect(list).toHaveLength(2);
    expect(list[0].subject).toBe("op-a");
  });

  it("session_lifecycle_events_queryable", () => {
    const svc = new EventService();
    svc.recordSessionLifecycle("sess-1", "running");
    expect(svc.queryBySession("sess-1").some((e) => e.type === "session_lifecycle")).toBe(
      true,
    );
  });
});
