# IMPL-KEYBINDS: Keyboard Shortcut System Implementation

**Status**: In Progress  
**Created**: 2026-02-07  
**Architecture**: `[ARCH-KEYBIND_SYSTEM]`  
**Requirement**: `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`

---

## Implementation Overview

Implement a configuration-driven keyboard shortcut system with:
1. **Keybinding Registry** (`src/lib/files.keybinds.ts`) - Load, parse, match keybindings
2. **Help Overlay** (`src/app/files/components/HelpOverlay.tsx`) - Display shortcuts by category
3. **Command Palette** (`src/app/files/components/CommandPalette.tsx`) - Search and execute actions
4. **Refactored WorkspaceView** - Use registry instead of hardcoded switch statement

---

## File Structure

### New Files

```
src/lib/files.keybinds.ts              # Keybinding registry module (300 lines)
src/app/files/components/
  HelpOverlay.tsx                       # Help overlay component (250 lines)
  CommandPalette.tsx                    # Command palette component (350 lines)
src/lib/files.keybinds.test.ts         # Keybinding tests (400 lines)
```

### Modified Files

```
src/app/files/WorkspaceView.tsx        # Refactor keyboard handler (~100 lines changed)
config/files.yaml                       # Add keybindings section (~200 lines)
src/lib/config.types.ts                 # Add keybinding types (~50 lines)
```

---

## Module 1: Keybinding Registry (`files.keybinds.ts`)

### Types

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Keybinding type definitions

export type KeybindingCategory =
  | "navigation"
  | "file-operations"
  | "marking"
  | "view-sort"
  | "preview"
  | "advanced"
  | "system";

export interface KeyModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface Keybinding {
  key: string;              // e.g., "?", "p", "ArrowUp", "Enter"
  modifiers?: KeyModifiers;
  action: string;           // e.g., "help.show", "navigate.up"
  description: string;      // Human-readable description
  category: KeybindingCategory;
}

export interface KeybindingRegistry {
  keybindings: Keybinding[];
  byAction: Map<string, Keybinding>;
  byCategory: Map<KeybindingCategory, Keybinding[]>;
}
```

### Load Keybindings

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Load keybindings from configuration

import { getFilesConfig } from "@/lib/config";
import { logger } from "@/lib/logger";

let registry: KeybindingRegistry | null = null;

export function getKeybindingRegistry(): KeybindingRegistry {
  if (!registry) {
    registry = loadKeybindings();
  }
  return registry;
}

function loadKeybindings(): KeybindingRegistry {
  const config = getFilesConfig();
  const keybindings: Keybinding[] = config.keybindings || [];
  
  // Validate keybindings
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenActions = new Set<string>();
  const seenKeys = new Set<string>();
  
  keybindings.forEach((kb, index) => {
    // Validate required fields
    if (!kb.key) {
      errors.push(`Keybinding ${index}: missing 'key'`);
    }
    if (!kb.action) {
      errors.push(`Keybinding ${index}: missing 'action'`);
    }
    if (!kb.description) {
      warnings.push(`Keybinding ${index}: missing 'description'`);
    }
    if (!kb.category) {
      errors.push(`Keybinding ${index}: missing 'category'`);
    }
    
    // Detect duplicate actions
    if (seenActions.has(kb.action)) {
      warnings.push(`Duplicate action '${kb.action}' in keybinding ${index}`);
    }
    seenActions.add(kb.action);
    
    // Detect duplicate key combinations
    const keyCombo = formatKeyCombo(kb);
    if (seenKeys.has(keyCombo)) {
      warnings.push(`Duplicate key combo '${keyCombo}' in keybinding ${index}`);
    }
    seenKeys.add(keyCombo);
  });
  
  // Log validation results
  if (errors.length > 0) {
    logger.error(
      ["IMPL-KEYBINDS", "REQ-KEYBOARD_SHORTCUTS_COMPLETE"],
      `Keybinding validation errors: ${errors.join("; ")}`,
      { errors }
    );
  }
  
  if (warnings.length > 0) {
    logger.warn(
      ["IMPL-KEYBINDS", "REQ-KEYBOARD_SHORTCUTS_COMPLETE"],
      `Keybinding validation warnings: ${warnings.join("; ")}`,
      { warnings }
    );
  }
  
  // Build maps
  const byAction = new Map<string, Keybinding>();
  const byCategory = new Map<KeybindingCategory, Keybinding[]>();
  
  keybindings.forEach((kb) => {
    // By action
    byAction.set(kb.action, kb);
    
    // By category
    const categoryList = byCategory.get(kb.category) || [];
    categoryList.push(kb);
    byCategory.set(kb.category, categoryList);
  });
  
  logger.info(
    ["IMPL-KEYBINDS", "REQ-KEYBOARD_SHORTCUTS_COMPLETE"],
    `Loaded ${keybindings.length} keybindings (${byCategory.size} categories)`,
    { count: keybindings.length, categories: Array.from(byCategory.keys()) }
  );
  
  return { keybindings, byAction, byCategory };
}
```

