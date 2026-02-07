// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// Sort dialog component for file manager

"use client";

import { useState } from "react";
import type { SortCriterion, SortDirection } from "@/lib/files.utils";

interface SortDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Current sort criterion */
  currentCriterion: SortCriterion;
  /** Current sort direction */
  currentDirection: SortDirection;
  /** Whether directories are sorted first */
  currentDirsFirst: boolean;
  /** Callback when sort settings change */
  onApply: (criterion: SortCriterion, direction: SortDirection, dirsFirst: boolean) => void;
  /** Callback to close dialog */
  onClose: () => void;
}

/**
 * SortDialog component - allows user to configure file sorting
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 */
export default function SortDialog({
  isOpen,
  currentCriterion,
  currentDirection,
  currentDirsFirst,
  onApply,
  onClose,
}: SortDialogProps) {
  const [criterion, setCriterion] = useState<SortCriterion>(currentCriterion);
  const [direction, setDirection] = useState<SortDirection>(currentDirection);
  const [dirsFirst, setDirsFirst] = useState(currentDirsFirst);

  if (!isOpen) return null;

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
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Sort Files
        </h2>

        {/* Sort Criterion */}
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

        {/* Sort Direction */}
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

        {/* Directories First */}
        <div className="mb-6">
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

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
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
