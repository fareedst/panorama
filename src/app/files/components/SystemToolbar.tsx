// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// SystemToolbar - toolbar for system-wide actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarActionMeta, ToolbarConfig } from "@/lib/config.types";

export interface SystemToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  showKeystroke?: boolean;
  showActionLabel?: boolean;
  leadingContent?: React.ReactNode;
  tierClassName?: string;
  /** [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] toolbars.actions for toolbar-only actions (ACTIONS_META_PASS_THROUGH) */
  actionsMeta?: Record<string, ToolbarActionMeta>;
}

/**
 * SystemToolbar - wrapper for system-wide actions
 * Independent actions: help, command palette, search
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function SystemToolbar({
  config,
  onAction,
  activeActions,
  disabledActions,
  showKeystroke,
  showActionLabel,
  leadingContent,
  tierClassName,
  actionsMeta,
}: SystemToolbarProps) {
  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] WORKSPACE_TOOLBAR_DISPLAY_MODE: forward showActionLabel, showKeystroke, tierClassName to Toolbar
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      showKeystroke={showKeystroke}
      showActionLabel={showActionLabel}
      leadingContent={leadingContent}
      actionsMeta={actionsMeta}
      className={["system-toolbar", tierClassName].filter(Boolean).join(" ")}
    />
  );
}
