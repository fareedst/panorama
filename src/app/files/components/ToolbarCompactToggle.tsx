// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Toolbar compact/expand toggle control

"use client";

import { Icon } from "@/components/Icon";

export interface ToolbarCompactToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle on first top toolbar switches session toolbarExpanded state; expanded shows three tiers with keystroke badges; compact shows merged single row icon-only; tooltips unchanged
/**
 * ToolbarCompactToggle - leading control to switch toolbar compact/expanded modes
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
 */
export function ToolbarCompactToggle({ expanded, onToggle }: ToolbarCompactToggleProps) {
  const title = expanded ? "Compact toolbar" : "Expand toolbar";

  return (
    <button
      type="button"
      data-testid="toolbar-compact-toggle"
      onClick={onToggle}
      aria-pressed={!expanded}
      aria-label={title}
      title={title}
      className={`
        flex items-center justify-center px-1.5 py-1 text-xs rounded
        transition-colors duration-150
        hover:bg-gray-200 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `.trim().replace(/\s+/g, " ")}
    >
      <Icon name={expanded ? "chevrons-up" : "chevrons-down"} size={16} className="flex-shrink-0" />
    </button>
  );
}
