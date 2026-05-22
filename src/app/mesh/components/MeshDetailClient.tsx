"use client";

// [IMPL-MESH_GUI] [REQ-MESH_GUI]: Mesh detail with depot/link management — phases 17–18

import { useCallback, useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type DepotRow = { id: string; name: string; kind: string; root?: string };
type LinkRow = {
  id: string;
  sourceDepotId: string;
  targetDepotId: string;
  direction?: string;
};

type MeshDetail = {
  mesh: {
    id: string;
    name: string;
    description?: string;
    depots: DepotRow[];
    links: LinkRow[];
  };
  status: string;
};

export function MeshDetailClient({ meshId }: { meshId: string }) {
  const [data, setData] = useState<MeshDetail | null>(null);
  const [depotName, setDepotName] = useState("");
  const [depotKind, setDepotKind] = useState<"local" | "remote" | "virtual">("local");
  const [depotRoot, setDepotRoot] = useState("");
  const [linkSource, setLinkSource] = useState("");
  const [linkTarget, setLinkTarget] = useState("");
  const [linkDirection, setLinkDirection] = useState<"one_way" | "bidirectional">("one_way");
  const [error, setError] = useState<string | null>(null);
  const [credentialDenied, setCredentialDenied] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/mesh/${meshId}`);
    const json = (await res.json()) as MeshDetail;
    setData(json);
    if (json.mesh?.depots?.length >= 2) {
      setLinkSource((prev) => prev || json.mesh.depots[0].id);
      setLinkTarget((prev) => prev || json.mesh.depots[1].id);
    }
  }, [meshId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / meshId change
    void reload();
  }, [reload]);

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

  async function addLink() {
    setError(null);
    if (!linkSource || !linkTarget) {
      setError("Select source and target depots");
      return;
    }
    const res = await fetch(`/api/mesh/${meshId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceDepotId: linkSource,
        targetDepotId: linkTarget,
        direction: linkDirection,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error?.message ?? "Failed to add link");
      return;
    }
    await reload();
  }

  async function removeDepot(depotId: string) {
    await fetch(`/api/mesh/${meshId}/depots/${depotId}`, { method: "DELETE" });
    await reload();
  }

  if (!data) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  const depotNameById = new Map(data.mesh.depots.map((d) => [d.id, d.name]));

  return (
    <div data-testid="mesh-detail">
      <MeshDetailNav meshId={meshId} />
      <h1 className="text-2xl font-semibold">{data.mesh.name}</h1>
      {data.mesh.description && (
        <p className="mt-1 text-zinc-400">{data.mesh.description}</p>
      )}
      <p className="mt-2 text-sm text-zinc-500" data-testid="mesh-detail-status">
        Status: {data.status}
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-400" data-testid="mesh-detail-error">
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

      <section className="mt-4 rounded border border-zinc-800 p-4" data-testid="add-link-form">
        <h2 className="text-lg font-medium">Add sync link</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={linkSource}
            onChange={(e) => setLinkSource(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-link-source"
          >
            <option value="">Source depot</option>
            {data.mesh.depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={linkTarget}
            onChange={(e) => setLinkTarget(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-link-target"
          >
            <option value="">Target depot</option>
            {data.mesh.depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={linkDirection}
            onChange={(e) => setLinkDirection(e.target.value as typeof linkDirection)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            data-testid="add-link-direction"
          >
            <option value="one_way">One way</option>
            <option value="bidirectional">Bidirectional</option>
          </select>
          <button
            type="button"
            onClick={() => void addLink()}
            disabled={data.mesh.depots.length < 2}
            className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-40"
            data-testid="add-link-btn"
          >
            Add link
          </button>
        </div>
      </section>

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

      <section className="mt-4" data-testid="link-summary">
        <h2 className="text-lg font-medium">Links ({data.mesh.links.length})</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
          {data.mesh.links.map((l) => (
            <li key={l.id}>
              {depotNameById.get(l.sourceDepotId) ?? l.sourceDepotId} →{" "}
              {depotNameById.get(l.targetDepotId) ?? l.targetDepotId}
              {l.direction ? ` (${l.direction})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
