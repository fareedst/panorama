# ARCH-TOOLBAR_ACTIONS: Action-to-Button Mapping Architecture

**Status**: Planned  
**Created**: 2026-02-08

## Decision

Toolbar buttons derive all metadata (icon, label, keystroke, description) from the existing keybinding registry, ensuring consistent behavior between toolbar clicks and keyboard shortcuts.

## Context

The file manager has a comprehensive keybinding system (`[ARCH-KEYBIND_SYSTEM]`) with 36+ actions across 7 categories. Toolbars must expose these same actions visually while maintaining behavioral consistency and avoiding code duplication.

## Requirements

- `[REQ-TOOLBAR_SYSTEM]` - Toolbar functionality
- `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]` - Existing keybinding system
- `[ARCH-KEYBIND_SYSTEM]` - Keybinding registry implementation

## Architecture Decision

### Single Source of Truth: Keybinding Registry

All toolbar button metadata derived from keybinding registry:

```typescript
// Keybinding registry (already exists)
interface KeybindingConfig {
  key: string;                    // e.g., "c", "ArrowUp", "Enter"
  action: string;                 // e.g., "file.copy", "navigate.up"
  description: string;            // e.g., "Copy marked files"
  category: string;               // e.g., "file-operations"
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
}

// Toolbar button derives everything from registry
function createToolbarButton(actionName: string): ToolbarButtonProps {
  const keybinding = getKeybindingRegistry().find(kb => kb.action === actionName);
  
  return {
    icon: deriveIconFromAction(actionName),      // "file.copy" → "copy"
    label: deriveLabelFromDescription(keybinding.description),  // "Copy marked files" → "Copy"
    keystroke: formatKeystroke(keybinding),      // {key: "c"} → "C"
    description: keybinding.description,         // Full text for tooltip
    action: actionName,
    onClick: () => dispatchAction(actionName)
  };
}
```

### Action-to-Icon Mapping

Systematic mapping from action names to icon identifiers:

```typescript
// [IMPL-TOOLBAR_COMPONENT] Icon mapping
const ACTION_ICON_MAP: Record<string, string> = {
  // File operations
  'file.copy': 'copy',
  'file.move': 'move',
  'file.delete': 'delete',
  'file.rename': 'rename',
  
  // Navigation
  'navigate.up': 'arrow-up',
  'navigate.down': 'arrow-down',
  'navigate.enter': 'arrow-right',
  'navigate.parent': 'arrow-left',
  'navigate.home': 'home',
  'navigate.first': 'arrow-up-double',
  'navigate.last': 'arrow-down-double',
  
  // Marking
  'mark.toggle': 'checkbox',
  'mark.all': 'checkbox-multiple',
  'mark.invert': 'checkbox-invert',
  'mark.clear': 'checkbox-clear',
  
  // View & Sort
  'view.sort': 'sort',
  'view.comparison': 'compare',
  'view.hidden': 'eye',
  
  // Preview
  'preview.info': 'info',
  'preview.content': 'preview',
  
  // System
  'help.show': 'help',
  'command.palette': 'command',
  'search.finder': 'search',
  'search.content': 'search-content',
  
  // Pane management
  'pane.add': 'plus',
  'pane.remove': 'minus',
  'pane.refresh': 'refresh',
  'pane.refresh-all': 'refresh-all',
  
  // Bookmarks
  'bookmark.goto': 'folder-open',
  'bookmark.add': 'bookmark-plus',
  'bookmark.list': 'bookmark-list',
  
  // History
  'history.back': 'undo',
  'history.forward': 'redo',
  
  // Link
  'link.toggle': 'link',
};

function deriveIconFromAction(action: string): string {
  return ACTION_ICON_MAP[action] || 'question-mark';
}
```

### Label Derivation

Extract concise labels from keybinding descriptions:

```typescript
function deriveLabelFromDescription(description: string): string {
  // Extract verb from description
  // "Copy marked files (or current file)" → "Copy"
  // "Toggle mark on current file" → "Mark"
  // "Show keyboard shortcuts" → "Help"
  
  const patterns = [
    /^(Copy|Move|Delete|Rename|Navigate|Mark|Clear|Toggle|Show|Open|Search|Goto|Add|Remove|Refresh)/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[1];
  }
  
  // Fallback: capitalize first word
  return description.split(' ')[0];
}
```

