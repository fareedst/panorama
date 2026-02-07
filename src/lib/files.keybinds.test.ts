// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Unit tests for keyboard shortcut system

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initializeKeybindingRegistry,
  getKeybindingRegistry,
  matchKeybinding,
  getKeybindingByAction,
  getKeybindingsByCategory,
  getAllKeybindings,
  getAllCategories,
  formatKeyCombo,
  getCategoryLabel,
  resetKeybindingRegistry,
  type Keybinding,
  type KeybindingCategory,
} from "./files.keybinds";

// Mock config module
vi.mock("@/lib/config", () => ({
  getFilesConfig: vi.fn(() => ({
    keybindings: [
      {
        key: "?",
        action: "help.show",
        description: "Show keyboard shortcuts",
        category: "system",
      },
      {
        key: "p",
        modifiers: { ctrl: true },
        action: "command.palette",
        description: "Open command palette",
        category: "system",
      },
      {
        key: "ArrowUp",
        action: "navigate.up",
        description: "Move cursor up",
        category: "navigation",
      },
      {
        key: "m",
        modifiers: { shift: true },
        action: "mark.all",
        description: "Mark all files",
        category: "marking",
      },
      {
        key: "c",
        action: "file.copy",
        description: "Copy files",
        category: "file-operations",
      },
    ],
  })),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Default test keybindings
const defaultTestKeybindings = [
  {
    key: "?",
    action: "help.show",
    description: "Show keyboard shortcuts",
    category: "system" as const,
  },
  {
    key: "p",
    modifiers: { ctrl: true },
    action: "command.palette",
    description: "Open command palette",
    category: "system" as const,
  },
  {
    key: "ArrowUp",
    action: "navigate.up",
    description: "Move cursor up",
    category: "navigation" as const,
  },
  {
    key: "m",
    modifiers: { shift: true },
    action: "mark.all",
    description: "Mark all files",
    category: "marking" as const,
  },
  {
    key: "c",
    action: "file.copy",
    description: "Copy files",
    category: "file-operations" as const,
  },
];

describe("files.keybinds", () => {
  beforeEach(() => {
    // Reset and initialize registry with test keybindings before each test
    resetKeybindingRegistry();
    initializeKeybindingRegistry(defaultTestKeybindings);
  });

  describe("getKeybindingRegistry", () => {
    it("should load keybindings from config", () => {
      const registry = getKeybindingRegistry();
      expect(registry.keybindings).toHaveLength(5);
    });

    it("should build byAction map", () => {
      const registry = getKeybindingRegistry();
      expect(registry.byAction.size).toBe(5);
      expect(registry.byAction.get("help.show")).toBeDefined();
      expect(registry.byAction.get("command.palette")).toBeDefined();
    });

    it("should build byCategory map", () => {
      const registry = getKeybindingRegistry();
      expect(registry.byCategory.size).toBe(4); // system, navigation, marking, file-operations
      expect(registry.byCategory.get("system")).toHaveLength(2);
      expect(registry.byCategory.get("navigation")).toHaveLength(1);
    });

    it("should return singleton (same instance on multiple calls)", () => {
      const registry1 = getKeybindingRegistry();
      const registry2 = getKeybindingRegistry();
      expect(registry1).toBe(registry2);
    });
  });

  describe("matchKeybinding", () => {
    it("should match single character key (case insensitive)", () => {
      const event = new KeyboardEvent("keydown", { key: "?" });
      const action = matchKeybinding(event);
      expect(action).toBe("help.show");
    });

    it("should match single character key with uppercase", () => {
      const event = new KeyboardEvent("keydown", { key: "C" });
      const action = matchKeybinding(event);
      expect(action).toBe("file.copy");
    });

    it("should match special key (case sensitive)", () => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      const action = matchKeybinding(event);
      expect(action).toBe("navigate.up");
    });

    it("should match key with Ctrl modifier", () => {
      const event = new KeyboardEvent("keydown", {
        key: "p",
        ctrlKey: true,
      });
      const action = matchKeybinding(event);
      expect(action).toBe("command.palette");
    });

    it("should match key with Shift modifier", () => {
      const event = new KeyboardEvent("keydown", {
        key: "m",
        shiftKey: true,
      });
      const action = matchKeybinding(event);
      expect(action).toBe("mark.all");
    });

    it("should NOT match when required modifier is missing", () => {
      const event = new KeyboardEvent("keydown", { key: "p" }); // No Ctrl
      const action = matchKeybinding(event);
      expect(action).toBeNull();
    });

    it("should NOT match when extra modifier is present", () => {
      const event = new KeyboardEvent("keydown", {
        key: "?",
        ctrlKey: true, // Extra modifier
      });
      const action = matchKeybinding(event);
      expect(action).toBeNull();
    });

    it("should return null for unmatched key", () => {
      const event = new KeyboardEvent("keydown", { key: "x" });
      const action = matchKeybinding(event);
      expect(action).toBeNull();
    });
  });

  describe("getKeybindingByAction", () => {
    it("should return keybinding for valid action", () => {
      const kb = getKeybindingByAction("help.show");
      expect(kb).toBeDefined();
      expect(kb?.key).toBe("?");
      expect(kb?.action).toBe("help.show");
    });

    it("should return undefined for invalid action", () => {
      const kb = getKeybindingByAction("invalid.action");
      expect(kb).toBeUndefined();
    });
  });

  describe("getKeybindingsByCategory", () => {
    it("should return all keybindings for system category", () => {
      const keybindings = getKeybindingsByCategory("system");
      expect(keybindings).toHaveLength(2);
      expect(keybindings.every((kb) => kb.category === "system")).toBe(true);
    });

    it("should return all keybindings for navigation category", () => {
      const keybindings = getKeybindingsByCategory("navigation");
      expect(keybindings).toHaveLength(1);
      expect(keybindings[0].action).toBe("navigate.up");
    });

    it("should return empty array for unused category", () => {
      const keybindings = getKeybindingsByCategory("preview");
      expect(keybindings).toHaveLength(0);
    });
  });

  describe("getAllKeybindings", () => {
    it("should return all keybindings", () => {
      const keybindings = getAllKeybindings();
      expect(keybindings).toHaveLength(5);
    });
  });

  describe("getAllCategories", () => {
    it("should return all unique categories", () => {
      const categories = getAllCategories();
      expect(categories).toHaveLength(4);
      expect(categories).toContain("system");
      expect(categories).toContain("navigation");
      expect(categories).toContain("marking");
      expect(categories).toContain("file-operations");
    });
  });

  describe("formatKeyCombo", () => {
    it("should format simple key", () => {
      const kb: Keybinding = {
        key: "?",
        action: "help.show",
        description: "Show help",
        category: "system",
      };
      expect(formatKeyCombo(kb)).toBe("?");
    });

    it("should format key with Ctrl modifier", () => {
      const kb: Keybinding = {
        key: "p",
        modifiers: { ctrl: true },
        action: "command.palette",
        description: "Command palette",
        category: "system",
      };
      expect(formatKeyCombo(kb)).toBe("Ctrl+p");
    });

    it("should format key with multiple modifiers", () => {
      const kb: Keybinding = {
        key: "s",
        modifiers: { ctrl: true, shift: true },
        action: "save.all",
        description: "Save all",
        category: "system",
      };
      expect(formatKeyCombo(kb)).toBe("Ctrl+Shift+s");
    });

    it("should format Space key", () => {
      const kb: Keybinding = {
        key: " ",
        action: "mark.toggle",
        description: "Toggle mark",
        category: "marking",
      };
      expect(formatKeyCombo(kb)).toBe("Space");
    });

    it("should format arrow keys with Unicode", () => {
      expect(
        formatKeyCombo({
          key: "ArrowUp",
          action: "navigate.up",
          description: "Up",
          category: "navigation",
        })
      ).toBe("↑");

      expect(
        formatKeyCombo({
          key: "ArrowDown",
          action: "navigate.down",
          description: "Down",
          category: "navigation",
        })
      ).toBe("↓");

      expect(
        formatKeyCombo({
          key: "ArrowLeft",
          action: "navigate.left",
          description: "Left",
          category: "navigation",
        })
      ).toBe("←");

      expect(
        formatKeyCombo({
          key: "ArrowRight",
          action: "navigate.right",
          description: "Right",
          category: "navigation",
        })
      ).toBe("→");
    });

    it("should format Enter key with Unicode", () => {
      const kb: Keybinding = {
        key: "Enter",
        action: "navigate.enter",
        description: "Enter",
        category: "navigation",
      };
      expect(formatKeyCombo(kb)).toBe("↵");
    });

    it("should format Escape key", () => {
      const kb: Keybinding = {
        key: "Escape",
        action: "mark.clear",
        description: "Clear marks",
        category: "marking",
      };
      expect(formatKeyCombo(kb)).toBe("Esc");
    });

    it("should format Backspace key with Unicode", () => {
      const kb: Keybinding = {
        key: "Backspace",
        action: "navigate.parent",
        description: "Parent",
        category: "navigation",
      };
      expect(formatKeyCombo(kb)).toBe("⌫");
    });

    it("should format Tab key with Unicode", () => {
      const kb: Keybinding = {
        key: "Tab",
        action: "navigate.tab",
        description: "Next pane",
        category: "navigation",
      };
      expect(formatKeyCombo(kb)).toBe("⇥");
    });
  });

  describe("getCategoryLabel", () => {
    it("should return label for navigation", () => {
      expect(getCategoryLabel("navigation")).toBe("Navigation");
    });

    it("should return label for file-operations", () => {
      expect(getCategoryLabel("file-operations")).toBe("File Operations");
    });

    it("should return label for marking", () => {
      expect(getCategoryLabel("marking")).toBe("File Marking");
    });

    it("should return label for view-sort", () => {
      expect(getCategoryLabel("view-sort")).toBe("View & Sort");
    });

    it("should return label for preview", () => {
      expect(getCategoryLabel("preview")).toBe("Preview");
    });

    it("should return label for advanced", () => {
      expect(getCategoryLabel("advanced")).toBe("Advanced");
    });

    it("should return label for system", () => {
      expect(getCategoryLabel("system")).toBe("System");
    });
  });

  describe("modifier key combinations", () => {
    // Note: These tests use the default mock config which doesn't include
    // these specific keybindings, so they test null returns for unmapped combos
    
    it("should NOT match Alt+ArrowLeft without configured keybinding", () => {
      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        altKey: true,
      });
      const action = matchKeybinding(event);
      expect(action).toBeNull(); // Not in default config
    });

    it("should NOT match Meta+k without configured keybinding", () => {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
      });
      const action = matchKeybinding(event);
      expect(action).toBeNull(); // Not in default config
    });

    it("should NOT match Ctrl+Shift+f without configured keybinding", () => {
      const event = new KeyboardEvent("keydown", {
        key: "f",
        ctrlKey: true,
        shiftKey: true,
      });
      const action = matchKeybinding(event);
      expect(action).toBeNull(); // Not in default config
    });
  });

  describe("error handling", () => {
    it("should handle keybindings without modifiers field (c key has no modifiers)", () => {
      const event = new KeyboardEvent("keydown", { key: "c" });
      const action = matchKeybinding(event);
      expect(action).toBe("file.copy"); // Has keybinding without modifiers
    });

    it("should handle unmapped keys gracefully", () => {
      const event = new KeyboardEvent("keydown", { key: "x" });
      const action = matchKeybinding(event);
      expect(action).toBeNull(); // Not mapped in config
    });
  });
});

