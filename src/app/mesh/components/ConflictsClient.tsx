"use client";

// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Conflict resolution — phase 22

import { useCallback, useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type Conflict = {
  id: string;
  type: string;
  participants: string[];
  status: string;
};

export function ConflictsClient({ meshId }: { meshId: string }) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [selected, setSelected] = useState<Conflict | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/mesh/${meshId}/conflicts`);
    const data = await res.json();
    setConflicts(data.conflicts ?? []);
  }, [meshId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / meshId change
    void load();
  }, [load]);

  async function resolve(resolution: string) {
    if (!selected) {
      return;
    }
    await fetch(`/api/mesh/${meshId}/conflicts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolve",
        conflictId: selected.id,
        resolution,
      }),
    });
    setSelected(null);
    await load();
  }

  const pending = conflicts.filter((c) => c.status === "pending");

  return (
    <div data-testid="conflict-view">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Conflicts</h1>
      <ul className="mb-4 space-y-1" data-testid="conflict-list">
        {pending.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setSelected(c)}
              className="text-left text-blue-400 hover:underline"
            >
              {c.type} — {c.participants.join(", ")}
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="rounded border border-zinc-800 p-4" data-testid="conflict-detail">
          <p>Type: {selected.type}</p>
          <p className="text-sm text-zinc-400">Paths: {selected.participants.join(" vs ")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void resolve("prefer_source")}
              data-testid="prefer-left-btn"
              className="rounded bg-zinc-700 px-2 py-1 text-sm"
            >
              Prefer left
            </button>
            <button
              type="button"
              onClick={() => void resolve("prefer_target")}
              data-testid="prefer-right-btn"
              className="rounded bg-zinc-700 px-2 py-1 text-sm"
            >
              Prefer right
            </button>
            <button
              type="button"
              onClick={() => void resolve("keep_both")}
              data-testid="keep-both-btn"
              className="rounded bg-zinc-700 px-2 py-1 text-sm"
            >
              Keep both
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
