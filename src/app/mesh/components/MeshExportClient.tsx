"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_IMPORT_EXPORT] [REQ-MESH_IMPORT_EXPORT]: Per-mesh export

import { useState } from "react";
import { MeshDetailNav } from "../layout";

export function MeshExportClient({ meshId }: { meshId: string }) {
  const [message, setMessage] = useState("");

  async function exportMesh() {
    const res = await fetch(`/api/mesh/${meshId}/export`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesh-${meshId}.json`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage("Export downloaded (credentials redacted)");
  }

  return (
    <div data-testid="mesh-export-page">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Export configuration</h1>
      <button
        type="button"
        onClick={() => void exportMesh()}
        className="rounded bg-blue-600 px-3 py-2 text-sm"
        data-testid="export-mesh-btn"
      >
        Export mesh
      </button>
      {message && (
        <p className="mt-4 text-sm text-zinc-300" data-testid="export-message">
          {message}
        </p>
      )}
    </div>
  );
}
