# ARCH-TOOLBAR_LAYOUT: Toolbar Positioning and Layout Architecture

**Status**: Planned  
**Created**: 2026-02-08

## Decision

Implement a three-tier toolbar system with configurable positioning, using a horizontal button group layout with category-based grouping and visual separators.

## Context

The file manager has 36+ keyboard shortcuts across multiple categories (navigation, file operations, marking, view/sort, preview, advanced, system). Users need visual access to these operations but the interface must remain uncluttered and the keyboard-first design philosophy must be preserved.

## Requirements

- `[REQ-TOOLBAR_SYSTEM]` - Main toolbar functionality requirement
- `[REQ-TOOLBAR_CONFIG]` - Configuration-driven customization
- `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]` - Existing keybinding system

## Architecture Decision

### Three Toolbar Types

**1. Workspace Toolbar**
- **Scope**: Actions affecting all panes simultaneously
- **Examples**: Refresh all, layout switching, linked navigation toggle, comparison mode
- **Default position**: Top of workspace, above all panes
- **Rationale**: Global actions should be visually distinct from pane-specific operations

**2. Pane Toolbar**
- **Scope**: Actions specific to the currently focused pane
- **Examples**: File operations (copy, move, delete), navigation, marking, sorting
- **Default position**: Top of workspace, below workspace toolbar
- **Alternative**: Per-pane positioning (each pane gets its own toolbar)
- **Rationale**: Most-used operations; needs to be easily accessible

**3. System Toolbar**
- **Scope**: System-wide actions independent of panes
- **Examples**: Help, command palette, search
- **Default position**: Top-right of workspace
- **Rationale**: These are meta-actions that don't fit workspace or pane categories

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Workspace Toolbar: Refresh All | Link | Layouts...]        │
├─────────────────────────────────────────────────────────────┤
│ [Pane Toolbar: Copy | Move | Delete | ... ] [System: ?|⌘P] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┬─────────────────┐                       │
│ │ Pane 1          │ Pane 2          │                       │
│ │                 │                 │                       │
│ └─────────────────┴─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

Alternative per-pane layout:
```
┌─────────────────────────────────────────────────────────────┐
│ [Workspace Toolbar: Refresh All | Link | Layouts...]        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┬─────────────────┐ [System: ? | ⌘P]     │
│ │ [Pane Toolbar]  │ [Pane Toolbar]  │                       │
│ │ Copy|Move|Del   │ Copy|Move|Del   │                       │
│ ├─────────────────┤─────────────────┤                       │
│ │ Pane 1          │ Pane 2          │                       │
│ │                 │                 │                       │
│ └─────────────────┴─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Button Layout

Each button displays three elements:
1. **Icon** (left): 20x20px SVG icon
2. **Label** (center): Operation name
3. **Keystroke** (right): Keyboard shortcut in badge

```
┌────────────────────────────┐
│ [📋] Copy      [C]         │
│ [✂️] Move      [V]         │
│ [🗑️] Delete    [D]         │
└────────────────────────────┘
```

### Grouping and Separators

Buttons grouped by category with visual separators:

```
[ File Operations: Copy | Move | Delete | Rename ] │ [ Navigation: ↑ | Home | Back ] │ [ Mark: Toggle | All | Clear ]
```

Groups defined in configuration:
```yaml
groups:
  - name: "File Operations"
    actions: ["file.copy", "file.move", "file.delete", "file.rename"]
  - name: "Navigation"
    actions: ["navigate.parent", "navigate.home", "history.back"]
```

### Responsive Behavior

**Desktop (>1024px)**:
- All buttons visible with full labels
- Horizontal layout with group separators

**Tablet (768px - 1024px)**:
- Abbreviated labels or icon-only mode
- Dropdown menus for less-used groups

**Mobile (<768px)**:
- Hamburger menu with categorized action list
- Drawer slides out from side
- Full descriptions in menu

### Position Configuration

Each toolbar type supports:
- `position: "top"` - Above workspace/panes
- `position: "bottom"` - Below workspace/panes
- `position: "hidden"` - Not displayed
- `position: "per-pane"` (Pane toolbar only) - Each pane has its own

## Implementation Approach

### Component Hierarchy

```
WorkspaceView
├── WorkspaceToolbar (if enabled && position === 'top')
├── PaneToolbar (if enabled && position === 'top' && !per-pane)
├── SystemToolbar (if enabled && position === 'top')
├── [Pane rendering with optional per-pane toolbars]
└── [Toolbars at bottom if position === 'bottom']
```

### Toolbar Component Structure

```typescript
<div className="toolbar">
  {config.groups.map(group => (
    <div key={group.name} className="toolbar-group">
      <span className="group-label">{group.name}</span>
      {group.actions.map(action => (
        <ToolbarButton
          key={action}
          action={action}
          onClick={() => onAction(action)}
          active={activeActions.has(action)}
          disabled={disabledActions.has(action)}
        />
      ))}
    </div>
  ))}
</div>
```

### Button Component Structure

```typescript
<button
  className={cn(
    theme.toolbar.buttonBase,
    active && theme.toolbar.buttonActive,
    disabled && theme.toolbar.buttonDisabled
  )}
  onClick={onClick}
  disabled={disabled}
  title={keybinding.description}
  aria-label={`${keybinding.description} (${keystrokeDisplay})`}
