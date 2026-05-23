"use client";

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]

import { useState } from "react";
import type { DisplayFilterRule, DisplayFilterSpec } from "@/lib/display-filter.types";
import type { DisplaySpecStore } from "@/lib/display-spec-store";
import { createDevelopmentCleanViewSpec } from "@/lib/display-filter-engine";
import { DisplaySpecRuleEditor } from "./DisplaySpecRuleEditor";

interface DisplaySpecManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  store: DisplaySpecStore;
  panesUsingSpec: (specId: string) => number;
  onSaved: (spec: DisplayFilterSpec) => void;
  onDeleted: (specId: string) => void;
}

type DisplaySpecManagerDialogBodyProps = Omit<DisplaySpecManagerDialogProps, "isOpen">;

type Draft = {
  id?: string;
  name: string;
  description: string;
  rules: DisplayFilterRule[];
};

function emptyDraft(): Draft {
  return { name: "", description: "", rules: [] };
}

/** [IMPL-PANE_DISPLAY_FILTER_UI] MANAGER_DIALOG_CRUD — create, save, duplicate, delete catalog specs */
function DisplaySpecManagerDialogBody({
  onClose,
  store,
  panesUsingSpec,
  onSaved,
  onDeleted,
}: DisplaySpecManagerDialogBodyProps) {
  const [specs, setSpecs] = useState(() => store.list());
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const loadDraft = (spec: DisplayFilterSpec) => {
    setSelectedId(spec.id);
    setDraft({
      id: spec.id,
      name: spec.name,
      description: spec.description ?? "",
      rules: spec.rules.map((r) => ({ ...r })),
    });
    setDirty(false);
    setErrors([]);
  };

  const handleSave = () => {
    const payload = {
      name: draft.name,
      description: draft.description || undefined,
      rules: draft.rules,
    };
    if (selectedId === "new" || !draft.id) {
      const result = store.create(payload);
      if ("ok" in result && !result.ok) {
        setErrors(result.errors);
        return;
      }
      const spec = result as DisplayFilterSpec;
      setSpecs(store.list());
      loadDraft(spec);
      onSaved(spec);
      return;
    }
    const usage = panesUsingSpec(draft.id);
    if (usage > 1 && !window.confirm(`This spec is used by ${usage} panes. Save changes for all?`)) {
      return;
    }
    const result = store.update(draft.id, payload);
    if (!result) return;
    if ("ok" in result && !result.ok) {
      setErrors(result.errors);
      return;
    }
    const spec = result as DisplayFilterSpec;
    setSpecs(store.list());
    loadDraft(spec);
    onSaved(spec);
  };

  const handleDelete = () => {
    if (!draft.id) return;
    if (!window.confirm(`Delete spec "${draft.name}"? Panes using it will switch to No filter.`)) {
      return;
    }
    store.delete(draft.id);
    setSpecs(store.list());
    onDeleted(draft.id);
    setSelectedId(null);
    setDraft(emptyDraft());
  };

  const handleDuplicate = () => {
    if (!draft.id) return;
    const name = `${draft.name} (copy)`;
    const result = store.duplicate(draft.id, name);
    if (result && !("ok" in result)) {
      setSpecs(store.list());
      loadDraft(result);
      setDirty(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="display-spec-manager-dialog"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Display filter specs</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-800">
            ✕
          </button>
        </div>
        <div className="flex flex-1 min-h-0">
          <aside className="w-48 border-r border-zinc-200 dark:border-zinc-700 p-2 overflow-y-auto">
            <button
              type="button"
              className="w-full text-left text-sm text-blue-600 mb-2"
              onClick={() => {
                setSelectedId("new");
                setDraft(emptyDraft());
                setDirty(true);
              }}
            >
              + New spec
            </button>
            <button
              type="button"
              className="w-full text-left text-xs text-zinc-500 mb-2"
              onClick={() => {
                const preset = createDevelopmentCleanViewSpec();
                setSelectedId("new");
                setDraft({
                  name: preset.name,
                  description: preset.description ?? "",
                  rules: preset.rules.map((r) => ({ ...r, id: `rule-${r.order}` })),
                });
                setDirty(true);
              }}
            >
              From preset…
            </button>
            {specs.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadDraft(s)}
                className={`w-full text-left text-sm px-2 py-1 rounded truncate ${
                  selectedId === s.id ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
              >
                {s.name}
              </button>
            ))}
          </aside>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {selectedId === null ? (
              <p className="text-sm text-zinc-500">Select or create a spec.</p>
            ) : (
              <>
                {dirty && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</p>
                )}
                <label className="block text-sm">
                  Name
                  <input
                    value={draft.name}
                    onChange={(e) => {
                      setDraft({ ...draft, name: e.target.value });
                      setDirty(true);
                    }}
                    className="w-full mt-1 border rounded px-2 py-1 dark:bg-zinc-800"
                  />
                </label>
                <label className="block text-sm">
                  Description
                  <input
                    value={draft.description}
                    onChange={(e) => {
                      setDraft({ ...draft, description: e.target.value });
                      setDirty(true);
                    }}
                    className="w-full mt-1 border rounded px-2 py-1 dark:bg-zinc-800"
                  />
                </label>
                <DisplaySpecRuleEditor
                  rules={draft.rules}
                  onChange={(rules) => {
                    setDraft({ ...draft, rules });
                    setDirty(true);
                  }}
                />
                {errors.length > 0 && (
                  <ul className="text-sm text-red-600" data-testid="display-spec-errors">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    data-testid="display-spec-save"
                  >
                    Save
                  </button>
                  <button type="button" onClick={onClose} className="px-3 py-1 border rounded text-sm">
                    Cancel
                  </button>
                  {draft.id && (
                    <>
                      <button type="button" onClick={handleDuplicate} className="px-3 py-1 border rounded text-sm">
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-1 text-red-600 text-sm ml-auto"
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

export function DisplaySpecManagerDialog({ isOpen, ...props }: DisplaySpecManagerDialogProps) {
  if (!isOpen) return null;
  return <DisplaySpecManagerDialogBody {...props} />;
}
