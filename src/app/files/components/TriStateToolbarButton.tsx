// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-TOOLBAR_COMPONENT] [REQ-CROSS_PANE_VISIBILITY] [REQ-TOOLBAR_SYSTEM]

"use client";

import { Icon } from "@/components/Icon";
import type { TriState } from "@/lib/cross-pane-visibility";

export interface TriStateToolbarButtonProps {
  action: string;
  icon: string;
  label: string;
  description: string;
  triState: TriState;
  onClick: () => void;
  disabled?: boolean;
  showKeystroke?: boolean;
  showActionLabel?: boolean;
  keystroke?: string;
}

export function TriStateToolbarButton({
  action,
  icon,
  label,
  description,
  triState,
  onClick,
  disabled = false,
  showKeystroke = true,
  showActionLabel = false,
  keystroke = "",
}: TriStateToolbarButtonProps) {
  const hasKeystroke = keystroke.trim().length > 0;
  const title = hasKeystroke ? `${description} (${keystroke})` : description;
  const stateLabel =
    triState === "include"
      ? "include"
      : triState === "exclude"
        ? "exclude"
        : "off";
  const ariaLabel = `${description} — filter ${stateLabel}${hasKeystroke ? `, shortcut ${keystroke}` : ""}`;

  const activeClass =
    triState === "include"
      ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
      : triState === "exclude"
        ? "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
        : "";

  return (
    <button
      type="button"
      data-testid={`toolbar-${action}`}
      data-tri-state={triState}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={triState !== "inactive"}
      className={`
        flex items-center gap-1 px-1.5 py-1 text-xs rounded
        transition-colors duration-150
        hover:bg-gray-200 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${activeClass}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `.trim().replace(/\s+/g, " ")}
    >
      {icon && <Icon name={icon} size={16} className="flex-shrink-0" />}
      {/* [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_NAMED_LABELS: visible label in named mode else sr-only for accessibility */}
      {showActionLabel ? (
        <span className="font-medium whitespace-nowrap">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
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
