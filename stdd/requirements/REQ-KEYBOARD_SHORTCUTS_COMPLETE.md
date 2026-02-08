# REQ-KEYBOARD_SHORTCUTS_COMPLETE: Comprehensive Keyboard Shortcut System

**Category**: Functional  
**Priority**: P0  
**Status**: In Progress  
**Created**: 2026-02-07

---

## Overview

Implement a comprehensive keyboard shortcut system that provides complete keyboard-driven workflow, discoverability through a help overlay, configurability through YAML, and a command palette for fuzzy action search.

## Rationale

### Why

Power users need efficient keyboard-driven workflows to maximize productivity in the file manager. The current implementation has many hardcoded shortcuts but lacks:
- Discoverability (no way to see all available shortcuts)
- Configurability (shortcuts are hardcoded in WorkspaceView)
- Extensibility (adding new shortcuts requires code changes)
- Searchability (no way to find actions by name)

### Problems Solved

1. **Mouse-dependent navigation is slow**: Complete keyboard coverage eliminates need for mouse
2. **Incomplete shortcut coverage**: Some actions lack keyboard shortcuts
3. **No discoverability**: Users don't know what shortcuts exist
4. **No configurability**: Users can't customize keybindings
5. **No search**: Users can't find actions by name or description

### Benefits

1. **Complete keyboard navigation**: All file manager actions accessible via keyboard
2. **Configurable keybindings**: Users can customize shortcuts in `config/files.yaml`
3. **Help overlay**: Press `?` to see all available shortcuts organized by category
4. **Command palette**: Press `Ctrl+P` to search for actions by name (fuzzy search)
5. **Better UX**: New users can discover shortcuts, power users can customize

---

## Satisfaction Criteria

### 1. Help Overlay Display

**Criterion**: Help overlay (? key) displays all shortcuts  
**Verification**: Press `?` key and verify modal appears showing all shortcuts

**Acceptance**:
- ✅ Modal overlay appears centered on screen
- ✅ Shows keyboard shortcuts organized by category
- ✅ Categories: Navigation, File Operations, View/Sort, Preview, Marking, Advanced
- ✅ Shows key combination and description for each shortcut
- ✅ Press `Escape` or `?` again to close
- ✅ Scrollable if shortcuts overflow screen height

### 2. Shortcuts Organized by Category

**Criterion**: Shortcuts organized by category  
**Verification**: Review help overlay and configuration structure

**Acceptance**:
- ✅ Categories defined: Navigation, File Operations, View/Sort, Preview, Marking, Advanced
- ✅ Each shortcut assigned to exactly one category
- ✅ Categories displayed in logical order
- ✅ Within each category, shortcuts sorted by importance/frequency

### 3. All File Operations Accessible

**Criterion**: All file operations accessible via keyboard  
**Verification**: Test all operations using keyboard only

