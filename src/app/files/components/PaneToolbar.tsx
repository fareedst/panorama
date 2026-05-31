// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// PaneToolbar - toolbar for pane-specific actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarActionMeta, ToolbarConfig } from "@/lib/config.types";

export interface PaneToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  showKeystroke?: boolean;
  showActionLabel?: boolean;
  leadingContent?: React.ReactNode;
  tierClassName?: string;
  /** [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] toolbars.actions metadata for toolbar-only buttons (ACTIONS_META_PASS_THROUGH) */
  actionsMeta?: Record<string, ToolbarActionMeta>;
}

/**
 * PaneToolbar - wrapper for pane-specific actions
 * Actions on focused pane: file operations, navigation, marking
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function PaneToolbar({
  config,
  onAction,
  activeActions,
  disabledActions,
  showKeystroke,
  showActionLabel,
  leadingContent,
  tierClassName,
  actionsMeta,
}: PaneToolbarProps) {
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
      className={["pane-toolbar", tierClassName].filter(Boolean).join(" ")}
    />
  );
}
