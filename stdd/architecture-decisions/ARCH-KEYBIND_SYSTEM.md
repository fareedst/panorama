# ARCH-KEYBIND_SYSTEM: Keyboard Shortcut System Architecture

**Status**: Active  
**Created**: 2026-02-07  
**Related Requirements**: `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`, `[REQ-KEYBOARD_NAVIGATION]`, `[REQ-CONFIG_DRIVEN_FILE_MANAGER]`

---

## Decision

Implement a **configuration-driven keyboard shortcut system** with a centralized registry, event-driven architecture, and declarative keybinding definitions in YAML configuration.

---

## Context

The current file manager has many hardcoded keyboard shortcuts scattered throughout `WorkspaceView.tsx` in a large switch statement. This approach has limitations:

### Problems with Current Approach

1. **No Discoverability**: Users can't see what shortcuts exist
2. **No Configurability**: All shortcuts hardcoded in TypeScript
3. **Poor Maintainability**: Adding shortcuts requires modifying large switch statement
4. **No Organization**: Shortcuts not categorized or documented
5. **No Search**: No way to find actions by name
6. **Tight Coupling**: Keyboard handling tightly coupled to WorkspaceView component

### Requirements

From `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`:
- Help overlay showing all shortcuts
- Configurable keybindings from YAML
- Command palette for action search
- All file operations accessible via keyboard
- Modal dialogs with keyboard navigation

---

## Decision Rationale

### Chosen Architecture: **Configuration-Driven Registry Pattern**

**Components**:

1. **Keybinding Registry** (`files.keybinds.ts`)
   - Central registry of all keybindings
   - Loaded from YAML configuration
   - Provides matching, lookup, and enumeration APIs
   - Immutable after initialization

2. **Event Dispatcher**
   - Maps keyboard events to action names
   - Handles modifier key combinations
   - Prevents default browser behavior when needed

3. **Action Registry**
   - Maps action names to handler functions
   - Allows registration/unregistration of handlers
   - Supports action prerequisites (e.g., file selected)

4. **UI Components**
   - HelpOverlay: Displays keybindings by category
   - CommandPalette: Fuzzy search for actions

### Why This Architecture

**Advantages**:

1. **Separation of Concerns**
   - Keybindings (YAML) separate from handlers (TypeScript)
   - Registry separate from event handling
   - UI separate from business logic

2. **Configurability**
   - Users can customize keybindings without code changes
   - Keybindings validated at load time
   - Invalid keybindings logged but don't crash app

3. **Discoverability**
   - Help overlay auto-generated from registry
   - Command palette auto-generated from registry
   - Category organization for better UX

4. **Maintainability**
   - Adding new shortcuts: add to YAML + register handler
   - Clear separation between key mapping and action execution
   - Testable: registry, matching, and handlers tested independently

5. **Extensibility**
   - Easy to add new keybindings
   - Easy to add new categories
   - Easy to add context-dependent shortcuts

**Tradeoffs**:

1. **Complexity**: More files and abstractions than simple switch statement
   - **Mitigation**: Clear documentation and examples
   
2. **Performance**: Registry lookup on every keypress
   - **Mitigation**: Map-based O(1) lookups, negligible overhead
   
3. **Indirection**: Handler function not obvious from key code
   - **Mitigation**: Type-safe action names, good naming convention

---

## Alternatives Considered

### Alternative 1: Keep Hardcoded Switch Statement

**Approach**: Keep current large switch in WorkspaceView, add help overlay that duplicates info

**Pros**:
- Simplest to implement
- No additional abstractions
- Clear what happens on each key

**Cons**:
- ❌ Not configurable (fails requirement)
- ❌ No help overlay auto-generation
- ❌ No command palette
- ❌ Hard to maintain as shortcuts grow
- ❌ Violates DRY (shortcuts defined twice: code + help)

**Rejected**: Fails core requirement of configurability

### Alternative 2: React Hook-Based System

