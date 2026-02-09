# REQ-TOOLBAR_CONFIG: Configuration-Driven Toolbar Customization

**Status**: Planned  
**Priority**: P1 (Important)  
**Category**: Functional  
**Created**: 2026-02-08

## Overview

Toolbar behavior, appearance, and content must be fully configurable via YAML configuration files without requiring code changes. This requirement ensures the file manager toolbar system adheres to the project's configuration-driven architecture.

## Rationale

### Why

To maintain consistency with the existing configuration-driven UI architecture (`[REQ-CONFIG_DRIVEN_UI]`) and enable users to customize toolbar functionality without modifying source code.

### Problems Solved

- **Hard-coded toolbar layout**: Users cannot adjust toolbar visibility or position
- **Fixed button selection**: Users cannot choose which operations appear in toolbars
- **Inflexible styling**: Toolbar appearance cannot be customized without code changes
- **Template rigidity**: Project cannot serve as customizable template with fixed toolbars

### Benefits

- **Zero code changes**: All toolbar customization via configuration files
- **Template flexibility**: Project can be forked and customized for different use cases
- **Easy experimentation**: A/B testing of toolbar layouts without deployments
- **Internationalization ready**: Button labels configurable for translation

## Satisfaction Criteria

1. **Complete configurability**: Toolbar visibility, position, button selection, grouping, and styling all configurable
2. **YAML schema**: Well-defined, documented configuration schema in `config/files.yaml` and `config/theme.yaml`
3. **Type safety**: TypeScript interfaces for all configuration structures
4. **Graceful defaults**: Sensible default configuration when custom config omitted
5. **Validation**: Configuration validation with helpful error messages

## Configuration Schema

### files.yaml Structure

```yaml
# [REQ-TOOLBAR_CONFIG] Toolbar configuration
toolbars:
  # Global enable/disable
  enabled: boolean
  
  # Workspace toolbar configuration
  workspace:
    enabled: boolean
    position: "top" | "bottom" | "hidden"
    groups:
      - name: string
        actions: string[]
  
  # Pane toolbar configuration
  pane:
    enabled: boolean
    position: "top" | "bottom" | "hidden" | "per-pane"
    groups:
      - name: string
        actions: string[]
  
  # System toolbar configuration
  system:
    enabled: boolean
    position: "top" | "bottom" | "hidden"
    groups:
      - name: string
        actions: string[]
```

### theme.yaml Structure

```yaml
files:
  toolbar:
    background: string  # Tailwind classes
    border: string      # Tailwind classes
    buttonBase: string  # Tailwind classes for normal state
    buttonActive: string  # Tailwind classes for active state
    buttonDisabled: string  # Tailwind classes for disabled state
    groupSeparator: string  # Tailwind classes for group dividers
  
  overrides:
    toolbar: string  # Additional classes for toolbar container
    toolbarGroup: string  # Additional classes for button groups
    toolbarButton: string  # Additional classes for individual buttons
```

## Functional Requirements

### FR-1: Global Enable/Disable

- `toolbars.enabled: false` hides entire toolbar system
- Individual toolbar types can be independently enabled/disabled
- When disabled, no toolbar markup rendered (not just hidden via CSS)

### FR-2: Position Configuration

Each toolbar type supports:
- `"top"`: Render at top of workspace
- `"bottom"`: Render at bottom of workspace
- `"hidden"`: Enabled but not displayed (for programmatic control)
- `"per-pane"`: (Pane toolbar only) Each pane gets its own toolbar

### FR-3: Action Grouping

- Groups organize related actions with visual separators
- Group names displayed as section labels or aria-labels
- Empty groups automatically omitted from rendering
- Actions reference keybinding action names (e.g., "file.copy")

### FR-4: Button Configuration

Each action automatically derives:
- **Icon**: Mapped from action name via icon system
- **Label**: Taken from keybinding description
- **Keystroke**: Derived from keybinding key + modifiers
- **Tooltip**: Full description from keybinding registry

Configuration can override these with explicit button config:

```yaml
buttons:
  - action: "file.copy"
    icon: "copy"  # optional override
    label: "Copy Files"  # optional override
    showKeystroke: false  # optional, hide keystroke
```

### FR-5: Theme Integration

Toolbar styling follows existing theme patterns:
- Uses theme colors (light/dark mode aware)
- Applies font families from theme config
- Respects spacing and sizing tokens
- Supports class overrides for advanced customization