### Match Keybinding

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Match keyboard event to action name

export function matchKeybinding(event: KeyboardEvent): string | null {
  const registry = getKeybindingRegistry();
  
  for (const kb of registry.keybindings) {
    if (matchesKeybinding(event, kb)) {
      return kb.action;
    }
  }
  
  return null;
}

function matchesKeybinding(event: KeyboardEvent, binding: Keybinding): boolean {
  // Match key (case-sensitive for special keys, case-insensitive for letters)
  if (event.key.length === 1) {
    // Single character: case-insensitive
    if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
      return false;
    }
  } else {
    // Special key (ArrowUp, Enter, etc.): case-sensitive
    if (event.key !== binding.key) {
      return false;
    }
  }
  
  // Match modifiers
  const mods = binding.modifiers || {};
  
  // Ctrl
  if (mods.ctrl && !event.ctrlKey) return false;
  if (!mods.ctrl && event.ctrlKey) return false;
  
  // Shift
  if (mods.shift && !event.shiftKey) return false;
  if (!mods.shift && event.shiftKey) return false;
  
  // Alt
  if (mods.alt && !event.altKey) return false;
  if (!mods.alt && event.altKey) return false;
  
  // Meta (Cmd/Win)
  if (mods.meta && !event.metaKey) return false;
  if (!mods.meta && event.metaKey) return false;
  
  return true;
}
```

### Lookup Functions

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Keybinding lookup functions

export function getKeybindingByAction(action: string): Keybinding | undefined {
  const registry = getKeybindingRegistry();
  return registry.byAction.get(action);
}

export function getKeybindingsByCategory(category: KeybindingCategory): Keybinding[] {
  const registry = getKeybindingRegistry();
  return registry.byCategory.get(category) || [];
}

export function getAllKeybindings(): Keybinding[] {
  const registry = getKeybindingRegistry();
  return registry.keybindings;
}

export function getAllCategories(): KeybindingCategory[] {
  const registry = getKeybindingRegistry();
  return Array.from(registry.byCategory.keys());
}
```

### Formatting Utilities

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Format keybindings for display

export function formatKeyCombo(keybinding: Keybinding): string {
  const parts: string[] = [];
  const mods = keybinding.modifiers || {};
  
  if (mods.ctrl) parts.push("Ctrl");
  if (mods.alt) parts.push("Alt");
  if (mods.shift) parts.push("Shift");
  if (mods.meta) parts.push("Cmd");
  
  // Format key
  let key = keybinding.key;
  if (key === " ") key = "Space";
  if (key === "ArrowUp") key = "↑";
  if (key === "ArrowDown") key = "↓";
  if (key === "ArrowLeft") key = "←";
  if (key === "ArrowRight") key = "→";
  
  parts.push(key);
  
  return parts.join("+");
}

