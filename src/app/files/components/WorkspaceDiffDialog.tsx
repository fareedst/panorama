"use client";

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-TOOLBAR_SYSTEM]: DIFF_SAVED_VS_CURRENT — dialog showing saved vs current workspace snapshot diff

import type { WorkspaceSnapshotChange } from "@/lib/workspace-mesh-bridge";

export interface WorkspaceDiffDialogProps {
  isOpen: boolean;
  title?: string;
  noChangesMessage?: string;
  changes: WorkspaceSnapshotChange[];
  onClose: () => void;
}

export function WorkspaceDiffDialog({
  isOpen,
  title = "Workspace changes",
  noChangesMessage = "No differences from saved workspace.",
  changes,
  onClose,
}: WorkspaceDiffDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="workspace-diff-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-diff-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-zinc-300 bg-white p-6 shadow-lg dark:border-zinc-600 dark:bg-zinc-900">
        <h2
          id="workspace-diff-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </h2>
        {changes.length === 0 ? (
          <p
            className="mt-4 text-sm text-zinc-600 dark:text-zinc-400"
            data-testid="workspace-diff-no-changes"
          >
            {noChangesMessage}
          </p>
        ) : (
          <table className="mt-4 w-full text-sm" data-testid="workspace-diff-table">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="pb-2 pr-2">Field</th>
                <th className="pb-2 pr-2">Saved</th>
                <th className="pb-2">Current</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((row) => (
                <tr
                  key={row.field}
                  className="border-t border-zinc-200 dark:border-zinc-700"
                  data-testid={`workspace-diff-row-${row.field.replace(/\s+/g, "-")}`}
                >
                  <td className="py-2 pr-2 font-medium text-zinc-800 dark:text-zinc-200">
                    {row.field}
                  </td>
                  <td className="py-2 pr-2 text-zinc-600 dark:text-zinc-400">{row.saved}</td>
                  <td className="py-2 text-zinc-900 dark:text-zinc-100">{row.current}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            data-testid="workspace-diff-close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
