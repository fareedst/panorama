"use client";

// [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [ARCH-MOUSE_SUPPORT] [REQ-PANE_COMMAND_EXEC] [REQ-MOUSE_INTERACTION]

import { useState } from "react";
import type { FilesCopyConfig } from "@/lib/config.types";
import type { FileStat } from "@/lib/files.types";
import type { ExecuteFilePaneTarget } from "@/lib/execute-command";

export interface ExecuteApplySelection {
  paneTarget: ExecuteFilePaneTarget;
  command: string;
}

export interface ExecuteFileDialogProps {
  isOpen: boolean;
  initiatingPaneIndex: number;
  paneCount: number;
  file: FileStat;
  marksAtOpen: Set<string>;
  paneLabels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  executeLabels?: NonNullable<FilesCopyConfig["executeFile"]>;
  onApply: (selection: ExecuteApplySelection) => void;
  onClose: () => void;
}

type ExecuteFileDialogBodyProps = Omit<ExecuteFileDialogProps, "isOpen">;

const PANE_TARGETS: {
  target: ExecuteFilePaneTarget;
  labelKey: "setBaseInThisPane" | "setBaseInAllPanes";
  testId: string;
}[] = [
  { target: "thisPane", labelKey: "setBaseInThisPane", testId: "execute-in-this-pane" },
  { target: "allPanes", labelKey: "setBaseInAllPanes", testId: "execute-in-all-panes" },
];

const DEFAULT_PANE_LABELS: Record<string, string> = {
  setBaseInThisPane: "In this pane",
  setBaseInAllPanes: "In all panes",
};

const DEFAULT_EXECUTE_LABELS: Record<string, string> = {
  executeTitle: "Execute",
  commandLabel: "Command",
  commandPlaceholder: "e.g. echo $FILE",
  executeApply: "Execute",
  cancel: "Cancel",
};

function ExecuteFileDialogBody({
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneLabels,
  executeLabels,
  onApply,
  onClose,
}: ExecuteFileDialogBodyProps) {
  const [paneTarget, setPaneTarget] = useState<ExecuteFilePaneTarget>("thisPane");
  const [command, setCommand] = useState("");

  const title = executeLabels?.executeTitle ?? DEFAULT_EXECUTE_LABELS.executeTitle;
  const targetLabel =
    marksAtOpen.size > 0
      ? `${marksAtOpen.size} marked file(s)`
      : file.name;

  const applyDisabled = command.trim() === "";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleApply = () => {
    const trimmed = command.trim();
    if (!trimmed) {
      return;
    }
    onApply({ paneTarget, command: trimmed });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="execute-file-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[32rem] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        data-testid="execute-file-dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p
          className="text-sm font-mono truncate text-zinc-600 dark:text-zinc-400 mb-1"
          data-testid="execute-file-target"
          title={file.path}
        >
          {targetLabel}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Pane {initiatingPaneIndex + 1} of {paneCount}
        </p>

        <fieldset className="mb-4">
          {/* [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — pane target radio group reuses set-base copy labels */}
          <legend className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Pane target
          </legend>
          <div className="space-y-1">
            {PANE_TARGETS.map(({ target, labelKey, testId }) => {
              const label =
                (paneLabels?.[labelKey] as string | undefined) ??
                DEFAULT_PANE_LABELS[labelKey];
              return (
                <label
                  key={target}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  data-testid={testId}
                >
                  <input
                    type="radio"
                    name="execute-pane-target"
                    checked={paneTarget === target}
                    onChange={() => setPaneTarget(target)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
            {executeLabels?.commandLabel ?? DEFAULT_EXECUTE_LABELS.commandLabel}
          </span>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600 text-sm font-mono"
            data-testid="execute-command-input"
            placeholder={
              executeLabels?.commandPlaceholder ??
              DEFAULT_EXECUTE_LABELS.commandPlaceholder
            }
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            autoFocus
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            data-testid="execute-file-cancel"
          >
            {executeLabels?.cancel ??
              paneLabels?.cancel ??
              DEFAULT_EXECUTE_LABELS.cancel}
          </button>
          <button
            type="button"
            disabled={applyDisabled}
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="execute-file-apply"
          >
            {executeLabels?.executeApply ?? DEFAULT_EXECUTE_LABELS.executeApply}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExecuteFileDialog({
  isOpen,
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneLabels,
  executeLabels,
  onApply,
  onClose,
}: ExecuteFileDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ExecuteFileDialogBody
      key={`${file.path}|${initiatingPaneIndex}|${[...marksAtOpen].sort().join(",")}`}
      initiatingPaneIndex={initiatingPaneIndex}
      paneCount={paneCount}
      file={file}
      marksAtOpen={marksAtOpen}
      paneLabels={paneLabels}
      executeLabels={executeLabels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