// Test validates [REQ-KEYBOARD_SHORTCUTS_COMPLETE] keybinding system requirements
describe("REQ_KEYBOARD_SHORTCUTS_COMPLETE", () => {
  beforeEach(() => {
    resetKeybindingRegistry();
    initializeKeybindingRegistry(defaultTestKeybindings);
  });

  it("should support all defined categories", () => {
    const validCategories: KeybindingCategory[] = [
      "navigation",
      "file-operations",
      "marking",
      "view-sort",
      "preview",
      "advanced",
      "system",
    ];

    validCategories.forEach((category) => {
      // Should not throw
      expect(() => getKeybindingsByCategory(category)).not.toThrow();
    });
  });

  it("should provide human-readable labels for all categories", () => {
    const categories: KeybindingCategory[] = [
      "navigation",
      "file-operations",
      "marking",
      "view-sort",
      "preview",
      "advanced",
      "system",
    ];

    categories.forEach((category) => {
      const label = getCategoryLabel(category);
      expect(label).toBeTruthy();
      expect(label).not.toBe(category); // Should be formatted, not raw
    });
  });

  it("should format keybindings with proper modifier order", () => {
    const kb: Keybinding = {
      key: "s",
      modifiers: {
        meta: true,
        shift: true,
        alt: true,
        ctrl: true,
      },
      action: "test.action",
      description: "Test",
      category: "system",
    };

    const formatted = formatKeyCombo(kb);
    // Should be in order: Ctrl+Alt+Shift+Cmd
    expect(formatted).toBe("Ctrl+Alt+Shift+Cmd+s");
  });
});
