"use client";

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD] [REQ-TOOLBAR_SYSTEM]: STORE_FROM_WORKSPACE_UI dialog — update vs create modes

import { useState } from "react";

export type WorkspaceMeshSaveMode = "update" | "create";

export interface SaveWorkspaceMeshDialogProps {
  isOpen: boolean;
  defaultName?: string;
  /** When set, dialog offers update vs save-as-new. */
  meshId?: string;
  saveDialogTitle?: string;
  updateDialogTitle?: string;
  createModeLabel?: string;
  updateModeLabel?: string;
  updateSubmitLabel?: string;
  createSubmitLabel?: string;
  onClose: () => void;
  onSave: (name: string, note?: string, mode?: WorkspaceMeshSaveMode) => Promise<void>;
}

export function SaveWorkspaceMeshDialog({
  isOpen,
  defaultName = "",
  meshId,
  saveDialogTitle = "Save workspace as mesh",
  updateDialogTitle = "Save workspace",
  createModeLabel = "Save as new workspace",
  updateModeLabel = "Update current workspace",
  updateSubmitLabel = "Update workspace",
  createSubmitLabel = "Save as new workspace",
  onClose,
  onSave,
}: SaveWorkspaceMeshDialogProps) {
  if (!isOpen) {
    return null;
  }
  return (
    <SaveWorkspaceMeshDialogForm
      defaultName={defaultName}
      meshId={meshId}
      saveDialogTitle={saveDialogTitle}
      updateDialogTitle={updateDialogTitle}
      createModeLabel={createModeLabel}
      updateModeLabel={updateModeLabel}
      updateSubmitLabel={updateSubmitLabel}
      createSubmitLabel={createSubmitLabel}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

type FormProps = Pick<
  SaveWorkspaceMeshDialogProps,
  | "defaultName"
  | "meshId"
  | "saveDialogTitle"
  | "updateDialogTitle"
  | "createModeLabel"
  | "updateModeLabel"
  | "updateSubmitLabel"
  | "createSubmitLabel"
  | "onClose"
  | "onSave"
>;

function SaveWorkspaceMeshDialogForm({
  defaultName = "",
  meshId,
  saveDialogTitle,
  updateDialogTitle,
  createModeLabel,
  updateModeLabel,
  updateSubmitLabel,
  createSubmitLabel,
  onClose,
  onSave,
}: FormProps) {
  const canUpdate = Boolean(meshId);
  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]
  // how: default to update when meshId loaded; radio switches create vs update submit path
  const [mode, setMode] = useState<WorkspaceMeshSaveMode>(canUpdate ? "update" : "create");
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = canUpdate
    ? mode === "update"
      ? updateDialogTitle
      : saveDialogTitle
    : saveDialogTitle;

  const submitLabel =
    mode === "update" && canUpdate ? updateSubmitLabel : createSubmitLabel;

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
      await onSave(trimmed, note.trim() || undefined, canUpdate ? mode : "create");
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
          {title}
        </h2>
        {canUpdate && (
          <fieldset className="mt-4 space-y-2" data-testid="save-workspace-mesh-mode">
            <legend className="sr-only">Save mode</legend>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="workspace-mesh-mode"
                checked={mode === "update"}
                onChange={() => setMode("update")}
                disabled={saving}
                data-testid="save-workspace-mesh-mode-update"
              />
              {updateModeLabel}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="workspace-mesh-mode"
                checked={mode === "create"}
                onChange={() => setMode("create")}
                disabled={saving}
                data-testid="save-workspace-mesh-mode-create"
              />
              {createModeLabel}
            </label>
          </fieldset>
        )}
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "update" && canUpdate
            ? "Overwrites the current workspace snapshot on this mesh."
            : "Stores pane paths, layout, and UI state as a new mesh configuration."}
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
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