export function getCategoryLabel(category: KeybindingCategory): string {
  const labels: Record<KeybindingCategory, string> = {
    navigation: "Navigation",
    "file-operations": "File Operations",
    marking: "File Marking",
    "view-sort": "View & Sort",
    preview: "Preview",
    advanced: "Advanced",
    system: "System",
  };
  return labels[category] || category;
}
```

---

## Module 2: Help Overlay Component

### Component Structure

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Help overlay component showing all keyboard shortcuts

"use client";

import { useEffect } from "react";
import {
  getAllCategories,
  getKeybindingsByCategory,
  getCategoryLabel,
  formatKeyCombo,
  type KeybindingCategory,
} from "@/lib/files.keybinds";

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const categories = getAllCategories();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map((category) => (
              <CategorySection key={category} category={category} />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
          Press <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">?</kbd> or{" "}
          <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: KeybindingCategory }) {
  const keybindings = getKeybindingsByCategory(category);
  
  if (keybindings.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {getCategoryLabel(category)}
      </h3>
      <div className="space-y-1">
        {keybindings.map((kb) => (
          <div key={kb.action} className="flex items-start justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
              {kb.description}
            </span>
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              {formatKeyCombo(kb)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Module 3: Command Palette Component

### Component Structure

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Command palette for searching and executing actions

"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAllKeybindings,
  formatKeyCombo,
  getCategoryLabel,
  type Keybinding,
} from "@/lib/files.keybinds";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (action: string) => void;
}

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const allKeybindings = getAllKeybindings();
  
  // Filter keybindings by query
  const filteredKeybindings = allKeybindings.filter((kb) => {
    const searchText = `${kb.description} ${kb.action}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
  
  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredKeybindings.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredKeybindings[selectedIndex];
        if (selected) {
          onExecute(selected.action);
          onClose();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredKeybindings, selectedIndex, onExecute, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Search Input */}
        <div className="border-b border-zinc-200 dark:border-zinc-700 p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {filteredKeybindings.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              No actions found
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filteredKeybindings.map((kb, index) => (
                <ResultItem
                  key={kb.action}
                  keybinding={kb}
                  isSelected={index === selectedIndex}
                  onClick={() => {
                    onExecute(kb.action);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">
          Use ↑↓ to navigate, ↵ to execute, Esc to close
        </div>
      </div>
    </div>
  );
}

function ResultItem({
  keybinding,
  isSelected,
  onClick,
}: {
  keybinding: Keybinding;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {keybinding.description}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {getCategoryLabel(keybinding.category)} · {keybinding.action}
          </div>
        </div>
        <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100">
          {formatKeyCombo(keybinding)}
        </kbd>
      </div>
    </div>
  );
}
```

---

## Module 4: Refactored WorkspaceView

### Action Handlers Map

```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Refactored keyboard handling using keybinding registry

// In WorkspaceView.tsx

// State for help and command palette
const [showHelp, setShowHelp] = useState(false);
const [showCommandPalette, setShowCommandPalette] = useState(false);

// Register action handlers
const actionHandlers = useMemo(() => {
  const handlers = new Map<string, () => void>();
  
  // Navigation
  handlers.set("navigate.up", () => {
    if (pane.cursor > 0) {
      handleCursorMove(focusIndex, pane.cursor - 1);
    }
  });
  
  handlers.set("navigate.down", () => {
    if (pane.cursor < pane.files.length - 1) {
      handleCursorMove(focusIndex, pane.cursor + 1);
    }
  });
  
  handlers.set("navigate.enter", () => {
    const file = pane.files[pane.cursor];
    if (file && file.isDirectory) {
      handleNavigate(focusIndex, file.path);
    }
  });
  
  handlers.set("navigate.parent", () => {
    handleParentNavigation(); // Existing function
  });
  
  handlers.set("navigate.tab", () => {
    setFocusIndex((prev) => (prev + 1) % panes.length);
  });
  
  // ... all other actions
  
  // System
  handlers.set("help.show", () => {
    setShowHelp((prev) => !prev);
  });
  
  handlers.set("command.palette", () => {
    setShowCommandPalette((prev) => !prev);
  });
  
  return handlers;
}, [panes, focusIndex, /* other dependencies */]);

// Keyboard handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Match keybinding
    const action = matchKeybinding(e);
    if (action) {
      const handler = actionHandlers.get(action);
      if (handler) {
        e.preventDefault();
        handler();
      } else {
        logger.warn(
          ["IMPL-KEYBINDS", "REQ-KEYBOARD_SHORTCUTS_COMPLETE"],
          `No handler registered for action: ${action}`
        );
      }
    }
  };
  
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [actionHandlers]);

// Execute action from command palette
const handleExecuteAction = (action: string) => {
  const handler = actionHandlers.get(action);
  if (handler) {
    handler();
  }
};

