// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// SystemToolbar - toolbar for system-wide actions

"use client";

import { Toolbar } from "./Toolbar";
import type { ToolbarConfig } from "@/lib/config.types";

export interface SystemToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  showKeystroke?: boolean;
  leadingContent?: React.ReactNode;
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
  leadingContent,
}: SystemToolbarProps) {
  return (
    <Toolbar
      config={config}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
      showKeystroke={showKeystroke}
      leadingContent={leadingContent}
      className="system-toolbar"
    />
  );
}
