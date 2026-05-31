"use client";

// [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION] [REQ-MULTI_PANE_LAYOUT]

import type { FilesCopyConfig } from "@/lib/config.types";
import type { SetBaseDirectoryTarget } from "@/lib/set-base-directory";
import {
  isSetBaseDirectorySwapTarget,
  isSetBaseDirectoryTargetMultiPaneOnly,
} from "@/lib/set-base-directory";

export interface SetBaseDirectoryDialogProps {
  isOpen: boolean;
  directoryPath: string;
  initiatingPaneIndex: number;
  paneCount: number;
  allowPaneManagement: boolean;
  labels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  onApply: (target: SetBaseDirectoryTarget) => void;
  onClose: () => void;
}

type SetBaseDirectoryDialogBodyProps = Omit<SetBaseDirectoryDialogProps, "isOpen">;

const TARGETS: {
  target: SetBaseDirectoryTarget;
  labelKey: keyof NonNullable<FilesCopyConfig["paneManagement"]>;
  testId: string;
}[] = [
  { target: "thisPane", labelKey: "setBaseInThisPane", testId: "set-base-in-this-pane" },
  { target: "allPanes", labelKey: "setBaseInAllPanes", testId: "set-base-in-all-panes" },
  {
    target: "otherPanes",
    labelKey: "setBaseInOtherPanes",
    testId: "set-base-in-other-panes",
  },
  { target: "nextPane", labelKey: "setBaseInNextPane", testId: "set-base-in-next-pane" },
  {
    target: "nextPaneSwap",
    labelKey: "setBaseInNextPaneSwap",
    testId: "set-base-in-next-pane-swap",
  },
  { target: "priorPane", labelKey: "setBaseInPriorPane", testId: "set-base-in-prior-pane" },
  {
    target: "priorPaneSwap",
    labelKey: "setBaseInPriorPaneSwap",
    testId: "set-base-in-prior-pane-swap",
  },
  {
    target: "newWorkspace",
    labelKey: "setBaseNewWorkspace",
    testId: "set-base-new-workspace",
  },
];

const DEFAULT_LABELS: Record<string, string> = {
  setBaseInThisPane: "In this pane",
  setBaseInAllPanes: "In all panes",
  setBaseInOtherPanes: "In all other panes",
  setBaseInNextPane: "In the next pane",
  setBaseInNextPaneSwap: "In the next pane and swap pane position",
  setBaseInPriorPane: "In the prior pane",
  setBaseInPriorPaneSwap: "In the prior pane and swap pane position",
  setBaseNewWorkspace: "In new workspace, as the only pane",
};

function isTargetDisabled(
  target: SetBaseDirectoryTarget,
  paneCount: number,
  allowPaneManagement: boolean,
): boolean {
  if (isSetBaseDirectoryTargetMultiPaneOnly(target) && paneCount < 2) {
    return true;
  }
  if (isSetBaseDirectorySwapTarget(target) && !allowPaneManagement) {
    return true;
  }
  return false;
}

// SetBaseDirectoryDialog — [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION] [REQ-MULTI_PANE_LAYOUT]: how — secondary dialog with eight pane-target buttons plus Cancel; disabled when paneCount < 2 or swap when allowPaneManagement false

function SetBaseDirectoryDialogBody({
  directoryPath,
  initiatingPaneIndex,
  paneCount,
  allowPaneManagement,
  labels,
  onApply,
  onClose,
}: SetBaseDirectoryDialogBodyProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const handleSelect = (target: SetBaseDirectoryTarget) => {
    onApply(target);
    onClose();
  };

  const title = labels?.setBaseDirectoryTitle ?? "Set as Base directory";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="set-base-directory-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[32rem] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        data-testid="set-base-directory-dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p
          className="text-sm font-mono truncate text-zinc-600 dark:text-zinc-400 mb-4"
          data-testid="set-base-directory-path"
          title={directoryPath}
        >
          {directoryPath}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Pane {initiatingPaneIndex + 1} of {paneCount}
        </p>
        <ul className="space-y-1 mb-6">
          {TARGETS.map(({ target, labelKey, testId }) => {
            const disabled = isTargetDisabled(
              target,
              paneCount,
              allowPaneManagement,
            );
            const label =
              (labels?.[labelKey] as string | undefined) ??
              DEFAULT_LABELS[labelKey];
            return (
              <li key={target}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(target)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100"
                  data-testid={testId}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            data-testid="set-base-directory-cancel"
          >
            {labels?.cancel ?? "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SetBaseDirectoryDialog({
  isOpen,
  directoryPath,
  initiatingPaneIndex,
  paneCount,
  allowPaneManagement,
  labels,
  onApply,
  onClose,
}: SetBaseDirectoryDialogProps) {
  if (!isOpen) return null;
  return (
    <SetBaseDirectoryDialogBody
      key={`${directoryPath}|${initiatingPaneIndex}|${paneCount}`}
      directoryPath={directoryPath}
      initiatingPaneIndex={initiatingPaneIndex}
      paneCount={paneCount}
      allowPaneManagement={allowPaneManagement}
      labels={labels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
