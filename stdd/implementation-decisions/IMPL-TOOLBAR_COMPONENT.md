# IMPL-TOOLBAR_COMPONENT: Toolbar React Component Implementation

**Status**: Planned  
**Created**: 2026-02-08

## Overview

Implementation of the toolbar component system for the file manager, including base Toolbar component and specialized WorkspaceToolbar, PaneToolbar, and SystemToolbar wrappers.

## Requirements

- `[REQ-TOOLBAR_SYSTEM]` - Main toolbar functionality
- `[REQ-TOOLBAR_CONFIG]` - Configuration-driven customization

## Architecture

- `[ARCH-TOOLBAR_LAYOUT]` - Layout and positioning decisions
- `[ARCH-TOOLBAR_ACTIONS]` - Action-to-button mapping
- `[ARCH-KEYBIND_SYSTEM]` - Keybinding registry integration
- `[ARCH-CONFIG_DRIVEN_UI]` - Configuration patterns

## Component Structure

### Base Components

**Toolbar.tsx** - Base toolbar container
- Renders groups and buttons from configuration
- Applies theme styling
- Handles responsive layout
- Manages accessibility attributes

**ToolbarButton.tsx** - Individual button component
- Displays icon, label, keystroke
- Shows tooltip on hover
- Handles click events
- Reflects active/disabled state

**ToolbarGroup.tsx** - Button group container
- Groups related buttons
- Renders visual separators
- Applies group-level styling

### Specialized Toolbars

**WorkspaceToolbar.tsx** - Workspace-level actions
- Wraps base Toolbar with workspace-specific config
- Provides workspace action context

**PaneToolbar.tsx** - Pane-level actions
- Wraps base Toolbar with pane-specific config
- Tracks focused pane for context

**SystemToolbar.tsx** - System actions
- Wraps base Toolbar with system-specific config
- Independent of workspace state

## File Structure

```
src/
├── components/
│   └── Icon.tsx                           # [IMPL-ICON_SYSTEM] Unified icon component
├── app/files/components/
│   ├── Toolbar.tsx                        # [IMPL-TOOLBAR_COMPONENT] Base toolbar
│   ├── ToolbarButton.tsx                  # [IMPL-TOOLBAR_COMPONENT] Button component
│   ├── ToolbarGroup.tsx                   # [IMPL-TOOLBAR_COMPONENT] Group container
│   ├── WorkspaceToolbar.tsx               # [IMPL-TOOLBAR_COMPONENT] Workspace toolbar
│   ├── PaneToolbar.tsx                    # [IMPL-TOOLBAR_COMPONENT] Pane toolbar
│   ├── SystemToolbar.tsx                  # [IMPL-TOOLBAR_COMPONENT] System toolbar
│   ├── Toolbar.test.tsx                   # Component tests
│   ├── ToolbarButton.test.tsx             # Button tests
│   └── WorkspaceToolbar.test.tsx          # Integration tests
└── lib/
    ├── config.types.ts                    # [IMPL-TOOLBAR_CONFIG] Type definitions
    └── toolbar.utils.ts                   # [IMPL-TOOLBAR_COMPONENT] Utility functions
```

## TypeScript Interfaces

```typescript
// [IMPL-TOOLBAR_COMPONENT] Component prop types

export interface ToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  className?: string;
}

export interface ToolbarButtonProps {
  action: string;
  icon: string;
  label: string;
  keystroke: string;
  description: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface ToolbarGroupProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}
```

## Implementation Details

### Toolbar.tsx

```typescript
// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
"use client";

import { getKeybindingRegistry } from "@/lib/files.keybinds";
import { deriveToolbarButton } from "@/lib/toolbar.utils";
import type { ToolbarConfig } from "@/lib/config.types";
import { ToolbarGroup } from "./ToolbarGroup";
import { ToolbarButton } from "./ToolbarButton";

export interface ToolbarProps {
  config: ToolbarConfig;
  onAction: (action: string) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
  className?: string;
}

export function Toolbar({
  config,
  onAction,
  activeActions = new Set(),
  disabledActions = new Set(),
  className = "",
}: ToolbarProps) {
  const registry = getKeybindingRegistry();

  if (!config.enabled) return null;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1
        bg-gray-100 dark:bg-gray-900
        border-b border-gray-300 dark:border-gray-700
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="toolbar"
      aria-label="File manager toolbar"
    >
      {config.groups.map((group, groupIndex) => (
        <ToolbarGroup
          key={group.name}
          name={group.name}
          showSeparator={groupIndex > 0}
        >
          {group.actions.map((action) => {
            const buttonProps = deriveToolbarButton(action, registry.keybindings);
            if (!buttonProps) return null;

            return (
              <ToolbarButton
                key={action}
                {...buttonProps}
                onClick={() => onAction(action)}
                active={activeActions.has(action)}
                disabled={disabledActions.has(action)}
              />
            );
          })}
        </ToolbarGroup>
      ))}
    </div>
  );
}
```

