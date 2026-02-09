# REQ-TOOLBAR_SYSTEM: File Manager Toolbar System

**Status**: Implemented  
**Priority**: P1 (Important)  
**Category**: Functional  
**Created**: 2026-02-08

## Overview

The file manager requires a discoverable, configurable toolbar system that provides visual access to all keyboard-driven operations. This addresses the accessibility concern that keyboard-only interfaces present barriers for some users and reduces the learning curve for new users.

## Rationale

### Why

To improve discoverability and accessibility of file manager operations by providing a visual, mouse-accessible interface alongside the existing comprehensive keyboard shortcuts system.

### Problems Solved

- **Steep learning curve**: New users must memorize 36+ keyboard shortcuts to use the file manager effectively
- **Limited accessibility**: Keyboard-only interface excludes users who prefer or require mouse interaction
- **Poor discoverability**: No visual indication of available operations or their keyboard shortcuts
- **Context confusion**: Users cannot easily see which operations are available in the current context

### Benefits

- **Improved onboarding**: New users can explore operations visually before memorizing shortcuts
- **Accessibility compliance**: Mouse and keyboard interaction support for diverse user needs
- **Discoverability**: Toolbar buttons show operation names, icons, and keyboard shortcuts
- **Context awareness**: Active/disabled button states reflect current workspace context
- **Configuration flexibility**: Users can customize toolbar visibility, position, and content

## Satisfaction Criteria

1. **Complete operation coverage**: All 36+ keybinding actions represented in configurable toolbars
2. **Visual clarity**: Each button displays icon (when available) + keyboard shortcut in compact format; label text only shown as fallback when no icon exists
3. **Configuration system**: Toolbar visibility, position, and button selection configurable via `config/files.yaml`
4. **Theme integration**: Toolbar styling follows existing theme system in `config/theme.yaml`
5. **Context awareness**: Button states (active/disabled) reflect current workspace state
6. **Behavioral consistency**: Toolbar button actions dispatch to same handlers as keyboard shortcuts
7. **Responsive design**: Toolbars adapt to mobile, tablet, and desktop viewports
8. **Performance**: Toolbar rendering does not impact file manager responsiveness
9. **Compact layout**: Buttons sized to prevent overflow even with 12+ actions per toolbar

## Validation Criteria

### Automated Testing

- **Component tests**: Toolbar button rendering, group layout, keystroke display
- **Integration tests**: Toolbar actions trigger correct handlers with proper state updates
- **Configuration tests**: Toolbar responds correctly to configuration changes
- **Accessibility tests**: ARIA labels, keyboard navigation, focus management

### Manual Verification

- **Visual inspection**: All buttons render with icons and keystrokes in compact format; labels only shown when icon absent
- **Layout testing**: Verify no button overflow with 12+ actions in single toolbar (Pane toolbar stress test)
- **Interaction testing**: Click all toolbar buttons and verify correct behavior
- **Configuration testing**: Modify `config/files.yaml` and verify toolbar updates
- **Responsive testing**: Verify toolbar layout on mobile, tablet, desktop viewports
- **Context testing**: Verify active/disabled states match workspace context

### Manual Verification Checklist

Comprehensive validation checklist for toolbar implementation:

**Rendering**:
- [ ] All toolbar buttons render correctly
- [ ] Icons display properly (no missing glyphs)
- [ ] Keystrokes display in readable format (no raw keys)
- [ ] Tooltips show full descriptions on hover
- [ ] No visual overflow with 12-button Pane toolbar
- [ ] Group separators visible between button groups

**Button States**:
- [ ] Active states highlight correctly (link mode shows active when enabled)
- [ ] Active states highlight correctly (comparison mode shows active when enabled)
- [ ] Disabled states apply correctly (no files → file operations disabled)
- [ ] Disabled states apply correctly (no marks → mark clear/invert disabled)
- [ ] Disabled states apply correctly (at navigation boundaries → up/down disabled)
- [ ] Disabled states apply correctly (max panes → add pane disabled)
- [ ] Disabled states apply correctly (min panes → remove pane disabled)

**Behavior**:
- [ ] Toolbar actions behave identically to keyboard shortcuts
- [ ] File copy button = "C" key behavior
- [ ] Navigation buttons = arrow key behavior
- [ ] Mark buttons = space/mark key behavior
- [ ] System buttons open correct dialogs (help, command palette, search)

**Configuration**:
- [ ] Disabling `toolbars.enabled: false` hides all toolbars
- [ ] Disabling individual toolbars hides only that toolbar
- [ ] Position "top" renders above panes
- [ ] Position "bottom" would render below panes (if implemented)
- [ ] Position "hidden" hides toolbar
- [ ] Custom button groups render with specified actions

**Responsive**:
- [ ] Desktop (>1024px): All buttons visible, no overflow
- [ ] Tablet (768-1024px): Layout adapts or scrolls gracefully (if implemented)
- [ ] Mobile (<768px): Hamburger menu or simplified layout (if implemented)

## Functional Requirements

### FR-1: Three Toolbar Types

**Workspace Toolbar**: Actions affecting all panes
- Layout switching (Tile, OneRow, OneColumn, Fullscreen)
- Global refresh (refresh all panes)
- Linked navigation toggle
- Comparison mode toggle