### Keystroke Formatting

Convert keybinding to human-readable keystroke display:

```typescript
function formatKeystroke(keybinding: KeybindingConfig): string {
  const parts: string[] = [];
  
  if (keybinding.modifiers?.ctrl) parts.push('Ctrl');
  if (keybinding.modifiers?.shift) parts.push('Shift');
  if (keybinding.modifiers?.alt) parts.push('Alt');
  if (keybinding.modifiers?.meta) parts.push('⌘');
  
  // Format key
  const key = formatKey(keybinding.key);
  parts.push(key);
  
  return parts.join('+');
}

function formatKey(key: string): string {
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
    '~': '~',
    '?': '?',
    // ... more mappings
  };
  
  return keyMap[key] || key.toUpperCase();
}
```

### Action Dispatch

Toolbar buttons dispatch to existing keyboard action handlers:

```typescript
// In WorkspaceView
const handleToolbarAction = useCallback((action: string) => {
  // Dispatch to same handlers as keyboard shortcuts
  switch (action) {
    // File operations
    case 'file.copy': return handleCopy();
    case 'file.move': return handleMove();
    case 'file.delete': return handleDelete();
    case 'file.rename': return handleRename();
    
    // Navigation
    case 'navigate.up': return handleCursorMove(focusIndex, 'up');
    case 'navigate.down': return handleCursorMove(focusIndex, 'down');
    case 'navigate.enter': return handleEnter();
    case 'navigate.parent': return handleParentDirectory();
    case 'navigate.home': return handleGoHome();
    case 'navigate.first': return handleCursorMove(focusIndex, 'first');
    case 'navigate.last': return handleCursorMove(focusIndex, 'last');
    
    // Marking
    case 'mark.toggle': return handleMarkToggle(true); // with move down
    case 'mark.toggle-cursor': return handleMarkToggle(false);
    case 'mark.all': return handleMarkAll();
    case 'mark.invert': return handleMarkInvert();
    case 'mark.clear': return handleMarkClear();
    
    // View & Sort
    case 'view.sort': return setShowSortDialog(true);
    case 'view.comparison': return handleComparisonToggle();
    case 'view.hidden': return handleToggleHidden();
    
    // Preview
    case 'preview.info': return handleToggleInfoPanel();
    case 'preview.content': return handleTogglePreviewPanel();
    
    // System
    case 'help.show': return setShowHelp(true);
    case 'command.palette': return setShowCommandPalette(true);
    case 'search.finder': return setShowFinder(true);
    case 'search.content': return setShowSearch(true);
    
    // Pane management
    case 'pane.add': return handleAddPane();
    case 'pane.remove': return handleRemovePane();
    case 'pane.refresh': return handleNavigate(focusIndex, panes[focusIndex].path);
    case 'pane.refresh-all': return void Promise.all(panes.map((p, i) => handleNavigate(i, p.path)));
    
    // Bookmarks
    case 'bookmark.goto': return setShowGoto(true);
    case 'bookmark.add': return handleAddBookmark();
    case 'bookmark.list': return setShowBookmarkDialog(true);
    
    // History
    case 'history.back': return handleHistoryBack();
    case 'history.forward': return handleHistoryForward();
    
    // Link
    case 'link.toggle': return setLinkedMode(!linkedMode);
    
    default:
      console.warn(`[REQ-TOOLBAR_SYSTEM] Unknown toolbar action: ${action}`);
  }
}, [/* all handler dependencies */]);
```

## Implementation Approach

### Configuration-Driven Button Creation

Toolbar configuration specifies which actions to include:

```yaml
# config/files.yaml
toolbars:
  pane:
    groups:
      - name: "File Operations"
        actions:
          - "file.copy"
          - "file.move"
          - "file.delete"
          - "file.rename"
```

Component maps actions to buttons:

```typescript
<Toolbar config={config}>
  {config.groups.map(group => (
    <ToolbarGroup key={group.name} name={group.name}>
      {group.actions.map(action => {
        const keybinding = getKeybinding(action);
        const icon = deriveIconFromAction(action);
        const label = deriveLabelFromDescription(keybinding.description);
        const keystroke = formatKeystroke(keybinding);
        
        return (
          <ToolbarButton
            key={action}
            icon={icon}
            label={label}
            keystroke={keystroke}
            description={keybinding.description}
            onClick={() => onAction(action)}
            active={activeActions.has(action)}
            disabled={disabledActions.has(action)}
          />
        );
      })}
    </ToolbarGroup>
  ))}
</Toolbar>
```