**Acceptance**:
- ✅ Navigation: arrows, Enter, Backspace, Tab, Home, End
- ✅ File ops: copy (c), move (v), delete (d), rename (r)
- ✅ Marking: Space, m, Shift+M, Ctrl+M, Escape
- ✅ View: sort (s), comparison (`), info (i), preview (q)
- ✅ Advanced: goto (g), bookmarks (b, Ctrl+B), home (~), history (Alt+Left/Right)
- ✅ System: help (?), command palette (Ctrl+P)

### 4. Configurable Keybindings

**Criterion**: Keybindings configurable in files.yaml  
**Verification**: Modify `config/files.yaml` and reload application

**Acceptance**:
- ✅ Configuration section `keybindings:` in `config/files.yaml`
- ✅ Each keybinding specifies: key, modifiers (optional), action, description, category
- ✅ Changing keybinding in YAML changes active shortcut
- ✅ Invalid keybindings show warning in console
- ✅ Duplicate keybindings detected and warned

### 5. Command Palette for Action Search

**Criterion**: Command palette (Ctrl+P) for fuzzy action search  
**Verification**: Press `Ctrl+P` and search for actions

**Acceptance**:
- ✅ Press `Ctrl+P` opens command palette modal
- ✅ Shows search input focused
- ✅ Lists all available actions below search
- ✅ Typing filters actions by name/description (fuzzy match)
- ✅ Arrow keys navigate filtered results
- ✅ Enter executes selected action
- ✅ Escape closes palette
- ✅ Each result shows: name, description, keyboard shortcut

### 6. Modal Dialog Keyboard Navigation

**Criterion**: Modal dialogs have keyboard navigation  
**Verification**: Test all dialogs (Goto, Bookmark, Sort, Help, Command Palette)

**Acceptance**:
- ✅ Enter confirms/submits
- ✅ Escape cancels/closes
- ✅ Tab moves between fields (if multiple)
- ✅ Arrows navigate lists (bookmark list, command palette results)
- ✅ Focus trapped within modal (can't Tab outside)

---

## Validation Criteria

### Unit Tests

**Coverage**: Keybinding parsing and matching

Tests:
1. Parse keybinding configuration from YAML
2. Match key events to actions
3. Handle modifiers (Ctrl, Shift, Alt, Meta)
4. Detect duplicate keybindings
5. Validate keybinding format
6. Handle invalid/unknown actions
7. Category assignment and retrieval
8. Keybinding registry CRUD operations

**Target**: 20+ unit tests for keybinding system

### Integration Tests

**Coverage**: Action execution via keyboard

Tests:
1. Press keyboard shortcut and verify action executes
2. Verify focus requirements (pane focused, file selected, etc.)
3. Verify state updates after action
4. Verify API calls made for file operations
5. Verify dialogs open/close correctly
6. Verify command palette filters and executes
7. Verify help overlay displays correct shortcuts
8. Verify custom keybindings override defaults

**Target**: 15+ integration tests for shortcut execution

### UI Tests

**Coverage**: Help overlay and command palette display

Tests:
1. Help overlay opens on `?` key
2. Help overlay displays all categories
3. Help overlay displays all shortcuts
4. Help overlay closes on Escape/`?`
5. Command palette opens on `Ctrl+P`
6. Command palette filters on input
7. Command palette executes on Enter
8. Command palette closes on Escape
9. Shortcuts display in correct format
10. Categories display in correct order

**Target**: 10+ UI tests for visual components

---

## Traceability

### Architecture Decisions

- `[ARCH-KEYBIND_SYSTEM]` - Keyboard shortcut system architecture

### Implementation Decisions

- `[IMPL-KEYBINDS]` - Keybinding registry, parser, matcher implementation
- `[IMPL-HELP_OVERLAY]` - Help overlay component
- `[IMPL-COMMAND_PALETTE]` - Command palette component
- `[IMPL-WORKSPACE_VIEW]` - Refactored keyboard handler using registry

### Tests

- `testKeybindingParser_REQ_KEYBOARD_SHORTCUTS_COMPLETE`
- `testKeybindingMatcher_REQ_KEYBOARD_SHORTCUTS_COMPLETE`
- `testHelpOverlay_REQ_KEYBOARD_SHORTCUTS_COMPLETE`
- `testCommandPalette_REQ_KEYBOARD_SHORTCUTS_COMPLETE`

### Code Annotations

All code implementing this requirement must include:
```typescript
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
```

---

## Related Requirements

### Depends On

- `[REQ-KEYBOARD_NAVIGATION]` - Basic keyboard navigation (already implemented)
- `[REQ-CONFIG_DRIVEN_FILE_MANAGER]` - Configuration system (already implemented)

### Related To

- `[REQ-FILE_OPERATIONS]` - File operations that shortcuts trigger
- `[REQ-FILE_MARKING_WEB]` - Marking operations via shortcuts
- `[REQ-ADVANCED_NAV]` - Navigation operations via shortcuts
- `[REQ-FILE_PREVIEW]` - Preview operations via shortcuts
- `[REQ-FILE_SORTING_ADVANCED]` - Sort operations via shortcuts

### Supersedes

None

---

## Implementation Notes

### Key Components

1. **Keybinding Registry** (`src/lib/files.keybinds.ts`)
   - Parse keybindings from configuration
   - Match keyboard events to actions
   - Support modifiers (Ctrl, Shift, Alt, Meta)
   - Category organization
   - Validation and error handling

2. **Help Overlay** (`src/app/files/components/HelpOverlay.tsx`)
   - Modal display of all shortcuts
   - Organized by category
   - Keyboard shortcut formatter
   - Responsive layout

3. **Command Palette** (`src/app/files/components/CommandPalette.tsx`)
   - Fuzzy search input
   - Action list with filtering
   - Keyboard navigation (arrows, Enter, Escape)
   - Result highlighting

4. **Configuration** (`config/files.yaml`)
   - Keybindings section with array of shortcuts
   - Each shortcut: key, modifiers, action, description, category
   - Default keybindings provided
   - User can override/extend

### Data Structures

```typescript
interface Keybinding {
  key: string;              // e.g., "?", "p", "ArrowUp"
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: string;           // e.g., "help.show", "navigate.up"
  description: string;      // Human-readable description
  category: KeybindingCategory;
}

type KeybindingCategory = 
  | "navigation"
  | "file-operations"
  | "view-sort"
  | "preview"
  | "marking"
  | "advanced"
  | "system";

interface KeybindingRegistry {
  keybindings: Keybinding[];
  byAction: Map<string, Keybinding>;
  byCategory: Map<KeybindingCategory, Keybinding[]>;
}
```

### Keyboard Event Matching

```typescript
function matchesKeybinding(event: KeyboardEvent, binding: Keybinding): boolean {
  // Match key
  if (event.key !== binding.key) return false;
  
  // Match modifiers
  if (binding.modifiers) {
    if (binding.modifiers.ctrl && !event.ctrlKey) return false;
    if (binding.modifiers.shift && !event.shiftKey) return false;
    if (binding.modifiers.alt && !event.altKey) return false;
    if (binding.modifiers.meta && !event.metaKey) return false;
  }
  
  return true;
}
```

### Action Naming Convention

Actions follow a `category.verb` naming pattern:

- **Navigation**: `navigate.up`, `navigate.down`, `navigate.enter`, `navigate.parent`, `navigate.tab`, `navigate.home`, `navigate.goto`
- **File Operations**: `file.copy`, `file.move`, `file.delete`, `file.rename`
- **Marking**: `mark.toggle`, `mark.all`, `mark.invert`, `mark.clear`
- **View/Sort**: `view.sort`, `view.comparison`
- **Preview**: `preview.info`, `preview.content`
- **Advanced**: `bookmark.add`, `bookmark.list`, `history.back`, `history.forward`
- **System**: `help.show`, `command.palette`

---

## Success Metrics

1. **Discoverability**: New users can find all shortcuts within 30 seconds using help overlay
2. **Customization**: Power users can rebind any shortcut in < 2 minutes
3. **Search Speed**: Command palette filters to desired action in < 3 keystrokes on average
4. **Coverage**: 100% of file manager actions accessible via keyboard
5. **Performance**: Keyboard handling adds < 5ms latency to keypress events

---

## Metadata

**Created**: 2026-02-07  
**Author**: AI Agent  
**Last Updated**: 2026-02-07  
**Reason**: Initial creation for Phase 7 - Keyboard Shortcuts System  
**Last Validated**: 2026-02-07  
**Validator**: AI Agent  
**Result**: Pass
