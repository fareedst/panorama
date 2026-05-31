"use client";

// [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [ARCH-MOUSE_SUPPORT] [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION]

import { useState } from "react";
import type { FilesCopyConfig } from "@/lib/config.types";
import type { FileStat } from "@/lib/files.types";
import {
  isEarliestLatestModeAvailable,
  resolveTouchBasenames,
  type TouchFilePaneTarget,
  type TouchMtimeMode,
} from "@/lib/touch-file";

export interface TouchApplySelection {
  paneTarget: TouchFilePaneTarget;
  mtimeMode: TouchMtimeMode;
  specifiedDate: Date | null;
}

export interface TouchFileDialogProps {
  isOpen: boolean;
  initiatingPaneIndex: number;
  paneCount: number;
  file: FileStat;
  marksAtOpen: Set<string>;
  paneFilesList: readonly (readonly FileStat[])[];
  paneLabels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  touchLabels?: NonNullable<FilesCopyConfig["touchFile"]>;
  onApply: (selection: TouchApplySelection) => void;
  onClose: () => void;
}

type TouchFileDialogBodyProps = Omit<TouchFileDialogProps, "isOpen">;

const PANE_TARGETS: {
  target: TouchFilePaneTarget;
  labelKey: "setBaseInThisPane" | "setBaseInAllPanes";
  testId: string;
}[] = [
  { target: "thisPane", labelKey: "setBaseInThisPane", testId: "touch-in-this-pane" },
  { target: "allPanes", labelKey: "setBaseInAllPanes", testId: "touch-in-all-panes" },
];

const MTIME_MODES: {
  mode: TouchMtimeMode;
  labelKey: keyof NonNullable<FilesCopyConfig["touchFile"]>;
  testId: string;
}[] = [
  { mode: "now", labelKey: "touchMtimeNow", testId: "touch-mtime-now" },
  {
    mode: "specified",
    labelKey: "touchMtimeSpecified",
    testId: "touch-mtime-specified",
  },
  {
    mode: "earliest",
    labelKey: "touchMtimeEarliest",
    testId: "touch-mtime-earliest",
  },
  {
    mode: "latest",
    labelKey: "touchMtimeLatest",
    testId: "touch-mtime-latest",
  },
];

const DEFAULT_PANE_LABELS: Record<string, string> = {
  setBaseInThisPane: "In this pane",
  setBaseInAllPanes: "In all panes",
};

const DEFAULT_TOUCH_LABELS: Record<string, string> = {
  touchTitle: "Touch",
  touchMtimeNow: "Now",
  touchMtimeSpecified: "A specified time",
  touchMtimeEarliest: "Earliest time in all panes",
  touchMtimeLatest: "Latest time in all panes",
  touchTimeLocal: "Local",
  touchTimeUtc: "UTC",
  touchApply: "Apply",
  cancel: "Cancel",
};

/** [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — parse datetime-local as local or UTC wall time */
export function parseSpecifiedMtime(
  input: string,
  zone: "local" | "utc",
): Date | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (
    [year, month, day, hour, minute].some((n) => Number.isNaN(n)) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  if (zone === "utc") {
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
  }
  return new Date(year, month - 1, day, hour, minute);
}