**Pane Toolbar**: Actions specific to focused pane
- File operations (copy, move, delete, rename)
- Navigation (parent, home, first, last, history)
- Marking operations (toggle, all, invert, clear)
- Sort operations (by name, size, time, extension)

**System Toolbar**: Independent system actions
- Help overlay
- Command palette
- Search (finder, content search)

### FR-2: Button Display

Each toolbar button must display:
- **Icon**: Visual identifier for the operation (required when available)
- **Label**: Text name of the operation (only displayed when icon is NOT present)
- **Keystroke**: Keyboard shortcut in readable format (e.g., "Ctrl+C", "Space", "Shift+?")
- **Tooltip**: Hover text with full operation description from keybinding registry

**Display Priority**: Icon + Keystroke (compact) > Label + Keystroke (fallback when no icon)

**Design Rationale**: Compact icon-only buttons with keystroke badges maximize toolbar density, allowing more actions to be visible without overflow while maintaining discoverability through tooltips.

### FR-3: Button States

Buttons must reflect context:
- **Normal**: Operation available in current context
- **Active**: Toggle operation currently enabled (e.g., linked mode, hidden files)
- **Disabled**: Operation unavailable in current context (e.g., clear marks when no files marked)

### FR-4: Configuration System

`config/files.yaml` must support:

```yaml
toolbars:
  enabled: true
  
  workspace:
    enabled: true
    position: "top" # top | bottom | hidden
    groups:
      - name: "Layout"
        actions: ["layout.tile", "layout.oneRow", ...]
  
  pane:
    enabled: true
    position: "top"
    groups:
      - name: "File Operations"
        actions: ["file.copy", "file.move", ...]
  
  system:
    enabled: true
    position: "top"
    groups:
      - name: "System"
        actions: ["help.show", "command.palette", ...]
```

### FR-5: Theme Integration

`config/theme.yaml` must support toolbar styling:

```yaml
files:
  toolbar:
    background: "bg-gray-100 dark:bg-gray-900"
    border: "border-b border-gray-300 dark:border-gray-700"
    buttonBase: "px-3 py-2 text-sm rounded hover:bg-gray-200"
    buttonActive: "bg-blue-100 dark:bg-blue-900"
    buttonDisabled: "opacity-50 cursor-not-allowed"
```

## Non-Functional Requirements

### NFR-1: Performance

- Toolbar configuration loaded once on mount
- Button rendering memoized to prevent unnecessary re-renders
- Action dispatch optimized to reuse existing handlers

### NFR-2: Accessibility

- All buttons have ARIA labels
- Keyboard navigation within toolbar (Tab, Arrow keys)
- Focus indicators match theme
- Screen reader compatible

### NFR-3: Maintainability

- Toolbar actions derived from existing keybinding registry
- No duplication of action handler logic
- Configuration-driven design supports future customization

## Dependencies

- `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]` - Keybinding registry provides action definitions
- `[REQ-CONFIG_DRIVEN_FILE_MANAGER]` - Configuration system architecture
- `[ARCH-KEYBIND_SYSTEM]` - Keybinding registry implementation
- `[ARCH-CONFIG_DRIVEN_UI]` - Configuration-driven UI architecture

## Traceability

### Architecture

- `[ARCH-TOOLBAR_LAYOUT]` - Toolbar positioning and layout decisions
- `[ARCH-TOOLBAR_ACTIONS]` - Action-to-button mapping architecture

### Implementation

- `[IMPL-TOOLBAR_COMPONENT]` - React component implementation
- `[IMPL-TOOLBAR_CONFIG]` - Configuration loader and TypeScript types

### Tests

- `src/app/files/components/Toolbar.test.tsx`
- `src/app/files/components/WorkspaceToolbar.test.tsx`
- `src/app/files/components/PaneToolbar.test.tsx`
- `src/app/files/components/SystemToolbar.test.tsx`

### Code Annotations

All toolbar code will include:
- `[REQ-TOOLBAR_SYSTEM]`
- `[ARCH-TOOLBAR_LAYOUT]` or `[ARCH-TOOLBAR_ACTIONS]`
- `[IMPL-TOOLBAR_COMPONENT]` or `[IMPL-TOOLBAR_CONFIG]`

## Related Requirements

- `[REQ-CONFIG_DRIVEN_FILE_MANAGER]` - Parent configuration requirement
- `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]` - Keyboard shortcuts that toolbars expose
- `[REQ-MOUSE_INTERACTION]` - Mouse interaction support

## Success Metrics

1. **Coverage**: 100% of keybinding actions accessible via toolbars
2. **Usability**: New users can discover and use all operations without documentation
3. **Performance**: No measurable impact on file manager responsiveness
4. **Accessibility**: Passes WCAG 2.1 AA standards for keyboard and screen reader support
5. **Configuration**: All toolbar aspects customizable without code changes

## Out of Scope

The following are explicitly not part of this requirement:

- Custom user-defined toolbar actions (future enhancement)
- Toolbar theming beyond existing theme system
- Drag-and-drop toolbar customization UI
- Context menus (covered by `[REQ-MOUSE_INTERACTION]`)

## Notes

- Toolbar buttons dispatch to existing keyboard action handlers, ensuring behavioral consistency
- Configuration-driven design enables A/B testing and internationalization
- Icon system must be extensible for future action additions
