// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]
// Utility functions for toolbar button derivation and formatting

import type { KeybindingConfig } from "./config.types";

export interface DerivedButtonProps {
  action: string;
  icon: string;
  label: string;
  keystroke: string;
  description: string;
}

// [ARCH-TOOLBAR_ACTIONS] Action-to-icon mapping
const ACTION_ICON_MAP: Record<string, string> = {
  // File operations
  'file.copy': 'copy',
  'file.move': 'move',
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
  'view.sort': 'sort',
  'view.comparison': 'compare',
  'view.hidden': 'eye',
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
  'pane.refresh': 'refresh-cw',
  'pane.refresh-all': 'refresh-ccw',
  
  // Bookmarks
  'bookmark.goto': 'folder-open',
  'bookmark.add': 'bookmark-plus',
  'bookmark.list': 'bookmark',
  
  // History
  'history.back': 'undo',
  'history.forward': 'redo',
};

/**
 * Derive icon name from action name
 * [ARCH-TOOLBAR_ACTIONS]
 */
export function deriveIconFromAction(action: string): string {
  return ACTION_ICON_MAP[action] || 'help-circle';
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
 * [ARCH-TOOLBAR_ACTIONS] [IMPL-TOOLBAR_COMPONENT]
 */
export function deriveToolbarButton(
  action: string,
  registry: KeybindingConfig[]
): DerivedButtonProps | null {
  const keybinding = registry.find(kb => kb.action === action);
  
  if (!keybinding) {
    console.warn(`[REQ-TOOLBAR_SYSTEM] No keybinding found for action: ${action}`);
    return null;
  }

  return {
    action,
    icon: deriveIconFromAction(action),
    label: deriveLabelFromDescription(keybinding.description),
    keystroke: formatKeystroke(keybinding),
    description: keybinding.description,
  };
}