// Render help and command palette
return (
  <div>
    {/* ... existing UI ... */}
    
    <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    
    <CommandPalette
      isOpen={showCommandPalette}
      onClose={() => setShowCommandPalette(false)}
      onExecute={handleExecuteAction}
    />
  </div>
);
```

---

## Configuration

### Keybindings Section in `config/files.yaml`

```yaml
# [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
# Keyboard shortcut configuration

keybindings:
  # System
  - key: "?"
    action: "help.show"
    description: "Show keyboard shortcuts"
    category: "system"
  
  - key: "p"
    modifiers:
      ctrl: true
    action: "command.palette"
    description: "Open command palette"
    category: "system"
  
  # Navigation
  - key: "ArrowUp"
    action: "navigate.up"
    description: "Move cursor up"
    category: "navigation"
  
  - key: "ArrowDown"
    action: "navigate.down"
    description: "Move cursor down"
    category: "navigation"
  
  - key: "Enter"
    action: "navigate.enter"
    description: "Enter directory or open file"
    category: "navigation"
  
  - key: "Backspace"
    action: "navigate.parent"
    description: "Go to parent directory"
    category: "navigation"
  
  - key: "Tab"
    action: "navigate.tab"
    description: "Switch pane focus"
    category: "navigation"
  
  # File Operations
  - key: "c"
    action: "file.copy"
    description: "Copy marked files (or current file)"
    category: "file-operations"
  
  - key: "v"
    action: "file.move"
    description: "Move marked files (or current file)"
    category: "file-operations"
  
  - key: "d"
    action: "file.delete"
    description: "Delete marked files (or current file)"
    category: "file-operations"
  
  # Marking
  - key: " "
    action: "mark.toggle"
    description: "Toggle mark on current file"
    category: "marking"
  
  - key: "m"
    modifiers:
      shift: true
    action: "mark.all"
    description: "Mark all files"
    category: "marking"
  
  - key: "m"
    modifiers:
      ctrl: true
    action: "mark.invert"
    description: "Invert marks"
    category: "marking"
  
  - key: "Escape"
    action: "mark.clear"
    description: "Clear all marks"
    category: "marking"
  
  # View & Sort
  - key: "s"
    action: "view.sort"
    description: "Open sort menu"
    category: "view-sort"
  
  - key: "`"
    action: "view.comparison"
    description: "Toggle comparison mode"
    category: "view-sort"
  
  # Preview
  - key: "i"
    action: "preview.info"
    description: "Show file info panel"
    category: "preview"
  
  - key: "q"
    action: "preview.content"
    description: "Show file preview"
    category: "preview"
  
  # Advanced
  - key: "g"
    action: "bookmark.goto"
    description: "Goto directory (path entry)"
    category: "advanced"
  
  - key: "b"
    action: "bookmark.add"
    description: "Add bookmark for current directory"
    category: "advanced"
  
  - key: "b"
    modifiers:
      ctrl: true
    action: "bookmark.list"
    description: "List bookmarks"
    category: "advanced"
  
  - key: "~"
    action: "navigate.home"
    description: "Go to home directory"
    category: "advanced"
  
  - key: "ArrowLeft"
    modifiers:
      alt: true
    action: "history.back"
    description: "Navigate back in history"
    category: "advanced"
  
  - key: "ArrowRight"
    modifiers:
      alt: true
    action: "history.forward"
    description: "Navigate forward in history"
    category: "advanced"
