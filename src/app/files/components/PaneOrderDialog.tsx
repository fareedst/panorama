"use client";

// [IMPL-PANE_MANAGEMENT] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]

import { useState } from "react";
import type { FilesCopyConfig } from "@/lib/config.types";

export interface PaneOrderDialogProps {
  isOpen: boolean;
  panes: { path: string }[];
  focusIndex: number;
  labels?: NonNullable<FilesCopyConfig["paneManagement"]>;
  onApply: (order: number[]) => void;
  onClose: () => void;
}

type PaneOrderDialogBodyProps = Omit<PaneOrderDialogProps, "isOpen">;

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: PaneOrderDialogApply — local order state, up/down, apply permutation

function PaneOrderDialogBody({
  panes,
  focusIndex,
  labels,
  onApply,
  onClose,
}: PaneOrderDialogBodyProps) {
  const [order, setOrder] = useState<number[]>(() => panes.map((_, i) => i));

  const move = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= order.length) return;
    setOrder((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const handleApply = () => {
    onApply(order);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="pane-order-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[28rem] max-w-[90vw]"
        data-testid="pane-order-dialog"
        role="dialog"
        aria-label={labels?.paneOrderTitle ?? "Pane order"}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {labels?.paneOrderTitle ?? "Pane order"}
        </h2>
        <ul className="space-y-2 mb-6">
          {order.map((paneIdx, index) => (
            <li
              key={paneIdx}
              className="flex items-center justify-between gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-900"
              data-testid={`pane-order-item-${index}`}
            >
              <span className="text-sm font-mono truncate text-gray-900 dark:text-gray-100 flex-1">
                <span className="text-zinc-500 dark:text-zinc-400 mr-2">{index + 1}.</span>
                {panes[paneIdx]?.path ?? ""}
                {paneIdx === focusIndex && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    {labels?.focusedBadge ?? "focused"}
                  </span>
                )}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="px-2 py-1 text-xs rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-40"
                  data-testid={`pane-order-up-${index}`}
                >
                  {labels?.moveUp ?? "Up"}
                </button>
                <button
                  type="button"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="px-2 py-1 text-xs rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-40"
                  data-testid={`pane-order-down-${index}`}
                >
                  {labels?.moveDown ?? "Down"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
          >
            {labels?.cancel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white"
            data-testid="pane-order-apply"
          >
            {labels?.paneOrderApply ?? labels?.apply ?? "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// [IMPL-PANE_MANAGEMENT] [REQ-TOOLBAR_SYSTEM]: remount body when pane paths change so draft order resets

export function PaneOrderDialog({
  isOpen,
  panes,
  focusIndex,
  labels,
  onApply,
  onClose,
}: PaneOrderDialogProps) {
  if (!isOpen) return null;
  return (
    <PaneOrderDialogBody
      key={panes.map((p) => p.path).join("|")}
      panes={panes}
      focusIndex={focusIndex}
      labels={labels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
