"use client";

// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]: Dialog to save workspace as mesh

import { useState } from "react";

export interface SaveWorkspaceMeshDialogProps {
  isOpen: boolean;
  defaultName?: string;
  onClose: () => void;
  onSave: (name: string, note?: string) => Promise<void>;
}

export function SaveWorkspaceMeshDialog({
  isOpen,
  defaultName = "",
  onClose,
  onSave,
}: SaveWorkspaceMeshDialogProps) {
  if (!isOpen) {
    return null;
  }
  return (
    <SaveWorkspaceMeshDialogForm
      defaultName={defaultName}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

type FormProps = Pick<SaveWorkspaceMeshDialogProps, "defaultName" | "onClose" | "onSave">;

/** Mounted only while open — fresh state each open without setState-in-effect. */
function SaveWorkspaceMeshDialogForm({ defaultName = "", onClose, onSave }: FormProps) {
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Mesh name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed, note.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mesh");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="save-workspace-mesh-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-workspace-mesh-title"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white p-6 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
      >
        <h2
          id="save-workspace-mesh-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Save workspace as mesh
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Stores pane paths, layout, and UI state as a new mesh configuration.
        </p>
        <label className="mt-4 block text-sm text-zinc-700 dark:text-zinc-300">
          Mesh name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            data-testid="save-workspace-mesh-name"
            disabled={saving}
          />
        </label>
        <label className="mt-3 block text-sm text-zinc-700 dark:text-zinc-300">
          Note (optional)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            data-testid="save-workspace-mesh-note"
            disabled={saving}
          />
        </label>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" data-testid="save-workspace-mesh-error">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            data-testid="save-workspace-mesh-cancel"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
            data-testid="save-workspace-mesh-submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save mesh"}
          </button>
        </div>
      </form>
    </div>
  );
}
