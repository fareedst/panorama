"use client";

// [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MAKE_DIRECTORY] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]

import { useState } from "react";
import type { FilesCopyConfig } from "@/lib/config.types";
import { validateRenameBasename } from "@/lib/rename-regex";
import type { MakeDirectoryPaneTarget } from "@/lib/make-directory";

export interface MakeDirectoryApplySelection {
  paneTarget: MakeDirectoryPaneTarget;
  directoryName: string;
}

export interface MakeDirectoryDialogProps {
  isOpen: boolean;
  initiatingPaneIndex: number;
  paneCount: number;
  paneLabels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  makeDirectoryLabels?: NonNullable<FilesCopyConfig["makeDirectory"]>;
  onApply: (selection: MakeDirectoryApplySelection) => void;
  onClose: () => void;
}

type MakeDirectoryDialogBodyProps = Omit<MakeDirectoryDialogProps, "isOpen">;

const PANE_TARGETS: {
  target: MakeDirectoryPaneTarget;
  labelKey: "setBaseInThisPane" | "setBaseInAllPanes";
  testId: string;
}[] = [
  { target: "thisPane", labelKey: "setBaseInThisPane", testId: "make-in-this-pane" },
  { target: "allPanes", labelKey: "setBaseInAllPanes", testId: "make-in-all-panes" },
];

const DEFAULT_PANE_LABELS: Record<string, string> = {
  setBaseInThisPane: "In this pane",
  setBaseInAllPanes: "In all panes",
};

const DEFAULT_MAKE_DIRECTORY_LABELS: Record<string, string> = {
  makeDirectoryTitle: "Make directory",
  directoryNameLabel: "Directory name",
  makeDirectoryApply: "Create",
  cancel: "Cancel",
};

function MakeDirectoryDialogBody({
  initiatingPaneIndex,
  paneCount,
  paneLabels,
  makeDirectoryLabels,
  onApply,
  onClose,
}: MakeDirectoryDialogBodyProps) {
  const [paneTarget, setPaneTarget] = useState<MakeDirectoryPaneTarget>("thisPane");
  const [directoryName, setDirectoryName] = useState("");

  const title =
    makeDirectoryLabels?.makeDirectoryTitle ??
    DEFAULT_MAKE_DIRECTORY_LABELS.makeDirectoryTitle;
  const trimmedName = directoryName.trim();
  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — Apply disabled when name empty or validateRenameBasename fails
  const applyDisabled =
    trimmedName === "" || !validateRenameBasename(trimmedName);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // [IMPL-MAKE_DIRECTORY_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — Escape dismisses dialog
    if (e.key === "Escape") {
      onClose();
    }
  };

  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — Apply passes trimmed directoryName and paneTarget to onApply then onClose
  const handleApply = () => {
    if (applyDisabled) {
      return;
    }
    onApply({ paneTarget, directoryName: trimmedName });
    onClose();
  };

  return (
    // [IMPL-MAKE_DIRECTORY_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — overlay click dismisses dialog
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="make-directory-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[32rem] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        data-testid="make-directory-dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Pane {initiatingPaneIndex + 1} of {paneCount}
        </p>

        <fieldset className="mb-4">
          {/* [IMPL-MAKE_DIRECTORY_DIALOG] [REQ-DIRECTORY_NAVIGATION]: how — pane target radio group reuses set-base copy labels */}
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
                    name="make-directory-pane-target"
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
            {makeDirectoryLabels?.directoryNameLabel ??
              DEFAULT_MAKE_DIRECTORY_LABELS.directoryNameLabel}
          </span>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600 text-sm font-mono"
            data-testid="make-directory-name-input"
            value={directoryName}
            onChange={(e) => setDirectoryName(e.target.value)}
            autoFocus
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            data-testid="make-directory-cancel"
          >
            {makeDirectoryLabels?.cancel ??
              paneLabels?.cancel ??
              DEFAULT_MAKE_DIRECTORY_LABELS.cancel}
          </button>
          <button
            type="button"
            disabled={applyDisabled}
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="make-directory-apply"
          >
            {makeDirectoryLabels?.makeDirectoryApply ??
              DEFAULT_MAKE_DIRECTORY_LABELS.makeDirectoryApply}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MakeDirectoryDialog({
  isOpen,
  initiatingPaneIndex,
  paneCount,
  paneLabels,
  makeDirectoryLabels,
  onApply,
  onClose,
}: MakeDirectoryDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <MakeDirectoryDialogBody
      key={String(initiatingPaneIndex)}
      initiatingPaneIndex={initiatingPaneIndex}
      paneCount={paneCount}
      paneLabels={paneLabels}
      makeDirectoryLabels={makeDirectoryLabels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