function TouchFileDialogBody({
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneFilesList,
  paneLabels,
  touchLabels,
  onApply,
  onClose,
}: TouchFileDialogBodyProps) {
  const [paneTarget, setPaneTarget] = useState<TouchFilePaneTarget>("thisPane");
  const [mtimeMode, setMtimeMode] = useState<TouchMtimeMode>("now");
  const [specifiedInput, setSpecifiedInput] = useState("");
  const [timeZoneMode, setTimeZoneMode] = useState<"local" | "utc">("local");

  const basenames = resolveTouchBasenames(marksAtOpen, file);
  const earliestLatestAvailable = isEarliestLatestModeAvailable(
    paneFilesList,
    basenames,
  );

  const title = touchLabels?.touchTitle ?? DEFAULT_TOUCH_LABELS.touchTitle;
  const targetLabel =
    marksAtOpen.size > 0
      ? `${marksAtOpen.size} marked file(s)`
      : file.name;

  const specifiedDate =
    mtimeMode === "specified"
      ? parseSpecifiedMtime(specifiedInput, timeZoneMode)
      : null;

  const applyDisabled =
    mtimeMode === "specified" &&
    (specifiedInput.trim() === "" || specifiedDate === null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleApply = () => {
    onApply({
      paneTarget,
      mtimeMode,
      specifiedDate: mtimeMode === "specified" ? specifiedDate : null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="touch-file-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[32rem] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        data-testid="touch-file-dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p
          className="text-sm font-mono truncate text-zinc-600 dark:text-zinc-400 mb-1"
          data-testid="touch-file-target"
          title={file.path}
        >
          {targetLabel}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Pane {initiatingPaneIndex + 1} of {paneCount}
        </p>

        <fieldset className="mb-4">
          {/* [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — pane target radio group reuses set-base copy labels */}
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
                    name="touch-pane-target"
                    checked={paneTarget === target}
                    onChange={() => setPaneTarget(target)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-4">
          {/* [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — mtime mode radios; disable earliest/latest when basename not shared */}
          <legend className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Modification time
          </legend>
          <div className="space-y-1">
            {MTIME_MODES.map(({ mode, labelKey, testId }) => {
              const label =
                (touchLabels?.[labelKey] as string | undefined) ??
                DEFAULT_TOUCH_LABELS[labelKey];
              const disabled =
                (mode === "earliest" || mode === "latest") &&
                !earliestLatestAvailable;
              return (
                <label
                  key={mode}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  }`}
                  data-testid={testId}
                >
                  <input
                    type="radio"
                    name="touch-mtime-mode"
                    checked={mtimeMode === mode}
                    disabled={disabled}
                    onChange={() => setMtimeMode(mode)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {mtimeMode === "specified" && (
          <div className="mb-4 space-y-2">
            {/* [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — datetime-local + UTC/local toggle; Apply disabled until valid */}
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="touch-time-zone"
                  checked={timeZoneMode === "local"}
                  onChange={() => setTimeZoneMode("local")}
                  data-testid="touch-time-local"
                />
                {touchLabels?.touchTimeLocal ?? DEFAULT_TOUCH_LABELS.touchTimeLocal}
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="touch-time-zone"
                  checked={timeZoneMode === "utc"}
                  onChange={() => setTimeZoneMode("utc")}
                  data-testid="touch-time-utc"
                />
                {touchLabels?.touchTimeUtc ?? DEFAULT_TOUCH_LABELS.touchTimeUtc}
              </label>
            </div>
            <input
              type="datetime-local"
              className="w-full px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600 text-sm"
              data-testid="touch-specified-datetime"
              value={specifiedInput}
              onChange={(e) => setSpecifiedInput(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            data-testid="touch-file-cancel"
          >
            {touchLabels?.cancel ??
              paneLabels?.cancel ??
              DEFAULT_TOUCH_LABELS.cancel}
          </button>
          <button
            type="button"
            disabled={applyDisabled}
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="touch-file-apply"
          >
            {touchLabels?.touchApply ?? DEFAULT_TOUCH_LABELS.touchApply}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TouchFileDialog({
  isOpen,
  initiatingPaneIndex,
  paneCount,
  file,
  marksAtOpen,
  paneFilesList,
  paneLabels,
  touchLabels,
  onApply,
  onClose,
}: TouchFileDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <TouchFileDialogBody
      key={`${file.path}|${initiatingPaneIndex}|${[...marksAtOpen].sort().join(",")}`}
      initiatingPaneIndex={initiatingPaneIndex}
      paneCount={paneCount}
      file={file}
      marksAtOpen={marksAtOpen}
      paneFilesList={paneFilesList}
      paneLabels={paneLabels}
      touchLabels={touchLabels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
