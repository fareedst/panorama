"use client";

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: L5 GUI mesh list enriches GET /api/mesh rows.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { extractNotePrefixFromDescription } from "@/lib/workspace-mesh-bridge";
import { formatDateTime } from "@/lib/files.utils";

type MeshRow = {
  id: string;
  name: string;
  status: string;
  description?: string;
  updatedAt?: string;
  depots?: { id: string }[];
};

type SortColumn = "name" | "status" | "depots" | "note" | "updatedAt";
type SortDirection = "asc" | "desc";

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
// how: Note column uses extractNotePrefixFromDescription(description) per mesh row.
function meshNote(row: MeshRow): string {
  return extractNotePrefixFromDescription(row.description);
}

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]
// how: compareMeshes sorts client-side by name, status, depot count, note, or updatedAt.
function compareMeshes(a: MeshRow, b: MeshRow, column: SortColumn, direction: SortDirection): number {
  const sign = direction === "asc" ? 1 : -1;
  switch (column) {
    case "name":
      return sign * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "status":
      return sign * a.status.localeCompare(b.status, undefined, { sensitivity: "base" });
    case "depots": {
      const da = a.depots?.length ?? 0;
      const db = b.depots?.length ?? 0;
      return sign * (da - db);
    }
    case "note":
      return sign * meshNote(a).localeCompare(meshNote(b), undefined, { sensitivity: "base" });
    case "updatedAt": {
      const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return sign * (ta - tb);
    }
    default:
      return 0;
  }
}

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]
// how: SortableHeader toggles sortColumn/sortDirection; aria-sort on active column; testids mesh-list-sort-*.
function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  testId,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  testId: string;
}) {
  const isActive = activeColumn === column;
  const ariaSort = isActive ? (direction === "asc" ? "ascending" : "descending") : "none";
  const indicator = isActive ? (direction === "asc" ? " ↑" : " ↓") : "";
  return (
    <th className="py-2">
      <button
        type="button"
        className="text-left font-normal hover:text-zinc-300"
        onClick={() => onSort(column)}
        aria-sort={ariaSort}
        data-testid={testId}
      >
        {label}
        {indicator}
      </button>
    </th>
  );
}

export function MeshListClient() {
  const [meshes, setMeshes] = useState<MeshRow[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [name, setName] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const load = useCallback(async () => {
    const res = await fetch(`/api/mesh?includeArchived=${includeArchived}`);
    const data = await res.json();
    setMeshes(data.meshes ?? []);
  }, [includeArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / filter change
    void load();
  }, [load]);

  // [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]
  // how: sortedMeshes applies compareMeshes whenever meshes or sort state changes.
  const sortedMeshes = useMemo(
    () =>
      [...meshes].sort((a, b) => compareMeshes(a, b, sortColumn, sortDirection)),
    [meshes, sortColumn, sortDirection],
  );

  // [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]
  // how: handleSort toggles direction on same column or resets to asc on new column.
  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

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
            <SortableHeader
              label="Name"
              column="name"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
              testId="mesh-list-sort-name"
            />
            <SortableHeader
              label="State"
              column="status"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
              testId="mesh-list-sort-status"
            />
            <SortableHeader
              label="Depots"
              column="depots"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
              testId="mesh-list-sort-depots"
            />
            <SortableHeader
              label="Note"
              column="note"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
              testId="mesh-list-sort-note"
            />
            <SortableHeader
              label="Most recent save time"
              column="updatedAt"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
              testId="mesh-list-sort-updated-at"
            />
          </tr>
        </thead>
        <tbody>
          {sortedMeshes.map((m) => {
            const note = meshNote(m);
            return (
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
                {/* [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]: mesh-list-note, mesh-list-updated-at */}
                <td data-testid="mesh-list-note">{note || "—"}</td>
                <td data-testid="mesh-list-updated-at">
                  {m.updatedAt ? formatDateTime(m.updatedAt) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