>
  <Icon name={iconName} size={20} />
  <span className="button-label">{label}</span>
  <span className="button-keystroke">{keystrokeDisplay}</span>
</button>
```

## Alternatives Considered

### Alternative 1: Single Unified Toolbar

**Approach**: One toolbar with all actions, no separation by scope

**Pros**:
- Simpler implementation
- Single configuration section
- Less visual clutter

**Cons**:
- 36+ buttons in one toolbar is overwhelming
- No clear visual separation of action scopes
- Difficult to understand which actions affect what

**Rejected because**: Visual separation by scope is critical for usability

### Alternative 2: Context-Sensitive Single Toolbar

**Approach**: Single toolbar that changes content based on focus/selection

**Pros**:
- Always shows relevant actions
- Space-efficient

**Cons**:
- Confusing when toolbar content changes unexpectedly
- Difficult to discover all available actions
- Animation/transition complexity

**Rejected because**: Unpredictable toolbar content harms discoverability

### Alternative 3: Floating Action Buttons (FAB)

**Approach**: Small floating buttons at screen corners like mobile apps

**Pros**:
- Modern UI pattern
- Doesn't occupy horizontal space

**Cons**:
- Not consistent with desktop file manager conventions
- Poor discoverability (hidden by default)
- Difficult to show all 36+ actions

**Rejected because**: Desktop users expect traditional toolbars

### Alternative 4: Right-Click Context Menu Only

**Approach**: No toolbars, rely on context menus (already implemented)

**Pros**:
- No screen space used
- Standard file manager pattern

**Cons**:
- Requires right-click (discoverability issue)
- Doesn't show keyboard shortcuts
- Not as accessible as visible toolbars

**Rejected because**: Requirement explicitly asks for toolbars with visible shortcuts

## Trade-offs

### Accepted Trade-offs

1. **Screen space vs. discoverability**: Toolbars consume vertical space but significantly improve operation discoverability
2. **Visual complexity vs. completeness**: Showing all actions increases visual complexity but ensures complete access
3. **Configuration complexity vs. flexibility**: Three separate toolbar types add configuration complexity but enable precise control

### Mitigations

1. **Configurable hiding**: Users can disable toolbars entirely or selectively
2. **Responsive design**: Mobile users get streamlined hamburger menu
3. **Sensible defaults**: Default configuration provides good UX without customization
4. **Group collapsing**: Future enhancement could collapse less-used groups

## Benefits

1. **Clear scope separation**: Workspace vs. pane vs. system actions visually distinct
2. **Discoverability**: New users can see all available operations
3. **Keyboard shortcut learning**: Seeing shortcuts in toolbar helps memorization
4. **Accessibility**: Mouse users can access all operations
5. **Consistency**: Toolbar actions dispatch to same handlers as keyboard shortcuts
6. **Flexibility**: Configuration enables customization without code changes

## Consequences

### Positive

- Significantly improved discoverability for new users
- Better accessibility for users who prefer mouse interaction
- Visual learning aid for keyboard shortcuts
- Professional appearance matching modern file managers

### Negative

- Consumes vertical screen space (mitigated by configuration)
- Adds complexity to component tree (mitigated by clean architecture)
- Requires icon assets for all actions (one-time cost)

### Neutral

- Additional configuration surface area
- More components to test
- Need to maintain toolbar alongside keyboard system

## Related Decisions

- `[ARCH-KEYBIND_SYSTEM]` - Toolbar derives actions from keybinding registry
- `[ARCH-CONFIG_DRIVEN_UI]` - Toolbar follows configuration-driven patterns
- `[ARCH-FILE_MANAGER_HIERARCHY]` - Toolbar integrates into workspace component hierarchy

## Implementation Requirements

1. **React components**: Toolbar, ToolbarButton, WorkspaceToolbar, PaneToolbar, SystemToolbar
2. **Configuration schema**: TypeScript types and YAML schema for toolbar config
3. **Icon system**: Unified Icon component supporting all action icons
4. **Theme integration**: Toolbar styling via theme.yaml
5. **Responsive layout**: Media queries and mobile menu
6. **Accessibility**: ARIA labels, keyboard navigation, focus management

## Testing Approach

- **Unit tests**: Button rendering, group layout, keystroke display
- **Integration tests**: Toolbar actions trigger correct handlers
- **Configuration tests**: Different configs render correctly
- **Accessibility tests**: ARIA, keyboard nav, screen reader
- **Responsive tests**: Mobile, tablet, desktop layouts

## Success Criteria

1. All toolbar types render correctly with configuration
2. Button states (active/disabled) reflect workspace context
3. Toolbar actions dispatch to correct handlers
4. Responsive layout works on all viewport sizes
5. Accessibility requirements met (WCAG 2.1 AA)
6. Performance: No measurable impact on file manager responsiveness

## Notes

- Toolbar positioning relative to panes must account for existing layout algorithms
- Per-pane toolbar mode may need adjustments to pane header layout
- Icon system should be extensible for future action additions
- Consider toolbar customization UI in future enhancement (drag-and-drop buttons)

## Metadata

**Created**: 2026-02-08  
**Author**: AI Agent  
**Last Updated**: 2026-02-08  
**Status**: Implemented
