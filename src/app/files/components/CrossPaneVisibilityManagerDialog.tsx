"use client";

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]

import { useState } from "react";
import type { CrossPaneVisibilityPreset } from "@/lib/cross-pane-visibility.types";
import type { CrossPaneVisibilityStore } from "@/lib/cross-pane-visibility-store";
import type { CrossPaneVisibilityState } from "@/lib/cross-pane-visibility";

interface CrossPaneVisibilityManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  store: CrossPaneVisibilityStore;
  panesUsingPreset: (presetId: string) => number;
  focusedDraft: CrossPaneVisibilityState;
  onSaved: (preset: CrossPaneVisibilityPreset) => void;
  onDeleted: (presetId: string) => void;
}

type CrossPaneVisibilityManagerDialogBodyProps = Omit<
  CrossPaneVisibilityManagerDialogProps,
  "isOpen"
>;

type Draft = {
  id?: string;
  name: string;
  description: string;
};

function emptyDraft(): Draft {
  return { name: "", description: "" };
}

/** [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY] MANAGER_DIALOG — CRUD for compare-filter presets; how: SAVE_DRAFT_TO_CATALOG on Save, store.delete on Delete */
function CrossPaneVisibilityManagerDialogBody({
  onClose,
  store,
  panesUsingPreset,
  focusedDraft,
  onSaved,
  onDeleted,
}: CrossPaneVisibilityManagerDialogBodyProps) {
  const [presets, setPresets] = useState(() => store.list());
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);

  const loadDraft = (preset: CrossPaneVisibilityPreset) => {
    setSelectedId(preset.id);
    setDraft({
      id: preset.id,
      name: preset.name,
      description: preset.description ?? "",
    });
    setErrors([]);
  };

  const handleSave = () => {
    const payload = {
      name: draft.name,
      description: draft.description || undefined,
      state: focusedDraft,
    };
    if (selectedId === "new" || !draft.id) {
      const result = store.create(payload);
      if ("ok" in result && !result.ok) {
        setErrors(result.errors);
        return;
      }
      const preset = result as CrossPaneVisibilityPreset;
      setPresets(store.list());
      loadDraft(preset);
      onSaved(preset);
      return;
    }
    const usage = panesUsingPreset(draft.id);
    if (usage > 1 && !window.confirm(`This preset is used by ${usage} panes. Save changes for all?`)) {
      return;
    }
    const result = store.update(draft.id, payload);
    if (!result) return;
    if ("ok" in result && !result.ok) {
      setErrors(result.errors);
      return;
    }
    const preset = result as CrossPaneVisibilityPreset;
    setPresets(store.list());
    loadDraft(preset);
    onSaved(preset);
  };

  const handleDelete = () => {
    if (!draft.id) return;
    if (
      !window.confirm(
        `Delete preset "${draft.name}"? Panes using it will switch to No compare filter.`,
      )
    ) {
      return;
    }
    store.delete(draft.id);
    setPresets(store.list());
    onDeleted(draft.id);
    setSelectedId(null);
    setDraft(emptyDraft());
  };

  const handleDuplicate = () => {
    if (!draft.id) return;
    const name = `${draft.name} (copy)`;
    const result = store.duplicate(draft.id, name);
    if (result && !("ok" in result)) {
      setPresets(store.list());
      loadDraft(result);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="cross-pane-visibility-manager-dialog"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-zinc-700">
          <h2 className="text-lg font-semibold">Compare filter presets</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-800">
            ✕
          </button>
        </div>
        <div className="flex flex-1 min-h-0">
          <ul className="w-1/3 border-r dark:border-zinc-700 overflow-y-auto p-2">
            <li>
              <button
                type="button"
                className={`w-full text-left px-2 py-1 rounded text-sm ${selectedId === "new" ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                onClick={() => {
                  setSelectedId("new");
                  setDraft(emptyDraft());
                  setErrors([]);
                }}
              >
                + New from focused draft
              </button>
            </li>
            {presets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`w-full text-left px-2 py-1 rounded text-sm truncate ${selectedId === p.id ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                  onClick={() => loadDraft(p)}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedId === null ? (
              <p className="text-sm text-zinc-500">Select a preset or create from the focused pane draft.</p>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded px-2 py-1 mb-3 dark:bg-zinc-800"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  className="w-full border rounded px-2 py-1 mb-3 dark:bg-zinc-800"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
                <p className="text-xs text-zinc-500 mb-3">
                  Save copies tri-state toggles and thresholds from the focused pane toolbar.
                </p>
                {errors.length > 0 && (
                  <ul className="text-red-600 text-sm mb-2">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  {draft.id && (
                    <>
                      <button
                        type="button"
                        className="px-3 py-1 border rounded text-sm"
                        onClick={handleDuplicate}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 border border-red-500 text-red-600 rounded text-sm"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrossPaneVisibilityManagerDialog({
  isOpen,
  ...rest
}: CrossPaneVisibilityManagerDialogProps) {
  if (!isOpen) return null;
  return <CrossPaneVisibilityManagerDialogBody {...rest} />;
}
