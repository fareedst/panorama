"use client";

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]

import { useState } from "react";
import type { FileColumnId, FilesColumnConfig, FilesCopyConfig } from "@/lib/config.types";
import { getVisibleFileColumns, reorderFileColumns } from "@/lib/file-columns";

export interface ColumnOrderDialogProps {
  isOpen: boolean;
  columns: FilesColumnConfig[];
  labels?: NonNullable<FilesCopyConfig["columns"]>;
  onApply: (columns: FilesColumnConfig[]) => void;
  onClose: () => void;
}

type ColumnOrderDialogBodyProps = Omit<ColumnOrderDialogProps, "isOpen">;

function columnLabel(id: FileColumnId, labels?: NonNullable<FilesCopyConfig["columns"]>): string {
  switch (id) {
    case "mtime":
      return labels?.mtimeLabel ?? "Modified";
    case "size":
      return labels?.sizeLabel ?? "Size";
    case "name":
      return labels?.nameLabel ?? "Name";
    default:
      return id;
  }
}

function ColumnOrderDialogBody({
  columns,
  labels,
  onApply,
  onClose,
}: ColumnOrderDialogBodyProps) {
  const visible = getVisibleFileColumns(columns);
  const [order, setOrder] = useState<FileColumnId[]>(() => visible.map((c) => c.id));

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
    onApply(reorderFileColumns(columns, order));
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
      data-testid="column-order-dialog-overlay"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
        data-testid="column-order-dialog"
        role="dialog"
        aria-label={labels?.columnOrderTitle ?? "Column order"}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {labels?.columnOrderTitle ?? "Column order"}
        </h2>
        <ul className="space-y-2 mb-6">
          {order.map((id, index) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-900"
              data-testid={`column-order-item-${id}`}
            >
              <span className="text-sm text-gray-900 dark:text-gray-100">{columnLabel(id, labels)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="px-2 py-1 text-xs rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-40"
                  data-testid={`column-order-up-${id}`}
                >
                  {labels?.moveUp ?? "Up"}
                </button>
                <button
                  type="button"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="px-2 py-1 text-xs rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-40"
                  data-testid={`column-order-down-${id}`}
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
            data-testid="column-order-apply"
          >
            {labels?.apply ?? "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ColumnOrderDialog({ isOpen, columns, labels, onApply, onClose }: ColumnOrderDialogProps) {
  if (!isOpen) return null;
  return (
    <ColumnOrderDialogBody
      key={columns.map((c) => c.id).join(",")}
      columns={columns}
      labels={labels}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
