"use client";

// [IMPL-MESH_GUI] [REQ-MESH_MONITORING]: Monitoring dashboard — phase 26

import { useEffect, useState } from "react";

type Summary = {
  activeSessionCount: number;
  failedSessionCount: number;
  pendingConflictCount: number;
  meshHealth: { meshId: string; name: string; status: string; depotCount: number }[];
};

export default function MonitoringPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    void fetch("/api/mesh/monitoring")
      .then((r) => r.json())
      .then((d) => setSummary(d.summary));
  }, []);

  if (!summary) {
    return <p className="text-zinc-500">Loading monitoring…</p>;
  }

  return (
    <div data-testid="monitoring-dashboard">
      <h1 className="mb-4 text-2xl font-semibold">Monitoring</h1>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded border border-zinc-800 p-4" data-testid="active-sessions">
          <p className="text-sm text-zinc-500">Active sessions</p>
          <p className="text-2xl font-semibold">{summary.activeSessionCount}</p>
        </div>
        <div className="rounded border border-zinc-800 p-4" data-testid="failed-sessions">
          <p className="text-sm text-zinc-500">Failed sessions</p>
          <p className="text-2xl font-semibold">{summary.failedSessionCount}</p>
        </div>
        <div className="rounded border border-zinc-800 p-4" data-testid="conflict-count">
          <p className="text-sm text-zinc-500">Pending conflicts</p>
          <p className="text-2xl font-semibold">{summary.pendingConflictCount}</p>
        </div>
      </div>
      <h2 className="mb-2 text-lg font-medium">Mesh health</h2>
      <ul className="space-y-1 text-sm">
        {summary.meshHealth.map((m) => (
          <li key={m.meshId}>
            {m.name} — {m.status} — {m.depotCount} depots
          </li>
        ))}
      </ul>
    </div>
  );
}
