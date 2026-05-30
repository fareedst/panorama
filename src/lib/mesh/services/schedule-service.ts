// [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_PLATFORM]: Per-mesh interval scheduling metadata

export type ScheduleMode = "manual" | "interval" | "disabled";

export type MeshSchedule = {
  meshId: string;
  mode: ScheduleMode;
  intervalMinutes?: number;
  enabled: boolean;
  lastRunAt?: string;
  lastFailure?: string;
  runCount: number;
};

export type ScheduleTickResult = {
  meshId: string;
  started: boolean;
  reason?: string;
};

export class ScheduleService {
  private readonly schedules = new Map<string, MeshSchedule>();

  // [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE]: how — return stored schedule or default manual enabled with runCount zero.
  get(meshId: string): MeshSchedule {
    return (
      this.schedules.get(meshId) ?? {
        meshId,
        mode: "manual",
        enabled: true,
        runCount: 0,
      }
    );
  }

  upsert(meshId: string, patch: Partial<MeshSchedule>): MeshSchedule {
    const current = this.get(meshId);
    const next: MeshSchedule = { ...current, ...patch, meshId };
    this.schedules.set(meshId, next);
    return next;
  }

  disable(meshId: string): MeshSchedule {
    return this.upsert(meshId, { enabled: false, mode: "disabled" });
  }

  // [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE]: how — return interval schedules whose elapsed time since lastRunAt exceeds intervalMinutes; schedules without lastRunAt are immediately due.
  dueSchedules(now = Date.now()): MeshSchedule[] {
    return [...this.schedules.values()].filter((s) => {
      if (!s.enabled || s.mode !== "interval" || !s.intervalMinutes) {
        return false;
      }
      if (!s.lastRunAt) {
        return true;
      }
      const elapsed = now - new Date(s.lastRunAt).getTime();
      return elapsed >= s.intervalMinutes * 60_000;
    });
  }

  recordRun(meshId: string, success: boolean, error?: string): void {
    const s = this.get(meshId);
    this.schedules.set(meshId, {
      ...s,
      lastRunAt: new Date().toISOString(),
      lastFailure: success ? undefined : error,
      runCount: s.runCount + 1,
    });
  }
}
