"use client";

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_E2E_RELEASE]: Live sync session — approve on Plan, start on Sync

import { useCallback, useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type ApprovedSessionMeta = {
  sessionId: string;
  hasDestructive: boolean;
};

function readApprovedSession(meshId: string): ApprovedSessionMeta | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(`mesh-approved-session-${meshId}`);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ApprovedSessionMeta;
  } catch {
    return null;
  }
}

export function SyncSessionClient({ meshId }: { meshId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<string>("idle");
  const [hasDestructive, setHasDestructive] = useState(false);
  const [events, setEvents] = useState<{ type: string; subject: string }[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, failed: 0, total: 0 });

  const loadApproved = useCallback(() => {
    const meta = readApprovedSession(meshId);
    if (meta) {
      setSessionId(meta.sessionId);
      setHasDestructive(meta.hasDestructive);
      setState("idle");
    }
  }, [meshId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage on mount
    loadApproved();
  }, [loadApproved]);

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

  // [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_E2E_RELEASE]: Sync start — POST sessions action start with confirmedDestructive when plan has high-risk ops
  async function startApprovedSession(confirmedDestructive: boolean) {
    const meta = readApprovedSession(meshId);
    const sid = meta?.sessionId ?? sessionId;
    if (!sid) {
      setStartError("No approved plan — approve a plan on the Plan page first");
      return;
    }
    setStartError(null);
    const res = await fetch(`/api/mesh/${meshId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        sessionId: sid,
        confirmedDestructive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStartError(data.error?.message ?? "Start blocked");
      if (data.requiresConfirmation) {
        setHasDestructive(true);
      }
      return;
    }
    if (data.session) {
      setSessionId(data.session.id);
      setState(data.session.state);
    }
    if (data.progress) {
      setProgress(data.progress);
    }
  }

  // [IMPL-MESH_GUI] [IMPL-MESH_SESSION] [REQ-MESH_E2E_RELEASE]: Pause, resume, cancel — cancel signals runtime cancelSessionExecution via API
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

  // [IMPL-MESH_GUI] [REQ-MESH_MONITORING]: Poll events and session GET for event-stream testid and progress
  useEffect(() => {
    const t = setInterval(() => {
      void fetch(`/api/mesh/${meshId}/events`)
        .then((r) => r.json())
        .then((d) => {
          setEvents(d.events ?? []);
          if (d.progress) {
            setProgress(d.progress);
          }
        });
      if (sessionId) {
        void fetch(`/api/mesh/${meshId}/sessions?sessionId=${sessionId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.session?.state) {
              setState(d.session.state);
            }
          });
      }
    }, 1500);
    return () => clearInterval(t);
  }, [meshId, sessionId]);

  const canStart = sessionId && (state === "idle" || state === "paused");

  return (
    <div data-testid="active-session-view">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Sync session</h1>
      <p className="mb-2 text-sm" data-testid="session-state">
        State: {state}
      </p>
      {progress.total > 0 && (
        <p className="mb-2 text-sm text-zinc-400" data-testid="session-progress">
          Progress: {progress.completed}/{progress.total}
          {progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
        </p>
      )}
      {startError && (
        <p className="mb-2 text-sm text-red-300" data-testid="start-error">
          {startError}
        </p>
      )}
      {hasDestructive && state === "idle" && (
        <p
          className="mb-4 rounded border border-red-800 bg-red-950/40 p-2 text-sm text-red-200"
          data-testid="destructive-warning"
        >
          Destructive operations require explicit confirmation before sync.
        </p>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void createSession()}
          className="rounded bg-zinc-700 px-3 py-1 text-sm"
        >
          New session
        </button>
        {canStart && (
          <button
            type="button"
            onClick={() => void startApprovedSession(hasDestructive)}
            data-testid="start-sync-btn"
            className="rounded bg-blue-600 px-3 py-1 text-sm"
          >
            Start sync
          </button>
        )}
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