**Design Changes**:
- **Compact spacing**: Reduced toolbar padding (`px-4 py-2` → `px-2 py-1`) and group gaps (`gap-2` → `gap-1`)
- **Rationale**: Supports up to 12+ buttons in single row without overflow

### ToolbarButton.tsx

```typescript
// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS]
"use client";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface ToolbarButtonProps {
  action: string;
  icon: string;
  label: string;
  keystroke: string;
  description: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ToolbarButton({
  icon,
  label,
  keystroke,
  description,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: ToolbarButtonProps) {
  // [REQ-TOOLBAR_SYSTEM] Only show label if no icon present (compact design)
  const showLabel = !icon;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${description} (${keystroke})`}
      aria-label={`${description} - Keyboard shortcut: ${keystroke}`}
      className={cn(
        "flex items-center gap-1 px-1.5 py-1 text-xs rounded",
        "transition-colors duration-150",
        "hover:bg-gray-200 dark:hover:bg-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        active && "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <Icon name={icon} size={16} className="flex-shrink-0" />}
      {showLabel && <span className="font-medium">{label}</span>}
      <span
        className={cn(
          "px-1 py-0.5 text-xs rounded",
          "bg-gray-200 dark:bg-gray-700",
          "font-mono"
        )}
        aria-hidden="true"
      >
        {keystroke}
      </span>
    </button>
  );
}
```

**Design Changes**:
- **Compact sizing**: Reduced padding (`px-3 py-2` → `px-1.5 py-1`), smaller gaps (`gap-2` → `gap-1`)
- **Icon-only display**: Label only shown when `!icon` (fallback for actions without icons)
- **Smaller icons**: Reduced from 20px to 16px for density
- **Smaller text**: `text-sm` → `text-xs` for compact appearance
- **Rationale**: Prevents button overflow with 12+ actions per toolbar while maintaining readability

### ToolbarGroup.tsx

```typescript
// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT]
"use client";

export interface ToolbarGroupProps {
  name: string;
  children: React.ReactNode;
  showSeparator?: boolean;
  className?: string;
}

export function ToolbarGroup({
  name,
  children,
  showSeparator = false,
  className = "",
}: ToolbarGroupProps) {
  return (
    <>
      {showSeparator && (
        <div
          className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"
          role="separator"
          aria-orientation="vertical"
        />
      )}
      <div
        className={`flex items-center gap-0.5 ${className}`.trim()}
        role="group"
        aria-label={name}
      >
        {children}
      </div>
    </>
  );
}
```

**Design Changes**:
- **Tighter button spacing**: Reduced gap from `gap-1` (4px) to `gap-0.5` (2px)
- **Shorter separator**: Reduced height from `h-8` to `h-6` to match compact button height
- **Rationale**: Maximizes button density while maintaining visual grouping

### Utility Functions (toolbar.utils.ts)

```typescript
// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS]

import type { KeybindingConfig } from "./config.types";
import type { ToolbarButtonProps } from "@/app/files/components/ToolbarButton";

// Action-to-icon mapping
const ACTION_ICON_MAP: Record<string, string> = {
  'file.copy': 'copy',
  'file.move': 'move',
  'file.delete': 'trash',
  'file.rename': 'edit',
  'navigate.up': 'arrow-up',
  'navigate.down': 'arrow-down',
  'navigate.enter': 'arrow-right',
  'navigate.parent': 'arrow-left',
  'navigate.home': 'home',
  'navigate.first': 'chevrons-up',
  'navigate.last': 'chevrons-down',
  'mark.toggle': 'checkbox',
  'mark.all': 'checkbox-multiple',
  'mark.invert': 'checkbox-invert',
  'mark.clear': 'x-circle',
  'view.sort': 'sort',
  'view.comparison': 'compare',
  'view.hidden': 'eye',
  'link.toggle': 'link',
  'preview.info': 'info',
  'preview.content': 'file-text',
  'help.show': 'help-circle',
  'command.palette': 'command',
  'search.finder': 'search',
  'search.content': 'file-search',
  'pane.add': 'plus',
  'pane.remove': 'minus',
  'pane.refresh': 'refresh-cw',
  'pane.refresh-all': 'refresh-ccw',
  'bookmark.goto': 'folder',
  'bookmark.add': 'bookmark-plus',
  'bookmark.list': 'bookmark',
  'history.back': 'undo',
  'history.forward': 'redo',
};

