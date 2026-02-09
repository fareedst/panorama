// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
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
}: ToolbarProps) {
  const registry = getKeybindingRegistry();

  if (!config.enabled) return null;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1
        bg-gray-100 dark:bg-gray-900
        border-b border-gray-300 dark:border-gray-700
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="toolbar"
      aria-label="File manager toolbar"
    >
      {config.groups.map((group, groupIndex) => (
        <ToolbarGroup
          key={group.name}
          name={group.name}
          showSeparator={groupIndex > 0}
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
              />
            );
          })}
        </ToolbarGroup>
      ))}
    </div>
  );
}