### FR-6: Defaults and Fallbacks

When configuration omitted:
- Default: All toolbars enabled at top position
- Default: Comprehensive action groups covering all keybindings
- Default: Theme styling matches existing file manager aesthetic
- Invalid config: Log warning, use defaults, continue execution

## TypeScript Type Definitions

```typescript
// [IMPL-TOOLBAR_CONFIG] Configuration types

export interface ToolbarButtonOverride {
  action: string;
  icon?: string;
  label?: string;
  showKeystroke?: boolean;
}

export interface ToolbarGroupConfig {
  name: string;
  actions: string[];
}

export type ToolbarPosition = 'top' | 'bottom' | 'hidden' | 'per-pane';

export interface ToolbarConfig {
  enabled: boolean;
  position: ToolbarPosition;
  groups: ToolbarGroupConfig[];
  buttons?: ToolbarButtonOverride[];  // Optional explicit config
}

export interface ToolbarsConfig {
  enabled: boolean;
  workspace: ToolbarConfig;
  pane: ToolbarConfig;
  system: ToolbarConfig;
}

export interface ToolbarThemeConfig {
  background: string;
  border: string;
  buttonBase: string;
  buttonActive: string;
  buttonDisabled: string;
  groupSeparator: string;
}
```

## Validation Rules

### Configuration Validation

1. **Required fields**: All boolean `enabled` fields required
2. **Position values**: Must be one of allowed position strings
3. **Action references**: All action names must exist in keybinding registry
4. **Group structure**: Groups must have name and non-empty actions array
5. **Theme classes**: Theme strings should be valid Tailwind classes (warning, not error)

### Runtime Validation

- Validate configuration at server startup
- Log warnings for invalid actions (don't crash)
- Fall back to defaults for malformed sections
- Provide helpful error messages with config file line numbers when possible

## Example Configurations

### Minimal Configuration

```yaml
# Minimal: use all defaults
toolbars:
  enabled: true
```

### Custom Layout Configuration

```yaml
# Custom: specific actions, bottom position
toolbars:
  enabled: true
  
  workspace:
    enabled: true
    position: "bottom"
    groups:
      - name: "Quick Actions"
        actions: ["pane.refresh-all", "link.toggle"]
  
  pane:
    enabled: true
    position: "top"
    groups:
      - name: "Essential"
        actions: ["file.copy", "file.move", "file.delete"]
  
  system:
    enabled: false
```

### Power User Configuration

```yaml
# Power user: minimal toolbar, keyboard-focused
toolbars:
  enabled: true
  
  workspace:
    enabled: false
  
  pane:
    enabled: true
    position: "bottom"
    groups:
      - name: "Quick"
        actions: ["file.copy", "file.move"]
    buttons:
      - action: "file.copy"
        showKeystroke: false  # Hide keystrokes (they know them)
  
  system:
    enabled: true
    position: "top"
    groups:
      - name: "Help"
        actions: ["help.show"]
```

## Dependencies

- `[REQ-TOOLBAR_SYSTEM]` - Parent toolbar requirement
- `[REQ-CONFIG_DRIVEN_UI]` - Configuration-driven architecture
- `[ARCH-CONFIG_DRIVEN_UI]` - Configuration loading patterns
- `[ARCH-KEYBIND_SYSTEM]` - Keybinding registry for action definitions

## Traceability

### Architecture

- `[ARCH-TOOLBAR_LAYOUT]` - Layout and positioning architecture
- `[ARCH-CONFIG_DRIVEN_UI]` - Configuration loading architecture

### Implementation

- `[IMPL-TOOLBAR_CONFIG]` - Configuration loader implementation
- `[IMPL-CONFIG_LOADER]` - Existing config loading utilities

### Tests

- `src/lib/config.test.ts` - Configuration schema validation
- `src/app/files/components/Toolbar.test.tsx` - Configuration application tests

## Success Metrics

1. **Zero code changes**: Toolbar customization requires only YAML edits
2. **Type safety**: TypeScript catches configuration errors at build time
3. **Runtime validation**: Invalid config logged with helpful messages
4. **Default quality**: Default configuration provides excellent UX without customization
5. **Documentation**: Configuration options fully documented with examples

## Notes

- Configuration schema should be documented in `config/files.yaml` comments
- TypeScript types provide IDE autocomplete for configuration
- Consider JSON schema for editor validation in future enhancement
