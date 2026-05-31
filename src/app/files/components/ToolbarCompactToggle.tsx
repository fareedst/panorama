// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Toolbar display mode cycle control

"use client";

import { Icon } from "@/components/Icon";
import type { ToolbarDisplayMode } from "@/lib/toolbar.utils";

export interface ToolbarCompactToggleProps {
  mode: ToolbarDisplayMode;
  onCycle: () => void;
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_COMPACT_TOGGLE: keystroke-free title/aria-label for next display mode on click
function nextModeLabel(mode: ToolbarDisplayMode): string {
  switch (mode) {
    case "compact":
      return "Expand toolbar";
    case "expanded":
      return "Show action labels";
    case "named":
      return "Compact toolbar";
  }
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle cycles session toolbarDisplayMode compact → expanded → named → compact
/**
 * ToolbarCompactToggle - leading control to cycle toolbar display modes
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
 */
export function ToolbarCompactToggle({ mode, onCycle }: ToolbarCompactToggleProps) {
  const title = nextModeLabel(mode);

  return (
    <button
      type="button"
      data-testid="toolbar-compact-toggle"
      data-toolbar-display-mode={mode}
      onClick={onCycle}
      aria-pressed={mode === "compact"}
      aria-label={title}
      title={title}
      className={`
        flex items-center justify-center px-1.5 py-1 text-xs rounded
        transition-colors duration-150
        hover:bg-gray-200 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `.trim().replace(/\s+/g, " ")}
    >
      <Icon
        name={mode === "compact" ? "chevrons-down" : "chevrons-up"}
        size={16}
        className="flex-shrink-0"
      />
    </button>
  );
}