**Approach**: Use React hooks like `useKeyboardShortcut(key, handler)` throughout components

**Pros**:
- Idiomatic React pattern
- Component-local shortcut definitions
- Easy to add shortcuts per component

**Cons**:
- ❌ Scattered definitions (no central registry)
- ❌ Hard to generate help overlay
- ❌ Hard to detect conflicts
- ❌ No YAML configurability
- ❌ Performance overhead (many event listeners)

**Rejected**: Doesn't provide centralized registry needed for help/command palette

### Alternative 3: Browser-Based Keyboard API

**Approach**: Use browser's built-in keyboard event handling with `addEventListener`

**Pros**:
- Native browser API
- Well-documented
- No abstractions

**Cons**:
- ❌ Still requires custom registry for help/config
- ❌ No configurability from YAML
- ❌ Modifier key handling is complex
- ❌ No action name abstraction

**Rejected**: Doesn't solve any of our problems

---

## Architecture Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      WorkspaceView                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Keyboard Event Handler (useEffect)           │  │
│  │  - Listens to window keydown events                  │  │
│  │  - Calls KeybindingRegistry.match(event)             │  │
│  │  - Calls ActionRegistry.execute(actionName)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Action Registry (Map)                    │  │
│  │  - Registers action handlers on mount                │  │
│  │  - Maps action names to handler functions            │  │
│  │  - Validates prerequisites before execution          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ imports
┌─────────────────────────────────────────────────────────────┐
│             files.keybinds.ts (Keybinding Registry)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   loadKeybindings(): KeybindingRegistry              │  │
│  │   - Loads from config/files.yaml                     │  │
│  │   - Parses keybinding array                          │  │
│  │   - Builds lookup maps (by action, by category)      │  │
│  │   - Validates and warns on duplicates/errors         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   matchKeybinding(event): string | null              │  │
│  │   - Matches KeyboardEvent to action name             │  │
│  │   - Checks key and all modifiers                     │  │
│  │   - Returns action name or null                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   getKeybindingsByCategory(cat): Keybinding[]        │  │
│  │   - Returns all keybindings in a category            │  │
│  │   - Used by HelpOverlay                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   getAllKeybindings(): Keybinding[]                  │  │
│  │   - Returns all keybindings (all categories)         │  │
│  │   - Used by CommandPalette                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ used by
┌─────────────────────────────────────────────────────────────┐
│         HelpOverlay.tsx (? key)                             │
│  - Calls getKeybindingsByCategory() for each category       │
│  - Renders shortcuts in organized table                     │
│  - Shows: key combo + description                           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│       CommandPalette.tsx (Ctrl+P)                           │
│  - Calls getAllKeybindings()                                │
│  - Fuzzy filters by action name/description                 │
│  - Renders filtered results with highlighting               │
│  - Executes action on Enter                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialization**:
   ```
   App Start
   → Load config/files.yaml
   → Parse keybindings section
   → Build KeybindingRegistry (maps)
   → Validate duplicates/errors
   → Registry ready
   ```

2. **Keyboard Event**:
   ```
   User Presses Key
   → Browser fires KeyboardEvent
   → WorkspaceView handler receives event
   → Calls KeybindingRegistry.match(event)
   → Returns action name (e.g., "navigate.up")
   → Calls ActionRegistry.execute("navigate.up")
   → Handler function runs
   → State updated / API called
   ```

3. **Help Overlay**:
   ```
   User Presses ?
   → Opens HelpOverlay component
   → Calls getKeybindingsByCategory() for each category
   → Renders table: Category → [Key, Description]
   → User sees all shortcuts
   ```

4. **Command Palette**:
   ```
   User Presses Ctrl+P
   → Opens CommandPalette component
   → Calls getAllKeybindings()
   → User types search text
   → Fuzzy filter keybindings
   → User selects result (arrows + Enter)
   → Execute action
   ```

---

## Key Design Decisions

