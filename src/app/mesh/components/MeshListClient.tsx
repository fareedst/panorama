"use client";

// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh list view — phase 18

import Link from "next/link";
import { useEffect, useState } from "react";

type MeshRow = {
  id: string;
  name: string;
  status: string;
  depots?: { id: string }[];
};

export function MeshListClient() {
  const [meshes, setMeshes] = useState<MeshRow[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch(`/api/mesh?includeArchived=${includeArchived}`);
    const data = await res.json();
    setMeshes(data.meshes ?? []);
  }

  useEffect(() => {
    void load();
  }, [includeArchived]);

  async function createMesh() {
    if (!name.trim()) {
      return;
    }
    await fetch("/api/mesh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold" data-testid="mesh-list-heading">
        Meshes
      </h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New mesh name"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          data-testid="new-mesh-name"
        />
        <button
          type="button"
          onClick={() => void createMesh()}
          className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
          data-testid="create-mesh-btn"
        >
          Create mesh
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            data-testid="show-archived"
          />
          Show archived
        </label>
      </div>
      <table className="w-full text-sm" data-testid="mesh-list-table">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-zinc-500">
            <th className="py-2">Name</th>
            <th>State</th>
            <th>Depots</th>
          </tr>
        </thead>
        <tbody>
          {meshes.map((m) => (
            <tr key={m.id} className="border-b border-zinc-900" data-testid="mesh-row">
              <td className="py-2">
                <Link href={`/mesh/${m.id}`} className="text-blue-400 hover:underline">
                  {m.name}
                </Link>
              </td>
              <td>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    m.status === "archived" ? "bg-zinc-700" : "bg-green-900 text-green-200"
                  }`}
                  data-testid="mesh-status-badge"
                >
                  {m.status}
                </span>
              </td>
              <td>{m.depots?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