### Active/Disabled State Tracking

Toolbar component receives current state via props:

```typescript
// In WorkspaceView
const activeActions = useMemo(() => {
  const active = new Set<string>();
  if (linkedMode) active.add('link.toggle');
  if (showHidden) active.add('view.hidden');
  if (comparisonMode !== 'none') active.add('view.comparison');
  // ... more active states
  return active;
}, [linkedMode, showHidden, comparisonMode, /* ... */]);

const disabledActions = useMemo(() => {
  const disabled = new Set<string>();
  const focusedPane = panes[focusIndex];
  
  // Marking actions disabled when no marks
  if (focusedPane.marks.size === 0) {
    disabled.add('mark.clear');
    disabled.add('mark.invert');
  }
  
  // File operations disabled when no cursor file
  if (focusedPane.files.length === 0) {
    disabled.add('file.copy');
    disabled.add('file.move');
    disabled.add('file.delete');
    disabled.add('file.rename');
  }
  
  // Navigation disabled at boundaries
  if (focusedPane.cursor === 0) {
    disabled.add('navigate.up');
    disabled.add('navigate.first');
  }
  if (focusedPane.cursor === focusedPane.files.length - 1) {
    disabled.add('navigate.down');
    disabled.add('navigate.last');
  }
  
  // Pane management limits
  if (panes.length >= layoutConfig.maxPanes) {
    disabled.add('pane.add');
  }
  if (panes.length <= 1) {
    disabled.add('pane.remove');
  }
  
  return disabled;
}, [panes, focusIndex, layoutConfig]);
```

## Alternatives Considered

### Alternative 1: Separate Button Configuration

**Approach**: Define button metadata explicitly in config, separate from keybindings

```yaml
buttons:
  - action: "file.copy"
    icon: "copy"
    label: "Copy"
    keystroke: "C"
    description: "Copy marked files"
```

**Pros**:
- Explicit control over all button properties
- Can customize without changing keybindings

**Cons**:
- Duplication of keybinding information
- Easy to get out of sync with keybindings
- More configuration maintenance burden

**Rejected because**: Single source of truth is critical for consistency

### Alternative 2: Action Factories

**Approach**: Each action has a factory function that creates button props

```typescript
const FILE_COPY_ACTION = {
  createButton: () => ({
    icon: 'copy',
    label: 'Copy',
    // ...
  }),
  handler: () => { /* ... */ }
};
```

**Pros**:
- Strong typing
- Encapsulated action definition

**Cons**:
- More boilerplate code
- Less configuration-driven
- Harder to customize without code changes

**Rejected because**: Goes against configuration-driven architecture

### Alternative 3: Icon Name in Keybinding Config

**Approach**: Add icon field to keybinding configuration

```yaml
keybindings:
  - key: "c"
    action: "file.copy"
    icon: "copy"  # Add icon to keybinding
    description: "Copy marked files"
```

**Pros**:
- Icon explicitly defined
- Single configuration location

**Cons**:
- Pollutes keybinding config with UI concerns
- Not all keybindings need toolbar buttons
- Less separation of concerns

**Rejected because**: Keybindings should be UI-agnostic

## Trade-offs

### Accepted Trade-offs

1. **Convention over configuration**: Icon mapping uses conventions (action name → icon name), requires consistency
2. **Label extraction**: Deriving labels from descriptions may not always be perfect, needs manual overrides
3. **Dispatch complexity**: Large switch statement in action dispatcher, but maintains single handler logic

### Mitigations

1. **Override support**: Configuration can override derived labels/icons
2. **Fallback icons**: Unknown actions get default question mark icon
3. **Validation**: Warn about unmapped actions at startup
4. **Documentation**: Clear naming conventions for actions and icons

## Benefits

1. **Single source of truth**: Keybindings and toolbar buttons always in sync
2. **Zero duplication**: Button metadata derived, not duplicated
3. **Consistent behavior**: Toolbar and keyboard dispatch to same handlers
4. **Easy maintenance**: Add keybinding automatically enables toolbar button
5. **Type safety**: TypeScript ensures action names match keybindings

## Consequences

### Positive

