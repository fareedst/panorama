"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_EVENTS] [REQ-MESH_MONITORING]: Event log viewer

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type EventRow = { type: string; subject: string; timestamp: string };

export function MeshLogsClient({ meshId }: { meshId: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    void fetch(`/api/mesh/${meshId}/events`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
  }, [meshId]);

  return (
    <div data-testid="mesh-logs">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Logs</h1>
      <ul className="max-h-96 space-y-1 overflow-auto text-xs" data-testid="event-log-list">
        {events.map((e, i) => (
          <li key={`${e.timestamp}-${i}`} className="font-mono text-zinc-400">
            {e.timestamp} {e.type} {e.subject}
          </li>
        ))}
      </ul>
    </div>
  );
}
