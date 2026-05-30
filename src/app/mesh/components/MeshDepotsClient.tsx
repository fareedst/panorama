"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]
// how: Per-mesh depots sub-route — fetch mesh, add/remove depots via API, credential reference UI stub; testids mesh-depots, add-depot-*, depot-summary, manage-credentials-btn.

import { useCallback, useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type DepotRow = { id: string; name: string; kind: string; root?: string };

type MeshDepotsData = {
  mesh: {
    id: string;
    name: string;
    depots: DepotRow[];
  };
};

export function MeshDepotsClient({ meshId }: { meshId: string }) {
  const [data, setData] = useState<MeshDepotsData | null>(null);
  const [depotName, setDepotName] = useState("");
  const [depotKind, setDepotKind] = useState<"local" | "remote" | "virtual">("local");
  const [depotRoot, setDepotRoot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [credentialDenied, setCredentialDenied] = useState(false);

  // [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [REQ-MESH_GUI]: how: reload fetches mesh DTO on mount and after depot mutations.
  const reload = useCallback(async () => {
    const res = await fetch(`/api/mesh/${meshId}`);
    if (!res.ok) {
      setError(res.status === 404 ? "Mesh not found" : "Failed to load mesh");
      setData(null);
      return;
    }
    const json = (await res.json()) as MeshDepotsData;
    setData(json);
    setError(null);
  }, [meshId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / meshId change
    void reload();
  }, [reload]);

  // [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [REQ-MESH_GUI]: how: addDepot validates name/root, POSTs depot, clears form, reloads list.
  async function addDepot() {
    setError(null);
    if (!depotName.trim() || !depotRoot.trim()) {
      setError("Depot name and root are required");
      return;
    }
    const res = await fetch(`/api/mesh/${meshId}/depots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: depotName.trim(),
        kind: depotKind,
        root: depotRoot.trim(),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error?.message ?? "Failed to add depot");
      return;
    }
    setDepotName("");
    setDepotRoot("");
    await reload();
  }

  // [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [REQ-MESH_GUI]: how: removeDepot DELETEs by id then reloads mesh depots.
  async function removeDepot(depotId: string) {
    await fetch(`/api/mesh/${meshId}/depots/${depotId}`, { method: "DELETE" });
    await reload();
  }

  if (!data) {
    return (
      <div data-testid="mesh-depots">
        <MeshDetailNav meshId={meshId} />
        <p className="text-sm text-zinc-400">{error ?? "Loading depots…"}</p>
      </div>
    );
  }

  return (
    <div data-testid="mesh-depots">
      <MeshDetailNav meshId={meshId} />
      <h1 className="text-2xl font-semibold">Depots — {data.mesh.name}</h1>
      {error && (
        <p className="mt-2 text-sm text-red-400" data-testid="mesh-depots-error">
          {error}
        </p>
      )}

      <section className="mt-6 rounded border border-zinc-800 p-4" data-testid="add-depot-form">
        <h2 className="text-lg font-medium">Add depot</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={depotName}
            onChange={(e) => setDepotName(e.target.value)}
            placeholder="Name"
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-depot-name"
          />
          <select
            value={depotKind}
            onChange={(e) => setDepotKind(e.target.value as typeof depotKind)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-depot-kind"
          >
            <option value="local">Local</option>
            <option value="remote">Remote</option>
            <option value="virtual">Virtual</option>
          </select>
          <input
            value={depotRoot}
            onChange={(e) => setDepotRoot(e.target.value)}
            placeholder="Root path"
            className="min-w-[200px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-depot-root"
          />
          <button
            type="button"
            onClick={() => void addDepot()}
            className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
            data-testid="add-depot-btn"
          >
            Add depot
          </button>
        </div>
      </section>

      {/* [IMPL-MESH_GUI] [REQ-MESH_PLATFORM] [IMPL-MESH_AUTH]: how: credential reference stub — operator role may be denied (403). */}
      <section
        className="mt-6 rounded border border-zinc-800 p-4"
        data-testid="depot-credentials-section"
      >
        <h2 className="text-lg font-medium">Depot credentials</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Credential references are labels only; secrets are never stored in mesh exports.
        </p>
        <button
          type="button"
          className="mt-2 rounded bg-zinc-700 px-3 py-2 text-sm"
          data-testid="manage-credentials-btn"
          onClick={() => {
            void fetch("/api/mesh/credentials", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-mesh-role": "operator",
              },
              body: JSON.stringify({ label: "test" }),
            }).then((res) => {
              setCredentialDenied(res.status === 403);
            });
          }}
        >
          Manage credentials
        </button>
        {credentialDenied && (
          <p className="mt-2 text-sm text-amber-300" data-testid="credential-denied">
            Credential management denied for operator role
          </p>
        )}
      </section>

      <section className="mt-6" data-testid="depot-summary">
        <h2 className="text-lg font-medium">Depots ({data.mesh.depots.length})</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-300">
          {data.mesh.depots.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <span>
                {d.name} ({d.kind}) — {d.root ?? ""}
              </span>
              <button
                type="button"
                onClick={() => void removeDepot(d.id)}
                className="text-xs text-red-400 hover:underline"
                data-testid={`remove-depot-${d.id}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
