// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// Utility functions for toolbar button derivation and formatting

import type {
  KeybindingConfig,
  ToolbarActionMeta,
  ToolbarConfig,
  ToolbarsConfig,
} from "./config.types";

export interface DerivedButtonProps {
  action: string;
  icon: string;
  label: string;
  keystroke: string;
  description: string;
}

/** Session toolbar display mode in WorkspaceView. [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] TOOLBAR_DISPLAY_PROPS */
export type ToolbarDisplayMode = "compact" | "expanded" | "named";

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_DISPLAY_PROPS: Toolbar render props derived from display mode
export interface ToolbarDisplayProps {
  showKeystroke: boolean;
  showActionLabel: boolean;
  singleRow: boolean;
  mergedClassName?: string;
  tierClassName?: string;
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_DISPLAY_PROPS: how: map ToolbarDisplayMode to showKeystroke, showActionLabel, singleRow, and className props
export function toolbarDisplayProps(mode: ToolbarDisplayMode): ToolbarDisplayProps {
  switch (mode) {
    case "compact":
      return {
        showKeystroke: false,
        showActionLabel: false,
        singleRow: true,
        mergedClassName: "toolbar-compact",
      };
    case "expanded":
      return {
        showKeystroke: true,
        showActionLabel: false,
        singleRow: false,
      };
    case "named":
      return {
        showKeystroke: false,
        showActionLabel: true,
        singleRow: false,
        tierClassName: "toolbar-named",
      };
  }
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_DISPLAY_PROPS: how: cycle compact → expanded → named → compact
export function cycleToolbarDisplayMode(mode: ToolbarDisplayMode): ToolbarDisplayMode {
  if (mode === "compact") return "expanded";
  if (mode === "expanded") return "named";
  return "compact";
}

// [ARCH-TOOLBAR_ACTIONS] Action-to-icon mapping
const ACTION_ICON_MAP: Record<string, string> = {
  // File operations
  'file.copy': 'copy',
  'file.move': 'move',
  'file.copyAll': 'copy-all',
  'file.moveAll': 'move-all',
  'file.delete': 'trash',
  'file.rename': 'rename',
  
  // Navigation
  'navigate.up': 'arrow-up',
  'navigate.down': 'arrow-down',
  'navigate.enter': 'arrow-right',
  'navigate.parent': 'arrow-left',
  'navigate.home': 'home',
  'navigate.first': 'chevrons-up',
  'navigate.last': 'chevrons-down',
  'navigate.tab': 'arrow-right',
  
  // Marking
  'mark.toggle': 'checkbox',
  'mark.toggle-cursor': 'checkbox',
  'mark.all': 'checkbox-multiple',
  'mark.invert': 'checkbox-invert',
  'mark.clear': 'x-circle',
  
  // View & Sort
  'view.layout': 'layout-grid',
  'view.sort': 'sort',
  'view.columns': 'columns',
  'view.comparison': 'compare',
  'view.hidden': 'eye',
  'view.displaySpec': 'filter',
  'view.displaySpec.none': 'filter',
  'view.compareFilter.thresholds': 'sliders',
  'view.compareFilter.sharedAll': 'files',
  'view.compareFilter.missingSome': 'file-minus',
  'view.compareFilter.sizeLargestAll': 'maximize-2',
  'view.compareFilter.sizeLargestSome': 'trending-up',
  'view.compareFilter.sizeGtThreshold': 'chevrons-up',
  'view.compareFilter.sizeSmallestAll': 'minimize-2',
  'view.compareFilter.sizeSmallestSome': 'trending-down',
  'view.compareFilter.sizeLtThreshold': 'chevrons-down',
  'view.compareFilter.timeLatestAll': 'clock',
  'view.compareFilter.timeLatestSome': 'clock',
  'view.compareFilter.timeGtThreshold': 'calendar',
  'view.compareFilter.timeEarliestAll': 'history',
  'view.compareFilter.timeEarliestSome': 'history',
  'view.compareFilter.timeLtThreshold': 'calendar',
  'link.toggle': 'link',
  
  // Preview
  'preview.info': 'info',
  'preview.content': 'file-text',
  
  // System
  'help.show': 'help-circle',
  'command.palette': 'command',
  'search.finder': 'search',
  'search.content': 'file-search',
  
  // Pane management
  'pane.add': 'plus',
  'pane.remove': 'minus',
  'pane.swap': 'move',
  'pane.cycle': 'refresh-cw',
  'pane.order': 'bookmark-list',
  'pane.refresh': 'refresh-cw',
  'pane.refresh-all': 'refresh-ccw',

  // Mesh / workspace bridge
  'mesh.saveWorkspace': 'network',
  'mesh.diffWorkspace': 'git-compare',
  
  // Bookmarks
  'bookmark.goto': 'folder-open',
  'bookmark.add': 'bookmark-plus',
  'bookmark.list': 'bookmark',
  
  // History
  'history.back': 'undo',
  'history.forward': 'redo',
};

// [ICON_REGISTRY] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: icon names from config/files.yaml toolbars.actions — keep in sync with YAML
export const TOOLBAR_ACTIONS_ICON_NAMES: readonly string[] = [
  "columns",
  "filter",
  "git-compare",
  "sliders",
  "files",
  "file-minus",
  "maximize-2",
  "trending-up",
  "chevrons-up",
  "minimize-2",
  "trending-down",
  "chevrons-down",
  "clock",
  "calendar",
  "history",
] as const;

/**
 * [ICON_REGISTRY] All icon names referenced by ACTION_ICON_MAP and toolbars.actions.
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]
 */
export function getReferencedToolbarIconNames(): string[] {
  const fromMap = Object.values(ACTION_ICON_MAP);
  return [...new Set([...fromMap, ...TOOLBAR_ACTIONS_ICON_NAMES])].sort();
}

/**
 * [ICON_REGISTRY] Derive icon name from action; unmapped actions use icon-unknown (not help-circle).
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]
 */
export function deriveIconFromAction(action: string): string {
  return ACTION_ICON_MAP[action] || "icon-unknown";
}

/**
 * Extract concise label from keybinding description
 * [ARCH-TOOLBAR_ACTIONS]
 */
export function deriveLabelFromDescription(description: string): string {
  // Extract verb from description
  const patterns = [
    /^(Copy|Move|Delete|Rename|Navigate|Mark|Clear|Toggle|Show|Open|Search|Go|Add|Remove|Refresh|Sort|Compare|Preview|Enter|List|Invert)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const verb = match[1];
      // Special cases
      if (verb.toLowerCase() === 'toggle' && description.includes('mark')) return 'Mark';
      if (verb.toLowerCase() === 'toggle' && description.includes('linked')) return 'Link';
      if (verb.toLowerCase() === 'toggle' && description.includes('hidden')) return 'Hidden';
      if (verb.toLowerCase() === 'show' && description.includes('keyboard')) return 'Help';
      if (verb.toLowerCase() === 'open' && description.includes('command')) return 'Commands';
      if (verb.toLowerCase() === 'search' && description.includes('contents')) return 'Search';
      if (verb.toLowerCase() === 'search' || verb.toLowerCase() === 'find') return 'Find';
      return verb;
    }
  }

  // Fallback: capitalize first word
  const firstWord = description.split(' ')[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

/**
 * Format keybinding to human-readable keystroke display
 * [ARCH-TOOLBAR_ACTIONS]
 */
export function formatKeystroke(keybinding: KeybindingConfig): string {
  const parts: string[] = [];

  if (keybinding.modifiers?.ctrl) parts.push('Ctrl');
  if (keybinding.modifiers?.shift) parts.push('Shift');
  if (keybinding.modifiers?.alt) parts.push('Alt');
  if (keybinding.modifiers?.meta) parts.push('⌘');

  // Format key
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Backspace': '⌫',
    'Escape': 'Esc',
    'Tab': '⇥',
    'Home': 'Home',
    'End': 'End',
    '~': '~',
    '?': '?',
    '`': '`',
    '=': '=',
    '-': '-',
    '.': '.',
  };

  const key = keyMap[keybinding.key] || keybinding.key.toUpperCase();
  parts.push(key);

  return parts.join('+');
}

/**
 * Derive complete toolbar button props from action and keybinding registry
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
 * how: keybinding registry wins; else toolbars.actions metadata for toolbar-only actions (DERIVE_TOOLBAR_BUTTON_FALLBACK)
 */
export function deriveToolbarButton(
  action: string,
  registry: KeybindingConfig[],
  actionsMeta?: Record<string, ToolbarActionMeta>,
): DerivedButtonProps | null {
  const keybinding = registry.find((kb) => kb.action === action);

  if (keybinding) {
    return {
      action,
      icon: deriveIconFromAction(action),
      label: deriveLabelFromDescription(keybinding.description),
      keystroke: formatKeystroke(keybinding),
      description: keybinding.description,
    };
  }

  const meta = actionsMeta?.[action];
  if (meta) {
    return {
      action,
      icon: meta.icon ?? deriveIconFromAction(action),
      label: meta.label ?? deriveLabelFromDescription(meta.description),
      keystroke: "",
      description: meta.description,
    };
  }

  console.warn(`[REQ-TOOLBAR_SYSTEM] No keybinding or toolbars.actions entry for: ${action}`);
  return null;
}

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] MERGE_TOP_TOOLBARS: how: concat enabled top-position workspace, pane, system groups for compact single-row render
/**
 * Merge enabled top-position toolbar tiers for compact single-row display.
 * [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
 */
export function mergeTopToolbarConfigs(toolbars: ToolbarsConfig): ToolbarConfig | null {
  const tiers: ToolbarConfig[] = [
    toolbars.workspace,
    toolbars.pane,
    toolbars.system,
  ];

  const groups = tiers
    .filter((tier) => tier.enabled && tier.position === "top")
    .flatMap((tier) => tier.groups);

  if (groups.length === 0) {
    return null;
  }

  return {
    enabled: true,
    position: "top",
    groups,
  };
}
