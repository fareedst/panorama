// [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]

"use client";

import { useState } from "react";

export interface CompareFilterThresholdDialogProps {
  isOpen: boolean;
  sizeThreshold: number | null;
  timeThreshold: string | null;
  onClose: () => void;
  onApply: (sizeThreshold: number | null, timeThreshold: string | null) => void;
}

function formatTimeThresholdInput(timeThreshold: string | null): string {
  return timeThreshold !== null
    ? new Date(timeThreshold).toISOString().slice(0, 16)
    : "";
}

function CompareFilterThresholdForm({
  sizeThreshold,
  timeThreshold,
  onClose,
  onApply,
}: Omit<CompareFilterThresholdDialogProps, "isOpen">) {
  const [sizeInput, setSizeInput] = useState(() =>
    sizeThreshold !== null ? String(sizeThreshold) : "",
  );
  const [timeInput, setTimeInput] = useState(() =>
    formatTimeThresholdInput(timeThreshold),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="compare-filter-threshold-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-filter-threshold-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-full max-w-md mx-4 border border-gray-300 dark:border-gray-700">
        <h2
          id="compare-filter-threshold-title"
          className="text-lg font-semibold mb-3"
        >
          Compare filter thresholds
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Used by larger/smaller than specified and newer/older than specified
          filters.
        </p>
        <label className="block mb-3">
          <span className="text-sm font-medium">Size (bytes)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600"
            data-testid="compare-filter-size-threshold"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="e.g. 1048576"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium">Time (local)</span>
          <input
            type="datetime-local"
            className="mt-1 w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600"
            data-testid="compare-filter-time-threshold"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded border dark:border-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded bg-blue-600 text-white"
            data-testid="compare-filter-threshold-apply"
            onClick={() => {
              const size =
                sizeInput.trim() === ""
                  ? null
                  : Math.max(0, Number.parseInt(sizeInput, 10));
              const time =
                timeInput.trim() === ""
                  ? null
                  : new Date(timeInput).toISOString();
              onApply(
                Number.isNaN(size as number) ? null : size,
                time,
              );
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompareFilterThresholdDialog({
  isOpen,
  sizeThreshold,
  timeThreshold,
  onClose,
  onApply,
}: CompareFilterThresholdDialogProps) {
  if (!isOpen) return null;

  return (
    <CompareFilterThresholdForm
      key={`${sizeThreshold ?? ""}-${timeThreshold ?? ""}`}
      sizeThreshold={sizeThreshold}
      timeThreshold={timeThreshold}
      onClose={onClose}
      onApply={onApply}
    />
  );
}
