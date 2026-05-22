// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// Base Toolbar component - renders groups and buttons from configuration

"use client";

import { getKeybindingRegistry } from "@/lib/files.keybinds";
import { deriveToolbarButton } from "@/lib/toolbar.utils";
import type { ToolbarConfig } from "@/lib/config.types";
import { ToolbarGroup } from "./ToolbarGroup";
import { ToolbarButton } from "./ToolbarButton";

export interface ToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  className?: string;
  /** Hide keystroke badges on buttons (compact mode). [REQ-TOOLBAR_SYSTEM] */
  showKeystroke?: boolean;
  /** Content rendered before the first button group (e.g. compact toggle). */
  leadingContent?: React.ReactNode;
  /** Force single-row layout with horizontal scroll. [REQ-TOOLBAR_SYSTEM] */
  singleRow?: boolean;
}

/**
 * Toolbar - base toolbar component
 * Renders button groups based on configuration
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
 */
export function Toolbar({
  config,
  onAction,
  activeActions = new Set(),
  disabledActions = new Set(),
  className = "",
  showKeystroke = true,
  leadingContent,
  singleRow = false,
}: ToolbarProps) {
  const registry = getKeybindingRegistry();

  if (!config.enabled) return null;

  const hasGroups = config.groups.length > 0;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1
        bg-gray-100 dark:bg-gray-900
        border-b border-gray-300 dark:border-gray-700
        ${singleRow ? "flex-nowrap overflow-x-auto min-h-0" : ""}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      role="toolbar"
      aria-label="File manager toolbar"
    >
      {leadingContent}
      {leadingContent && hasGroups && (
        <div
          className="h-8 w-px bg-gray-300 dark:bg-gray-700 shrink-0"
          role="separator"
          aria-orientation="vertical"
        />
      )}
      {config.groups.map((group, groupIndex) => (
        <ToolbarGroup
          key={group.name}
          name={group.name}
          showSeparator={groupIndex > 0 || Boolean(leadingContent)}
        >
          {group.actions.map((action) => {
            const buttonProps = deriveToolbarButton(action, registry.keybindings);
            if (!buttonProps) return null;

            return (
              <ToolbarButton
                key={action}
                {...buttonProps}
                onClick={() => onAction(action)}
                active={activeActions.has(action)}
                disabled={disabledActions.has(action)}
                showKeystroke={showKeystroke}
              />
            );
          })}
        </ToolbarGroup>
      ))}
    </div>
  );
}