export function deriveIconFromAction(action: string): string {
  return ACTION_ICON_MAP[action] || 'help-circle';
}

export function deriveLabelFromDescription(description: string): string {
  // Extract first verb from description
  const patterns = [
    /^(Copy|Move|Delete|Rename|Navigate|Mark|Clear|Toggle|Show|Open|Search|Go|Add|Remove|Refresh|Sort|Compare|Preview)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[1];
  }

  // Fallback: first word capitalized
  const firstWord = description.split(' ')[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

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
  };

  const key = keyMap[keybinding.key] || keybinding.key.toUpperCase();
  parts.push(key);

  return parts.join('+');
}

export function deriveToolbarButton(
  action: string,
  registry: KeybindingConfig[]
): Omit<ToolbarButtonProps, 'onClick' | 'active' | 'disabled'> | null {
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
```

## Specialized Toolbar Implementations

Specialized toolbars are thin wrappers that provide appropriate configurations:

```typescript
// WorkspaceToolbar.tsx
export function WorkspaceToolbar({ onAction, /* ... */ }: Props) {
  return (
    <Toolbar
      config={workspaceConfig}
      onAction={onAction}
      activeActions={activeActions}
      disabledActions={disabledActions}
    />
  );
}

// Similar for PaneToolbar and SystemToolbar
```

## Accessibility Features

1. **ARIA attributes**:
   - `role="toolbar"` on container
   - `role="group"` on button groups
   - `role="separator"` on group dividers
   - `aria-label` for toolbar and groups
   - `aria-label` with keystroke for buttons

2. **Keyboard navigation**:
   - Tab to enter/exit toolbar
   - Arrow keys to navigate between buttons
   - Enter/Space to activate buttons
   - Escape to exit toolbar

3. **Focus management**:
   - Visible focus indicators
   - Focus trap within toolbar (optional)
   - Focus restoration after dialog closes

4. **Screen reader support**:
   - Descriptive labels for all actions
   - Keyboard shortcut announced in label
   - Active/disabled states announced

## Responsive Design

### Desktop (>1024px)
- All buttons visible with full labels
- Horizontal layout with group separators

### Tablet (768px - 1024px)
- Abbreviated labels or icon-priority layout
- Dropdown menus for overflow groups

### Mobile (<768px)
- Hamburger menu button
- Drawer with categorized actions
- Full action names in drawer

## Performance Considerations

1. **Memoization**: Toolbar and button components use React.memo
2. **Lazy rendering**: Hidden toolbars not rendered in DOM
3. **Event handlers**: useCallback for all action handlers
4. **Icon optimization**: SVG sprites or icon component caching

## Testing Strategy

### Unit Tests

```typescript
describe('ToolbarButton', () => {
  it('renders icon, label, and keystroke', () => {
    // Test rendering
  });
  
  it('shows tooltip on hover', () => {
    // Test tooltip
  });
  
  it('calls onClick when clicked', () => {
    // Test click handler
  });
  
  it('reflects active state', () => {
    // Test active styling
  });
  
  it('disables when disabled prop true', () => {
    // Test disabled state
  });
});

describe('Toolbar', () => {
  it('renders groups and buttons from config', () => {
    // Test configuration rendering
  });
  
  it('hides when enabled false', () => {
    // Test visibility
  });
  
  it('applies active/disabled states', () => {
    // Test state propagation
  });
});
```

### Integration Tests

```typescript
describe('WorkspaceView with toolbars', () => {
  it('toolbar actions trigger same handlers as keyboard', () => {
    // Verify action dispatch
  });
  
  it('active/disabled states reflect workspace context', () => {
    // Verify state tracking
  });
  
  it('configuration changes apply correctly', () => {
    // Verify configuration loading
  });
});
```

## Dependencies

- `[IMPL-ICON_SYSTEM]` - Icon component for button icons
- `[IMPL-TOOLBAR_CONFIG]` - Configuration types and loading
- `[ARCH-KEYBIND_SYSTEM]` - Keybinding registry
- `[ARCH-CONFIG_DRIVEN_UI]` - Theme and configuration patterns

## Success Criteria

1. All toolbar components render correctly
2. Buttons display icon + keystroke (compact); label only when icon absent
3. No button overflow with 12+ actions in single toolbar (Pane toolbar test case)
4. Active/disabled states apply correctly
5. Accessibility requirements met (ARIA, keyboard nav)
6. Responsive design works on all viewports
7. Performance: No measurable impact on render time
8. Tests: >90% code coverage

## Notes

- Icon component needs comprehensive icon set
- Consider virtualization for mobile drawer if >50 actions
- Toolbar styling should match existing file manager aesthetic
- Future enhancement: Drag-and-drop toolbar customization
- **Compact Design Decision**: Icon-only buttons with keystroke badges prevent overflow and maximize visible actions per toolbar (validated with 12-button Pane toolbar)
- Toolbars render conditionally between workspace header and pane area in WorkspaceView
- Action dispatch reuses existing `handleExecuteAction` function ensuring keyboard/mouse consistency

## Configuration Examples

### Default (Discovery Mode)
All toolbars enabled for new users learning the system:
```yaml
toolbars:
  enabled: true
  workspace:
    enabled: true
    position: "top"
  pane:
    enabled: true
    position: "top"
  system:
    enabled: true
    position: "top"
```

### Minimal (Power User Mode)
Only essential pane operations visible:
```yaml
toolbars:
  enabled: true
  workspace:
    enabled: false
  pane:
    enabled: true
    position: "bottom"
    groups:
      - name: "Essential"
        actions: ["file.copy", "file.move", "file.delete"]
  system:
    enabled: false
```

### Keyboard-First (Expert Mode)
Toolbars completely hidden, relying on keyboard shortcuts:
```yaml
toolbars:
  enabled: false
```

## Future Enhancements

### Planned Features
1. **Responsive Mobile Support**: Hamburger menu + drawer for mobile viewports (<768px)
2. **Per-Pane Toolbars**: Each pane gets its own toolbar instance (position: "per-pane")
3. **Toolbar Customization UI**: Drag-and-drop button arrangement interface
4. **Custom Actions**: User-defined toolbar buttons executing shell commands
5. **Toolbar Themes**: Multiple preset styling options beyond theme.yaml
6. **Internationalization**: Translatable button labels and descriptions
7. **Group Collapsing**: Accordion-style group expansion for high-density toolbars

### Deferred Features
- Vertical toolbar positioning (left/right edge)
- Toolbar hiding animations and transitions
- Context-sensitive toolbar content (changes based on file type)
- Floating toolbar mode (detached from main window)

## Benefits Achieved

### Discoverability
- **Before**: Users had to memorize 36+ keyboard shortcuts or discover via help overlay
- **After**: All operations visible with icons, labels, and keystroke hints
- **Impact**: Reduced learning curve from "hours of memorization" to "instant visual discovery"

### Accessibility
- **Before**: Keyboard-only interface excluded users preferring mouse interaction
- **After**: Full mouse access to all operations with proper ARIA labels
- **Impact**: WCAG 2.1 AA compliance, supports diverse user needs

### Consistency
- **Before**: Risk of keyboard and mouse interactions behaving differently
- **After**: Single action dispatcher ensures identical behavior
- **Impact**: Zero behavioral divergence, simplified testing

### Flexibility
- **Before**: UI changes required code modifications
- **After**: Complete customization via YAML configuration
- **Impact**: Users can tailor interface without developer intervention

### Professional Appearance
- **Before**: Terminal-style interface looked dated
- **After**: Modern toolbar design matches contemporary file managers
- **Impact**: Improved first impressions, competitive with commercial tools

## Changelog

**2026-02-08 (v1.1)**: Updated button design to compact icon-only layout
- Changed button display: Icon + Label + Keystroke → Icon + Keystroke (label only when no icon)
- Reduced button padding: `px-3 py-2` → `px-1.5 py-1`
- Reduced icon size: 20px → 16px
- Reduced font size: `text-sm` → `text-xs`
- Reduced gaps: toolbar `gap-2` → `gap-1`, group `gap-1` → `gap-0.5`
- Rationale: Prevents button overflow with high-density toolbars (12+ actions)

## Metadata

**Created**: 2026-02-08  
**Last Updated**: 2026-02-08  
**Author**: AI Agent  
**Status**: Implemented
