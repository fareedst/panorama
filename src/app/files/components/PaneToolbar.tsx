// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
// PaneToolbar - toolbar for pane-specific actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarConfig } from "@/lib/config.types";

export interface PaneToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
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
}: PaneToolbarProps) {
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      className="pane-toolbar"
    />
  );
}
