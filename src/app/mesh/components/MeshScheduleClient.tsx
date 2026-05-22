"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_GUI]: Per-mesh schedule configuration UI

import { useCallback, useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type Schedule = {
  enabled: boolean;
  mode: string;
  intervalMinutes?: number;
  lastRunAt?: string;
  runCount?: number;
};

export function MeshScheduleClient({ meshId }: { meshId: string }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/mesh/${meshId}/schedule`);
    const data = await res.json();
    setSchedule(data.schedule ?? { enabled: false, mode: "disabled" });
    if (data.schedule?.intervalMinutes) {
      setIntervalMinutes(data.schedule.intervalMinutes);
    }
  }, [meshId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / meshId change
    void load();
  }, [load]);

  async function save(enabled: boolean) {
    const res = await fetch(`/api/mesh/${meshId}/schedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        mode: enabled ? "interval" : "disabled",
        intervalMinutes,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSchedule(data.schedule);
      setMessage(enabled ? "Schedule enabled" : "Schedule disabled");
    }
  }

  return (
    <div data-testid="mesh-schedule">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Schedule</h1>
      <p className="mb-2 text-sm text-zinc-400">
        Mode: {schedule?.mode ?? "disabled"} · Runs: {schedule?.runCount ?? 0}
      </p>
      {schedule?.lastRunAt && (
        <p className="mb-4 text-sm text-zinc-500">Last run: {schedule.lastRunAt}</p>
      )}
      <label className="mb-2 block text-sm">
        Interval (minutes)
        <input
          type="number"
          min={1}
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          className="ml-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          data-testid="schedule-interval"
        />
      </label>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => void save(true)}
          className="rounded bg-blue-600 px-3 py-2 text-sm"
          data-testid="schedule-enable-btn"
        >
          Enable schedule
        </button>
        <button
          type="button"
          onClick={() => void save(false)}
          className="rounded bg-zinc-700 px-3 py-2 text-sm"
          data-testid="schedule-disable-btn"
        >
          Disable schedule
        </button>
      </div>
      {message && (
        <p className="mt-4 text-sm text-green-400" data-testid="schedule-message">
          {message}
        </p>
      )}
    </div>
  );
}
