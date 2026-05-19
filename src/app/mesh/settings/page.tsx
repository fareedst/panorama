"use client";

// [IMPL-MESH_GUI] [REQ-MESH_IMPORT_EXPORT]: Import/export UI — phase 27

import { useState } from "react";

export default function MeshSettingsPage() {
  const [meshId, setMeshId] = useState("");
  const [importJson, setImportJson] = useState("");
  const [message, setMessage] = useState("");

  async function exportMesh() {
    if (!meshId) {
      return;
    }
    const res = await fetch(`/api/mesh/${meshId}/export`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesh-${meshId}.json`;
    a.click();
    setMessage("Export downloaded (credentials redacted)");
  }

  async function importMesh() {
    const doc = JSON.parse(importJson) as unknown;
    const res = await fetch("/api/mesh/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Imported mesh: ${data.mesh.name}`);
    } else {
      setMessage(data.error?.message ?? "Import failed");
    }
  }

  return (
    <div data-testid="mesh-settings">
      <h1 className="mb-4 text-2xl font-semibold">Settings — Import / Export</h1>
      <section className="mb-6">
        <label className="block text-sm text-zinc-400">Mesh ID to export</label>
        <input
          value={meshId}
          onChange={(e) => setMeshId(e.target.value)}
          className="mt-1 w-full max-w-md rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          data-testid="export-mesh-id"
        />
        <button
          type="button"
          onClick={() => void exportMesh()}
          className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm"
          data-testid="export-mesh-btn"
        >
          Export configuration
        </button>
      </section>
      <section>
        <label className="block text-sm text-zinc-400">Paste export JSON to import</label>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs"
          data-testid="import-json"
        />
        <button
          type="button"
          onClick={() => void importMesh()}
          className="mt-2 rounded bg-zinc-700 px-3 py-2 text-sm"
          data-testid="import-mesh-btn"
        >
          Import as new mesh
        </button>
      </section>
      {message && (
        <p className="mt-4 text-sm text-zinc-300" data-testid="settings-message">
          {message}
        </p>
      )}
    </div>
  );
}