```

---

## Testing Strategy

### Unit Tests (`files.keybinds.test.ts`)

**Tests** (20+ tests):
1. Load keybindings from config
2. Match keyboard event to action
3. Handle Ctrl modifier
4. Handle Shift modifier
5. Handle Alt modifier
6. Handle Meta modifier
7. Handle multiple modifiers
8. Case-insensitive letter matching
9. Case-sensitive special key matching
10. Detect duplicate actions
11. Detect duplicate key combos
12. Validate keybinding format
13. Get keybinding by action
14. Get keybindings by category
15. Get all keybindings
16. Get all categories
17. Format key combo
18. Get category label
19. Handle invalid keybindings
20. Handle missing fields

### Integration Tests (WorkspaceView.test.tsx)

**Tests** (15+ tests):
1. Press shortcut → action executes
2. Help overlay opens on ? key
3. Command palette opens on Ctrl+P
4. All navigation shortcuts work
5. All file operation shortcuts work
6. All marking shortcuts work
7. All view shortcuts work
8. All preview shortcuts work
9. All advanced shortcuts work
10. Action handler registered for all keybindings
11. Invalid action logs warning
12. Keyboard events in input fields ignored
13. Event.preventDefault() called for matched keys
14. Command palette executes action
15. Help overlay closes on Escape

### UI Tests (HelpOverlay.test.tsx, CommandPalette.test.tsx)

**Tests** (10+ tests):
1. Help overlay renders all categories
2. Help overlay renders all shortcuts
3. Help overlay formats key combos correctly
4. Help overlay closes on Escape
5. Help overlay closes on ? key
6. Command palette renders all keybindings
7. Command palette filters by query
8. Command palette navigates with arrows
9. Command palette executes on Enter
10. Command palette closes on Escape

---

## Performance Considerations

### Registry Loading

- **Once**: Registry loaded once on first use
- **Cached**: Registry cached in module-level variable
- **Fast**: Map-based lookups are O(1)

### Event Matching

- **Linear Search**: Iterates through all keybindings (25+)
- **Optimized**: Early return on first match
- **Fast**: < 1ms per keypress (25 comparisons)

### Component Rendering

- **Help Overlay**: Renders once when opened (not on every keystroke)
- **Command Palette**: Re-filters on input change (debounce if needed)
- **No Re-renders**: Keyboard handler doesn't cause component re-renders

---

## Error Handling

### Invalid Keybindings

**Scenario**: Keybinding missing required field (key, action, category)

**Handling**:
- Log error with logger.error()
- Skip invalid keybinding
- Continue loading valid keybindings

### Duplicate Actions

**Scenario**: Two keybindings define same action

**Handling**:
- Log warning with logger.warn()
- Last definition wins (predictable)
- Both displayed in help overlay

### No Handler Registered

**Scenario**: Keybinding action has no handler in actionHandlers Map

**Handling**:
- Log warning with logger.warn()
- No action executed
- User sees no response (silent failure)

### Conflicting Keybindings

**Scenario**: Two keybindings use same key combination

**Handling**:
- Log warning with logger.warn()
- First match wins (registry order)
- Both displayed in help overlay

---

## Key Bugs Fixed

### Bug: React Duplicate Key Warning

**Issue**: Console error "Encountered two children with the same key, `help.show`" when displaying help popup.

**Root Cause**: 
- `config/files.yaml` defined multiple keybindings with the same action (`help.show` bound to both `?` and `h`)
- `HelpOverlay.tsx` used `key={kb.action}` when rendering keybindings in a list
- React requires unique keys for list items; duplicate actions caused duplicate keys

**Solution**:
- Changed React key from `kb.action` to `formatKeyCombo(kb)` in `HelpOverlay.tsx:121`
- This generates unique keys based on the key combination (e.g., `"Shift+?"` and `"h"`)
- Supports multiple keybindings for the same action without key collisions

**Impact**: 
- Eliminated React console error
- Help popup renders correctly with both keybindings visible
- Validates that multiple keybindings per action are properly supported

**Files Changed**:
- `src/app/files/components/HelpOverlay.tsx` (line 121)

**Date Fixed**: 2026-02-08

---

## Known Limitations and Future Work

- **Custom keybindings**: Users must edit `config/files.yaml` manually; there is no settings UI. Future: settings page and config write API.
- **Conflict visibility**: Duplicate key combos or actions are logged to console; no visual indicator in the help overlay. Future: conflict indicator in help overlay or keybinding editor.
- **Optional future enhancements**: Keybinding profiles (e.g. vim-mode), keybinding export/import, keybinding recording for discoverability.

---

## Metadata

**Status**: In Progress  
**Created**: 2026-02-07  
**Author**: AI Agent  
**Architecture**: `[ARCH-KEYBIND_SYSTEM]`  
**Requirement**: `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`  
**Estimated Lines**: ~1,500 lines (code + tests + config)  
**Estimated Time**: 4 days
