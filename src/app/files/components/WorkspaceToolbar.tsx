// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// WorkspaceToolbar - toolbar for workspace-level actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarActionMeta, ToolbarConfig } from "@/lib/config.types";

export interface WorkspaceToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  showKeystroke?: boolean;
  leadingContent?: React.ReactNode;
  singleRow?: boolean;
  /** [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] toolbars.actions for toolbar-only actions (ACTIONS_META_PASS_THROUGH) */
  actionsMeta?: Record<string, ToolbarActionMeta>;
}

/**
 * WorkspaceToolbar - wrapper for workspace-level actions
 * Actions that affect all panes: layouts, refresh all, linked navigation
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function WorkspaceToolbar({
  config,
  onAction,
  activeActions,
  disabledActions,
  showKeystroke,
  leadingContent,
  singleRow,
  actionsMeta,
}: WorkspaceToolbarProps) {
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      showKeystroke={showKeystroke}
      leadingContent={leadingContent}
      singleRow={singleRow}
      actionsMeta={actionsMeta}
      className="workspace-toolbar"
    />
  );
}
