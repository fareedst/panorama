"use client";

// [IMPL-RENAME_REGEX_DIALOG] [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [ARCH-MOUSE_SUPPORT] [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION]

import { useState } from "react";
import type { FilesCopyConfig } from "@/lib/config.types";
import type { FileStat } from "@/lib/files.types";
import { validateRegex } from "@/lib/regex-validation";
import type { RenameRegexPaneTarget } from "@/lib/rename-regex";

export interface RenameRegexApplySelection {
  paneTarget: RenameRegexPaneTarget;
  matchPattern: string;
  replacement: string;
}

export interface RenameRegexDialogProps {
  isOpen: boolean;
  initiatingPaneIndex: number;
  paneCount: number;
  file: FileStat;
  marksAtOpen: Set<string>;
  paneLabels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  renameRegexLabels?: NonNullable<FilesCopyConfig["renameRegex"]>;
  onApply: (selection: RenameRegexApplySelection) => void;
  onClose: () => void;
}

type RenameRegexDialogBodyProps = Omit<RenameRegexDialogProps, "isOpen">;

const PANE_TARGETS: {
  target: RenameRegexPaneTarget;
  labelKey: "setBaseInThisPane" | "setBaseInAllPanes";
  testId: string;
}[] = [
  {
    target: "thisPane",
    labelKey: "setBaseInThisPane",
    testId: "rename-regex-in-this-pane",
  },
  {
    target: "allPanes",
    labelKey: "setBaseInAllPanes",
    testId: "rename-regex-in-all-panes",
  },
];

const DEFAULT_PANE_LABELS: Record<string, string> = {
  setBaseInThisPane: "In this pane",
  setBaseInAllPanes: "In all panes",
};

const DEFAULT_RENAME_REGEX_LABELS: Record<string, string> = {
  renameRegexTitle: "Rename Regex",
  matchPatternLabel: "Match pattern",
  replacementLabel: "Replacement text",
  renameRegexApply: "Apply",
  cancel: "Cancel",
};

function RenameRegexDialogBody({
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneLabels,
  renameRegexLabels,
  onApply,
  onClose,
}: RenameRegexDialogBodyProps) {
  const [paneTarget, setPaneTarget] = useState<RenameRegexPaneTarget>("thisPane");
  const [matchPattern, setMatchPattern] = useState("");
  const [replacement, setReplacement] = useState("");

  const title =
    renameRegexLabels?.renameRegexTitle ??
    DEFAULT_RENAME_REGEX_LABELS.renameRegexTitle;
  const targetLabel =
    marksAtOpen.size > 0
      ? `${marksAtOpen.size} marked file(s)`
      : file.name;

  const trimmedPattern = matchPattern.trim();
  const patternValidation = validateRegex(trimmedPattern);
  const applyDisabled =
    trimmedPattern === "" || !patternValidation.valid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleApply = () => {
    if (applyDisabled) {
      return;
    }
    onApply({
      paneTarget,
      matchPattern: trimmedPattern,
      replacement,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="rename-regex-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[32rem] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        data-testid="rename-regex-dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p
          className="text-sm font-mono truncate text-zinc-600 dark:text-zinc-400 mb-1"
          data-testid="rename-regex-target"
          title={file.path}
        >
          {targetLabel}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Pane {initiatingPaneIndex + 1} of {paneCount}
        </p>

        <fieldset className="mb-4">
          {/* [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS]: how — pane target radio group reuses set-base copy labels */}
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
                    name="rename-regex-pane-target"
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
            {renameRegexLabels?.matchPatternLabel ??
              DEFAULT_RENAME_REGEX_LABELS.matchPatternLabel}
          </span>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600 text-sm font-mono"
            data-testid="rename-regex-match"
            value={matchPattern}
            onChange={(e) => setMatchPattern(e.target.value)}
            autoFocus
          />
          {!patternValidation.valid && trimmedPattern !== "" && (
            <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
              {patternValidation.error}
            </span>
          )}
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
            {renameRegexLabels?.replacementLabel ??
              DEFAULT_RENAME_REGEX_LABELS.replacementLabel}
          </span>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600 text-sm font-mono"
            data-testid="rename-regex-replacement"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            data-testid="rename-regex-cancel"
          >
            {renameRegexLabels?.cancel ??
              paneLabels?.cancel ??
              DEFAULT_RENAME_REGEX_LABELS.cancel}
          </button>
          <button
            type="button"
            disabled={applyDisabled}
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="rename-regex-apply"
          >
            {renameRegexLabels?.renameRegexApply ??
              DEFAULT_RENAME_REGEX_LABELS.renameRegexApply}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RenameRegexDialog({
  isOpen,
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneLabels,
  renameRegexLabels,
  onApply,
  onClose,
}: RenameRegexDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <RenameRegexDialogBody
      key={`${file.path}|${initiatingPaneIndex}|${[...marksAtOpen].sort().join(",")}`}
      initiatingPaneIndex={initiatingPaneIndex}
      paneCount={paneCount}
      file={file}
      marksAtOpen={marksAtOpen}
      paneLabels={paneLabels}
      renameRegexLabels={renameRegexLabels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}

export default RenameRegexDialog;
