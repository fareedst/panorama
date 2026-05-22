"use client";

// [IMPL-MESH_GUI] [REQ-MESH_MONITORING]: Session history for a mesh

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type SessionRow = { id: string; state: string };

export function MeshHistoryClient({ meshId }: { meshId: string }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    void fetch(`/api/mesh/${meshId}/sessions`)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, [meshId]);

  return (
    <div data-testid="mesh-history">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Session history</h1>
      <ul className="space-y-2 text-sm" data-testid="session-history-list">
        {sessions.length === 0 && <li className="text-zinc-500">No sessions yet</li>}
        {sessions.map((s) => (
          <li key={s.id} className="rounded border border-zinc-800 px-3 py-2">
            {s.id.slice(0, 8)}… — {s.state}
          </li>
        ))}
      </ul>
    </div>
  );
}
