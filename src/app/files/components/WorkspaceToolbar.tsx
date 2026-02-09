// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
// WorkspaceToolbar - toolbar for workspace-level actions

"use client";

import { Toolbar, type ToolbarProps } from "./Toolbar";
import type { ToolbarConfig } from "@/lib/config.types";

export interface WorkspaceToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
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
}: WorkspaceToolbarProps) {
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      className="workspace-toolbar"
    />
  );
}