### 1. Configuration Format (YAML)

**Decision**: Define keybindings in `config/files.yaml`

**Format**:
```yaml
keybindings:
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
  
  - key: "ArrowUp"
    action: "navigate.up"
    description: "Move cursor up"
    category: "navigation"
```

**Rationale**:
- ✅ Human-readable and editable
- ✅ Consistent with existing config files (site.yaml, theme.yaml, jobs.yaml)
- ✅ Easy to validate with schema
- ✅ Supports complex modifiers

### 2. Action Naming Convention

**Decision**: Use `category.verb` naming pattern

**Examples**:
- `navigate.up`, `navigate.down`, `navigate.enter`, `navigate.parent`
- `file.copy`, `file.move`, `file.delete`, `file.rename`
- `mark.toggle`, `mark.all`, `mark.invert`, `mark.clear`
- `view.sort`, `view.comparison`
- `preview.info`, `preview.content`
- `bookmark.add`, `bookmark.list`
- `history.back`, `history.forward`
- `help.show`, `command.palette`

**Rationale**:
- ✅ Self-documenting
- ✅ Groups related actions
- ✅ Easy to search/filter
- ✅ Prevents name collisions
- ✅ Scales to 100+ actions

### 3. Modifier Key Handling

**Decision**: Support Ctrl, Shift, Alt, Meta modifiers

**Representation**:
```typescript
interface KeyModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;  // Cmd on Mac, Win on Windows
}
```

**Matching**:
- All specified modifiers must be pressed
- Unspecified modifiers must NOT be pressed
- Example: `{ctrl: true}` matches Ctrl+P but not Ctrl+Shift+P

**Rationale**:
- ✅ Covers all standard modifier keys
- ✅ Explicit matching (no ambiguity)
- ✅ Works cross-platform (Meta key)

### 4. Category Organization

**Decision**: Fixed set of 7 categories

**Categories**:
1. **navigation**: Moving cursor, changing directories
2. **file-operations**: Copy, move, delete, rename
3. **marking**: Selecting files for batch operations
4. **view-sort**: Sorting, filtering, comparison
5. **preview**: Info panel, content preview
6. **advanced**: Bookmarks, history, goto
7. **system**: Help, command palette, settings

**Rationale**:
- ✅ Logical groupings for help overlay
- ✅ Matches Goful's organization
- ✅ Scales to 50+ shortcuts
- ✅ Easy to explain to users

### 5. Registry Initialization

**Decision**: Singleton registry initialized on first use

**Pattern**:
```typescript
let registry: KeybindingRegistry | null = null;

export function getKeybindingRegistry(): KeybindingRegistry {
  if (!registry) {
    registry = loadKeybindings();
  }
  return registry;
}
```

**Rationale**:
- ✅ Lazy initialization (only load if file manager used)
- ✅ Singleton (one source of truth)
- ✅ Immutable after load (thread-safe, cacheable)
- ✅ Easy to test (can inject mock registry)

### 6. Action Handler Registration

**Decision**: Actions registered in WorkspaceView using Map

**Pattern**:
```typescript
const actionHandlers = useMemo(() => new Map<string, () => void>([
  ["navigate.up", () => handleCursorMove(focusIndex, pane.cursor - 1)],
  ["navigate.down", () => handleCursorMove(focusIndex, pane.cursor + 1)],
  ["file.copy", () => handleBulkCopy()],
  // ... all actions
]), [focusIndex, pane, /* dependencies */]);

// In keyboard handler
const actionName = matchKeybinding(event);
if (actionName) {
  const handler = actionHandlers.get(actionName);
  if (handler) {
    event.preventDefault();
    handler();
  }
}
```

**Rationale**:
- ✅ Type-safe action names (TypeScript string literal types)
- ✅ All handlers in one place (WorkspaceView)
- ✅ Easy to add new actions
- ✅ Dependencies tracked by useMemo

---

## Implementation Strategy

