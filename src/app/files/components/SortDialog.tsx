"use client";

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-LINKED_PANES]: workspace sharedSort; SortDialog Share copies draft; Shared applies sharedSort to focused pane only; new panes inherit sharedSort

import { useState } from "react";
import {
  paneSortSettingsEqual,
  type PaneSortSettings,
  type SortCriterion,
  type SortDirection,
} from "@/lib/files.utils";

interface SortDialogProps {
  isOpen: boolean;
  currentCriterion: SortCriterion;
  currentDirection: SortDirection;
  currentDirsFirst: boolean;
  paneSort: PaneSortSettings;
  sharedSort: PaneSortSettings;
  sharedButtonLabel?: string;
  shareButtonLabel?: string;
  onApply: (criterion: SortCriterion, direction: SortDirection, dirsFirst: boolean) => void;
  onApplyShared: () => void;
  onShareToWorkspace: (settings: PaneSortSettings) => void;
  onClose: () => void;
}

type SortDialogBodyProps = Omit<SortDialogProps, "isOpen">;

/**
 * SortDialogBody — draft sort state; remounts when pane sort props change [IMPL-SORT_FILTER]
 */
function SortDialogBody({
  currentCriterion,
  currentDirection,
  currentDirsFirst,
  paneSort,
  sharedSort,
  sharedButtonLabel = "Shared",
  shareButtonLabel = "Share",
  onApply,
  onApplyShared,
  onShareToWorkspace,
  onClose,
}: SortDialogBodyProps) {
  const [criterion, setCriterion] = useState<SortCriterion>(currentCriterion);
  const [direction, setDirection] = useState<SortDirection>(currentDirection);
  const [dirsFirst, setDirsFirst] = useState(currentDirsFirst);

  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: paneSortSettingsEqual returns true when sortBy sortDirection sortDirsFirst all match for Share/Shared disable logic
  const paneMatchesShared = paneSortSettingsEqual(paneSort, sharedSort);
  const shareDisabled = paneMatchesShared;
  const sharedDisabled = paneMatchesShared;

  const handleApply = () => {
    onApply(criterion, direction, dirsFirst);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="sort-dialog-overlay"
    >
      {/* [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: file manager dialogs cap panel width and add max-w-[90vw] so narrow viewports do not overflow horizontally */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
        data-testid="sort-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Sort Files
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <div className="space-y-2">
            {(["name", "size", "mtime", "extension"] as const).map((c) => (
              <label
                key={c}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              >
                <input
                  type="radio"
                  name="criterion"
                  value={c}
                  checked={criterion === c}
                  onChange={(e) => setCriterion(e.target.value as SortCriterion)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900 dark:text-gray-100">
                  {c === "name" && "Name"}
                  {c === "size" && "Size"}
                  {c === "mtime" && "Modification Time"}
                  {c === "extension" && "Extension"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Order:
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
              <input
                type="radio"
                name="direction"
                value="asc"
                checked={direction === "asc"}
                onChange={(e) => setDirection(e.target.value as SortDirection)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900 dark:text-gray-100">Ascending ↑</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
              <input
                type="radio"
                name="direction"
                value="desc"
                checked={direction === "desc"}
                onChange={(e) => setDirection(e.target.value as SortDirection)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900 dark:text-gray-100">Descending ↓</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
            <input
              type="checkbox"
              checked={dirsFirst}
              onChange={(e) => setDirsFirst(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-gray-900 dark:text-gray-100">Directories First</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            data-testid="sort-dialog-shared"
            disabled={sharedDisabled}
            onClick={() => {
              onApplyShared();
              onClose();
            }}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {sharedButtonLabel}
          </button>
          <button
            type="button"
            data-testid="sort-dialog-share"
            disabled={shareDisabled}
            onClick={() => {
              onShareToWorkspace({
                sortBy: criterion,
                sortDirection: direction,
                sortDirsFirst: dirsFirst,
              });
            }}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {shareButtonLabel}
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to apply, Escape to cancel
        </div>
      </div>
    </div>
  );
}

/**
 * SortDialog — configure file sorting; Share/Shared workspace sort [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED]
 */
export default function SortDialog({ isOpen, ...props }: SortDialogProps) {
  if (!isOpen) return null;
  const { currentCriterion, currentDirection, currentDirsFirst } = props;
  return (
    <SortDialogBody
      key={`${currentCriterion}:${currentDirection}:${currentDirsFirst}`}
      {...props}
    />
  );
}
