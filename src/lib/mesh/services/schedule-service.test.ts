// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: Schedule service unit tests per IMPL-MESH_SCHEDULE-pseudocode

import { describe, it, expect } from "vitest";
import { ScheduleService } from "./schedule-service";

describe("ScheduleService [IMPL-MESH_SCHEDULE]", () => {
  it("schedule_can_be_disabled", () => {
    const svc = new ScheduleService();
    const s = svc.disable("mesh-1");
    expect(s.enabled).toBe(false);
    expect(s.mode).toBe("disabled");
  });

  it("interval_schedules_become_due_after_elapsed_time", () => {
    const svc = new ScheduleService();
    const past = new Date(Date.now() - 120_000).toISOString();
    svc.upsert("mesh-1", {
      mode: "interval",
      intervalMinutes: 1,
      enabled: true,
      lastRunAt: past,
    });
    const due = svc.dueSchedules(Date.now());
    expect(due.some((d) => d.meshId === "mesh-1")).toBe(true);
  });

  it("recordRun_increments_run_count", () => {
    const svc = new ScheduleService();
    svc.recordRun("mesh-1", true);
    expect(svc.get("mesh-1").runCount).toBe(1);
  });
});
