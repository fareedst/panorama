"use client";

// [IMPL-WORKSPACE_VIEW] [IMPL-LAYOUT_CALCULATOR] [ARCH-TOOLBAR_LAYOUT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-WORKSPACE_MESH_BRIDGE] LAYOUT_TOOLBAR_PICKER — layout picker pop-over from workspace toolbar view.layout

import { useEffect } from "react";
import type { LayoutType } from "@/lib/files.layout";

export type LayoutPickerLabels = {
  tile?: string;
  oneRow?: string;
  oneColumn?: string;
  fullscreen?: string;
};

interface LayoutPickerPopoverProps {
  isOpen: boolean;
  currentLayout: LayoutType;
  labels?: LayoutPickerLabels;
  onSelect: (layout: LayoutType) => void;
  onClose: () => void;
}

const LAYOUT_OPTIONS: LayoutType[] = ["Tile", "OneRow", "OneColumn", "Fullscreen"];

const DEFAULT_LABELS: Record<LayoutType, string> = {
  Tile: "Tile",
  OneRow: "One Row",
  OneColumn: "One Column",
  Fullscreen: "Fullscreen",
};

function labelFor(layout: LayoutType, labels?: LayoutPickerLabels): string {
  switch (layout) {
    case "Tile":
      return labels?.tile ?? DEFAULT_LABELS.Tile;
    case "OneRow":
      return labels?.oneRow ?? DEFAULT_LABELS.OneRow;
    case "OneColumn":
      return labels?.oneColumn ?? DEFAULT_LABELS.OneColumn;
    case "Fullscreen":
      return labels?.fullscreen ?? DEFAULT_LABELS.Fullscreen;
    default:
      return layout;
  }
}

/** [IMPL-WORKSPACE_VIEW] Toolbar layout picker — modal list of layout types */
export function LayoutPickerPopover({
  isOpen,
  currentLayout,
  labels,
  onSelect,
  onClose,
}: LayoutPickerPopoverProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="workspace-layout-picker-overlay"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-72 max-w-[90vw]"
        data-testid="workspace-layout-picker"
        role="dialog"
        aria-label="Select layout"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Layout
        </h2>
        <div className="space-y-1">
          {LAYOUT_OPTIONS.map((layout) => (
            <button
              key={layout}
              type="button"
              data-testid={`workspace-layout-option-${layout}`}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                currentLayout === layout
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
              onClick={() => {
                onSelect(layout);
                onClose();
              }}
            >
              {labelFor(layout, labels)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
