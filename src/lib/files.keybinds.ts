// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Keyboard shortcut system - keybinding registry, parser, and matcher
// Client-safe module (no Node.js dependencies)

import type { KeybindingConfig } from "@/lib/config.types";

/**
 * Keybinding categories for organizing shortcuts in help overlay
 */
export type KeybindingCategory =
  | "navigation"
  | "file-operations"
  | "marking"
  | "view-sort"
  | "preview"
  | "advanced"
  | "pane-management"
  | "system";

/**
 * Keyboard modifiers (Ctrl, Shift, Alt, Cmd/Win)
 */
export interface KeyModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
}

/**
 * Keybinding definition
 */
export interface Keybinding {
  key: string; // e.g., "?", "p", "ArrowUp", "Enter", " " for Space
  modifiers?: KeyModifiers;
  action: string; // e.g., "help.show", "navigate.up"
  description: string; // Human-readable description
  category: KeybindingCategory;
}

/**
 * Keybinding registry with lookup maps
 */
export interface KeybindingRegistry {
  keybindings: Keybinding[];
  byAction: Map<string, Keybinding>;
  byCategory: Map<KeybindingCategory, Keybinding[]>;
}

// Module-level registry (singleton pattern)
let registry: KeybindingRegistry | null = null;

/**
 * Initialize keybinding registry with keybindings from config
 * Must be called before using other functions (typically from server component)
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function initializeKeybindingRegistry(keybindings: KeybindingConfig[]): void {
  registry = loadKeybindings(keybindings);
}

/**
 * Get keybinding registry (lazy initialization with empty registry if not initialized)
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getKeybindingRegistry(): KeybindingRegistry {
  if (!registry) {
    // Return empty registry if not initialized
    console.warn("[IMPL-KEYBINDS] Registry not initialized, returning empty registry");
    return {
      keybindings: [],
      byAction: new Map(),
      byCategory: new Map(),
    };
  }
  return registry;
}

/**
 * Load keybindings from configuration array
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
function loadKeybindings(keybindingsConfig: KeybindingConfig[]): KeybindingRegistry {
  console.info(`[IMPL-KEYBINDS] Loading ${keybindingsConfig.length} keybindings`);

  const keybindings: Keybinding[] = keybindingsConfig;

  // Validate keybindings
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenActions = new Set<string>();
  const seenKeys = new Map<string, number>();

  keybindings.forEach((kb, index) => {
    // Validate required fields
    if (!kb.key) {
      errors.push(`Keybinding ${index}: missing 'key' field`);
    }
    if (!kb.action) {
      errors.push(`Keybinding ${index}: missing 'action' field`);
    }
    if (!kb.description) {
      warnings.push(`Keybinding ${index}: missing 'description' field`);
    }
    if (!kb.category) {
      errors.push(`Keybinding ${index}: missing 'category' field`);
    }

    // Validate category value
    const validCategories: KeybindingCategory[] = [
      "navigation",
      "file-operations",
      "marking",
      "view-sort",
      "preview",
      "advanced",
      "pane-management",
      "system",
    ];
    if (kb.category && !validCategories.includes(kb.category)) {
      errors.push(
        `Keybinding ${index}: invalid category '${kb.category}'. Must be one of: ${validCategories.join(", ")}`
      );
    }

    // Detect duplicate actions
    if (kb.action && seenActions.has(kb.action)) {
      warnings.push(
        `Duplicate action '${kb.action}' in keybinding ${index} (last definition wins)`
      );
    }
    seenActions.add(kb.action);

    // Detect duplicate key combinations
    const keyCombo = formatKeyComboInternal(kb);
    const prevIndex = seenKeys.get(keyCombo);
    if (prevIndex !== undefined) {
      warnings.push(
        `Duplicate key combo '${keyCombo}' in keybinding ${index} (first seen at index ${prevIndex}, first match wins)`
      );
    }
    seenKeys.set(keyCombo, index);
  });

  // Log validation results
  if (errors.length > 0) {
    console.error(
      `[IMPL-KEYBINDS] Keybinding validation errors: ${errors.join("; ")}`
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `[IMPL-KEYBINDS] Keybinding validation warnings: ${warnings.join("; ")}`
    );
  }

  // Build lookup maps
  const byAction = new Map<string, Keybinding>();
  const byCategory = new Map<KeybindingCategory, Keybinding[]>();

  keybindings.forEach((kb) => {
    // By action (last definition wins for duplicates)
    if (kb.action) {
      byAction.set(kb.action, kb);
    }

    // By category
    if (kb.category) {
      const categoryList = byCategory.get(kb.category) || [];
      categoryList.push(kb);
      byCategory.set(kb.category, categoryList);
    }
  });

  console.info(
    `[IMPL-KEYBINDS] Loaded ${keybindings.length} keybindings across ${byCategory.size} categories`
  );

  return { keybindings, byAction, byCategory };
}

/**
 * Match keyboard event to action name
 * Returns action name if event matches a keybinding, null otherwise
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function matchKeybinding(event: KeyboardEvent): string | null {
  const registry = getKeybindingRegistry();

  // Iterate through keybindings (first match wins)
  for (const kb of registry.keybindings) {
    if (matchesKeybinding(event, kb)) {
      return kb.action;
    }
  }

  return null;
}

/**
 * Check if keyboard event matches a keybinding
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
function matchesKeybinding(
  event: KeyboardEvent,
  binding: Keybinding
): boolean {
  // Match key
  if (event.key.length === 1) {
    // Single character: case-insensitive match
    if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
      return false;
    }
  } else {
    // Special key (ArrowUp, Enter, etc.): case-sensitive match
    if (event.key !== binding.key) {
      return false;
    }
  }

  // Match modifiers (all must match exactly)
  const mods = binding.modifiers || {};

  // Ctrl: must match
  if (mods.ctrl && !event.ctrlKey) return false;
  if (!mods.ctrl && event.ctrlKey) return false;

  // Shift: must match
  if (mods.shift && !event.shiftKey) return false;
  if (!mods.shift && event.shiftKey) return false;

  // Alt: must match
  if (mods.alt && !event.altKey) return false;
  if (!mods.alt && event.altKey) return false;

  // Meta (Cmd/Win): must match
  if (mods.meta && !event.metaKey) return false;
  if (!mods.meta && event.metaKey) return false;

  return true;
}

/**
 * Get keybinding by action name
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getKeybindingByAction(
  action: string
): Keybinding | undefined {
  const registry = getKeybindingRegistry();
  return registry.byAction.get(action);
}

/**
 * Get all keybindings for a category
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getKeybindingsByCategory(
  category: KeybindingCategory
): Keybinding[] {
  const registry = getKeybindingRegistry();
  return registry.byCategory.get(category) || [];
}

/**
 * Get all keybindings (all categories)
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getAllKeybindings(): Keybinding[] {
  const registry = getKeybindingRegistry();
  return registry.keybindings;
}

/**
 * Get all categories
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getAllCategories(): KeybindingCategory[] {
  const registry = getKeybindingRegistry();
  return Array.from(registry.byCategory.keys());
}

/**
 * Format keybinding as human-readable key combination string
 * Examples: "Ctrl+P", "Shift+M", "?", "↑"
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function formatKeyCombo(keybinding: Keybinding): string {
  return formatKeyComboInternal(keybinding);
}

/**
 * Internal key combo formatter (used by validation too)
 */
