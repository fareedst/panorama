// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]
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
}: ToolbarButtonProps) {
  // [REQ-TOOLBAR_SYSTEM] Only show label if no icon present
  const showLabel = !icon;
  
  return (
    <button
      data-testid={`toolbar-${action}`}
      onClick={onClick}
      disabled={disabled}
      title={`${description} (${keystroke})`}
      aria-label={`${description} - Keyboard shortcut: ${keystroke}`}
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
      {showLabel && <span className="font-medium">{label}</span>}
      <span
        className="px-1 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 font-mono"
        aria-hidden="true"
      >
        {keystroke}
      </span>
    </button>
  );
}