### Phase 1: Keybinding Registry (Day 1)

1. Create `files.keybinds.ts` with types
2. Implement `loadKeybindings()` from config
3. Implement `matchKeybinding(event)` function
4. Implement category lookup functions
5. Write unit tests (20+ tests)

### Phase 2: Configuration (Day 1)

1. Add `keybindings:` section to `config/files.yaml`
2. Define all current shortcuts (25+)
3. Organize by category
4. Add to TypeScript config types

### Phase 3: Help Overlay (Day 2)

1. Create `HelpOverlay.tsx` component
2. Display keybindings by category
3. Format key combinations nicely
4. Add keyboard shortcut formatter utility
5. Write UI tests

### Phase 4: Command Palette (Day 2-3)

1. Create `CommandPalette.tsx` component
2. Implement fuzzy search (simple substring)
3. Implement keyboard navigation (arrows, Enter)
4. Highlight matching text
5. Write integration tests

### Phase 5: Refactor WorkspaceView (Day 3-4)

1. Replace switch statement with action handlers Map
2. Use registry.match() instead of hardcoded keys
3. Register all action handlers in useMemo
4. Add help/palette triggers
5. Test all shortcuts still work

### Phase 6: Testing & Polish (Day 4)

1. Test all shortcuts end-to-end
2. Test custom keybindings
3. Test conflict detection
4. Fix bugs
5. Update documentation

---

## Testing Strategy

### Unit Tests

**Target**: `files.keybinds.ts`

- Parse keybindings from config
- Match keyboard events to actions
- Handle all modifier combinations
- Detect duplicate keybindings
- Validate keybinding format
- Category lookup and organization

### Integration Tests

**Target**: WorkspaceView keyboard handling

- Press shortcut → action executes
- Verify state updates
- Verify API calls
- Verify prerequisites (file selected, etc.)
- Verify event.preventDefault() called

### UI Tests

**Target**: HelpOverlay and CommandPalette

- Help overlay displays on ? key
- All shortcuts shown
- Categories displayed correctly
- Command palette filters correctly
- Palette executes on Enter
- Palette closes on Escape

---

## Success Criteria

1. ✅ All 25+ shortcuts work via registry (no hardcoded switch)
2. ✅ Help overlay shows all shortcuts organized by category
3. ✅ Command palette filters actions by name
4. ✅ Custom keybindings in YAML change active shortcuts
5. ✅ All tests pass (45+ tests total)
6. ✅ Performance: < 5ms overhead per keypress
7. ✅ Documentation complete and accurate

---

## Risks & Mitigations

### Risk 1: Performance Overhead

**Risk**: Registry lookup on every keypress adds latency

**Mitigation**:
- Use Map for O(1) lookups
- Benchmark: target < 5ms per keypress
- Profile in production

**Likelihood**: Low  
**Impact**: Low

### Risk 2: Keybinding Conflicts

**Risk**: User defines conflicting keybindings in YAML

**Mitigation**:
- Detect conflicts at load time
- Warn in console (with logger)
- Last definition wins (predictable)
- Document conflict resolution

**Likelihood**: Medium  
**Impact**: Low

### Risk 3: Complex Refactoring

**Risk**: Refactoring WorkspaceView breaks existing shortcuts

**Mitigation**:
- Incremental refactoring
- Test each shortcut after change
- Keep tests passing at each step
- Fallback: can revert to switch statement

**Likelihood**: Medium  
**Impact**: Medium

---

## Metadata

**Status**: Active  
**Created**: 2026-02-07  
**Author**: AI Agent  
**Last Updated**: 2026-02-07  
**Reason**: Initial creation for Phase 7 - Keyboard Shortcuts System  
**Related Requirements**: `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`, `[REQ-KEYBOARD_NAVIGATION]`  
**Related Implementations**: `[IMPL-KEYBINDS]`, `[IMPL-HELP_OVERLAY]`, `[IMPL-COMMAND_PALETTE]`
