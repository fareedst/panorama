"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_POLICY] [REQ-MESH_GUI]: Mesh policy / rules editor

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

export function MeshRulesClient({ meshId }: { meshId: string }) {
  const [deletePolicy, setDeletePolicy] = useState("never");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch(`/api/mesh/${meshId}`)
      .then((r) => r.json())
      .then((d) => setDeletePolicy(d.mesh?.policy?.deletePolicy ?? "never"));
  }, [meshId]);

  async function save() {
    const res = await fetch(`/api/mesh/${meshId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy: { deletePolicy } }),
    });
    if (res.ok) {
      setMessage("Policy saved");
    }
  }

  return (
    <div data-testid="mesh-rules">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Rules &amp; policy</h1>
      <label className="block text-sm">
        Delete policy
        <select
          value={deletePolicy}
          onChange={(e) => setDeletePolicy(e.target.value)}
          className="ml-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          data-testid="delete-policy-select"
        >
          <option value="never">Never delete</option>
          <option value="prompt">Prompt</option>
          <option value="allow">Allow propagate</option>
        </select>
      </label>
      <button
        type="button"
        onClick={() => void save()}
        className="mt-4 rounded bg-blue-600 px-3 py-2 text-sm"
        data-testid="save-policy-btn"
      >
        Save policy
      </button>
      {message && <p className="mt-2 text-sm text-green-400">{message}</p>}
    </div>
  );
}
