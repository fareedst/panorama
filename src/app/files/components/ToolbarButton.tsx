// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// ToolbarButton component - individual action button with icon, label, and keystroke

"use client";

import { Icon } from "@/components/Icon";

export interface ToolbarButtonProps {
  action: string;
  icon: string;
  label: string;
  keystroke: string;
  description: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  /** When false, hide keystroke badge but keep tooltip/aria-label unchanged. [REQ-TOOLBAR_SYSTEM] */
  showKeystroke?: boolean;
  /** When true, show deriveToolbarButton label visibly alongside icon. [REQ-TOOLBAR_SYSTEM] TOOLBAR_NAMED_LABELS */
  showActionLabel?: boolean;
}

/**
 * ToolbarButton - renders an individual toolbar button
 * Displays icon, label, and keyboard shortcut
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function ToolbarButton({
  action,
  icon,
  label,
  keystroke,
  description,
  onClick,
  active = false,
  disabled = false,
  className = "",
  showKeystroke = true,
  showActionLabel = false,
}: ToolbarButtonProps) {
  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_NAMED_LABELS: showVisibleLabel when named mode or when no icon fallback
  const showVisibleLabel = showActionLabel || !icon;
  const hasKeystroke = keystroke.trim().length > 0;
  const title = hasKeystroke ? `${description} (${keystroke})` : description;
  const ariaLabel = hasKeystroke
    ? `${description} - Keyboard shortcut: ${keystroke}`
    : description;

  return (
    <button
      data-testid={`toolbar-${action}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`
        flex items-center gap-1 px-1.5 py-1 text-xs rounded
        transition-colors duration-150
        hover:bg-gray-200 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {icon && <Icon name={icon} size={16} className="flex-shrink-0" />}
      {showVisibleLabel && (
        <span className="font-medium whitespace-nowrap">{label}</span>
      )}
      {showKeystroke && hasKeystroke && (
        <span
          className="px-1 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 font-mono"
          aria-hidden="true"
        >
          {keystroke}
        </span>
      )}
    </button>
  );
}