- Adding new actions automatically works in both keyboard and toolbar
- Changing keybinding descriptions automatically updates toolbar labels
- Impossible for toolbar and keyboard to behave differently
- Configuration-driven design enables customization without code

### Negative

- Requires systematic naming conventions for actions
- Icon mapping needs to be comprehensive
- Large action dispatcher function (mitigated by organization)

### Neutral

- Button metadata is computed at render time (minimal cost)
- Configuration validation required to catch unmapped actions

## Related Decisions

- `[ARCH-KEYBIND_SYSTEM]` - Source of action definitions
- `[ARCH-TOOLBAR_LAYOUT]` - Where buttons are positioned
- `[ARCH-CONFIG_DRIVEN_UI]` - Configuration-driven patterns

## Implementation Requirements

1. **Icon mapping**: Complete ACTION_ICON_MAP for all 36+ actions
2. **Action dispatcher**: handleToolbarAction with all action cases
3. **State tracking**: activeActions and disabledActions computation
4. **Label derivation**: Smart label extraction from descriptions
5. **Keystroke formatting**: Human-readable keystroke display
6. **Validation**: Startup check for unmapped actions

## Testing Approach

- **Unit tests**: Icon derivation, label extraction, keystroke formatting
- **Integration tests**: Toolbar actions trigger correct handlers
- **Consistency tests**: Verify toolbar and keyboard behavior match
- **Configuration tests**: Unmapped actions handled gracefully

## Success Criteria

1. All keybinding actions have icon mappings
2. Toolbar buttons dispatch to same handlers as keyboard
3. Button labels are concise and clear
4. Keystrokes display correctly for all modifier combinations
5. Active/disabled states reflect workspace context accurately
6. No code duplication between keyboard and toolbar systems

## Notes

- Icon system needs 36+ icon definitions
- Action naming convention: `category.verb` pattern
- Consider code generation for ACTION_ICON_MAP from keybindings in future

## Integration Points

### Existing Systems Leveraged

1. **Keybinding Registry** (`src/lib/files.keybinds.ts`)
   - Source of all action definitions
   - Provides action names, descriptions, keystrokes
   - Single source of truth for operation metadata

2. **Action Handlers** (`src/app/files/WorkspaceView.tsx`)
   - Existing keyboard action dispatcher
   - `handleExecuteAction` function reused for toolbar clicks
   - Ensures identical behavior between keyboard and mouse

3. **Configuration System** (`src/lib/config.ts`)
   - YAML loading with type safety
   - Integrates toolbar config into existing config structure
   - No new configuration loading mechanism needed

4. **Theme System** (`config/theme.yaml`)
   - Toolbar styling follows existing theme patterns
   - Consistent with file list, header, status bar styling
   - Dark mode support automatic

### New Systems Added

1. **Icon Component** (`src/components/Icon.tsx`)
   - Reusable SVG icon system
   - 40+ icon definitions for all actions
   - Fallback for unknown icons
   - Accessible (aria-hidden, role="img")

2. **Toolbar Utilities** (`src/lib/toolbar.utils.ts`)
   - Metadata derivation functions
   - Icon mapping (action → icon name)
   - Label extraction (description → concise label)
   - Keystroke formatting (keybinding → display string)
   - Button props aggregation

3. **Toolbar Components** (`src/app/files/components/Toolbar*.tsx`)
   - React component hierarchy
   - Base: Toolbar, ToolbarButton, ToolbarGroup
   - Specialized: WorkspaceToolbar, PaneToolbar, SystemToolbar
   - Configuration-driven rendering

### Integration Flow

```
User Click → ToolbarButton
                ↓
          onAction(action)
                ↓
     WorkspaceView.handleExecuteAction
                ↓
        actionHandlers[action]
                ↓
         Handler Function
                ↓
         State Update
                ↓
      UI Re-render
```

Same flow as keyboard:
```
Keypress → KeyboardHandler
               ↓
      WorkspaceView.handleKeyDown
               ↓
        actionHandlers[action]
               ↓
         Handler Function
               ↓
         State Update
               ↓
      UI Re-render
```

**Key Insight**: Both keyboard and toolbar converge at the same `actionHandlers` map, ensuring behavioral consistency.

## Metadata

**Created**: 2026-02-08  
**Author**: AI Agent  
**Last Updated**: 2026-02-08  
**Status**: Implemented
