"use client";

// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Live sync session — phase 21

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

export function SyncSessionClient({ meshId }: { meshId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<string>("idle");
  const [events, setEvents] = useState<{ type: string; subject: string }[]>([]);

  async function createSession() {
    const res = await fetch(`/api/mesh/${meshId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    const data = await res.json();
    setSessionId(data.session.id);
    setState(data.session.state);
  }

  async function runAction(action: string) {
    if (!sessionId) {
      return;
    }
    const res = await fetch(`/api/mesh/${meshId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sessionId }),
    });
    const data = await res.json();
    if (data.session) {
      setState(data.session.state);
    }
  }

  useEffect(() => {
    const t = setInterval(() => {
      void fetch(`/api/mesh/${meshId}/events`)
        .then((r) => r.json())
        .then((d) => setEvents(d.events ?? []));
    }, 2000);
    return () => clearInterval(t);
  }, [meshId]);

  return (
    <div data-testid="active-session-view">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Sync session</h1>
      <p className="mb-2 text-sm" data-testid="session-state">
        State: {state}
      </p>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => void createSession()}
          className="rounded bg-blue-600 px-3 py-1 text-sm"
        >
          New session
        </button>
        {state === "running" && (
          <button
            type="button"
            onClick={() => void runAction("pause")}
            data-testid="pause-btn"
            className="rounded bg-zinc-700 px-3 py-1 text-sm"
          >
            Pause
          </button>
        )}
        {state === "paused" && (
          <button
            type="button"
            onClick={() => void runAction("resume")}
            data-testid="resume-btn"
            className="rounded bg-zinc-700 px-3 py-1 text-sm"
          >
            Resume
          </button>
        )}
        {(state === "running" || state === "paused") && (
          <button
            type="button"
            onClick={() => void runAction("cancel")}
            data-testid="cancel-btn"
            className="rounded bg-red-800 px-3 py-1 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
      <div
        className="mt-4 max-h-48 overflow-auto rounded border border-zinc-800 p-2 text-xs"
        data-testid="event-stream"
      >
        {events.slice(-20).map((e, i) => (
          <div key={`${e.subject}-${i}`}>
            {e.type}: {e.subject}
          </div>
        ))}
      </div>
    </div>
  );
}
