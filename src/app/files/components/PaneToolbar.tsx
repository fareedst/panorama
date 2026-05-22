// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// PaneToolbar - toolbar for pane-specific actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarConfig } from "@/lib/config.types";

export interface PaneToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  showKeystroke?: boolean;
  leadingContent?: React.ReactNode;
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
  leadingContent,
}: PaneToolbarProps) {
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      showKeystroke={showKeystroke}
      leadingContent={leadingContent}
      className="pane-toolbar"
    />
  );
}