function formatKeyComboInternal(keybinding: Keybinding): string {
  const parts: string[] = [];
  const mods = keybinding.modifiers || {};

  // Add modifiers in standard order
  if (mods.ctrl) parts.push("Ctrl");
  if (mods.alt) parts.push("Alt");
  if (mods.shift) parts.push("Shift");
  if (mods.meta) parts.push("Cmd");

  // Format key name
  let key = keybinding.key;

  // Special key names
  if (key === " ") key = "Space";
  else if (key === "ArrowUp") key = "↑";
  else if (key === "ArrowDown") key = "↓";
  else if (key === "ArrowLeft") key = "←";
  else if (key === "ArrowRight") key = "→";
  else if (key === "Enter") key = "↵";
  else if (key === "Escape") key = "Esc";
  else if (key === "Backspace") key = "⌫";
  else if (key === "Tab") key = "⇥";

  parts.push(key);

  return parts.join("+");
}

/**
 * Get human-readable category label
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function getCategoryLabel(category: KeybindingCategory): string {
  const labels: Record<KeybindingCategory, string> = {
    navigation: "Navigation",
    "file-operations": "File Operations",
    marking: "File Marking",
    "view-sort": "View & Sort",
    preview: "Preview",
    advanced: "Advanced",
    "pane-management": "Pane Management",
    system: "System",
  };
  return labels[category] || category;
}

/**
 * Reset registry (for testing)
 */
export function resetKeybindingRegistry(): void {
  registry = null;
}
