# IMPL-TOOLBAR_CONFIG essence pseudocode

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: Toolbar configuration types, YAML loading, actions metadata, and three-tier layout schema

## Summary contract

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: how: bound module inputs, outputs, and shared data for toolbar configuration blocks

```
IMPL-TOOLBAR_CONFIG_Summary():
  INPUT: config/files.yaml toolbars section, DEFAULT_FILES_CONFIG
  OUTPUT: resolved ToolbarsConfig on FilesConfig; tier visibility inputs for UI
  DATA: ToolbarsConfig, ToolbarConfig, ToolbarGroupConfig, ToolbarActionMeta
  PRE: config loader and types module available
  POST: getFilesConfig returns merged toolbars when present in YAML
  EFFECTS: State (module cache), IO (YAML read)
  TERMINATION: total
```

## TOOLBAR_CONFIG_TYPES

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: how: TypeScript interfaces in config.types.ts define toolbar position, groups, per-tier config, and toolbars.actions metadata map

```
IMPL-TOOLBAR_CONFIG_ToolbarConfigTypes():
  INPUT: none (compile-time schema)
  OUTPUT: ToolbarsConfig, ToolbarConfig, ToolbarGroupConfig, ToolbarActionMeta, ToolbarPosition, ToolbarButtonOverride
  DATA: ToolbarPosition := top | bottom | hidden | per-pane
  PRE: config.types.ts module compiled
  POST: exported interfaces describe workspace, pane, system tiers and actions map
  EFFECTS: pure (types)
  TERMINATION: total
  ToolbarGroupConfig := { name: string, actions: string[] }
  ToolbarConfig := { enabled, position, groups[], buttons? }
  ToolbarActionMeta := { description, label?, icon? }
  ToolbarsConfig := { enabled, workspace: ToolbarConfig, pane: ToolbarConfig, system: ToolbarConfig, actions?: Record<string, ToolbarActionMeta> }
  FilesConfig.toolbars?: ToolbarsConfig
```

## LOAD_TOOLBARS_FROM_FILES_YAML

// [IMPL-TOOLBAR_CONFIG] [IMPL-CONFIG_LOADER] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: getFilesConfig reads config/files.yaml toolbars section, deep-merges with DEFAULT_FILES_CONFIG (toolbars omitted in defaults), caches result

```
IMPL-TOOLBAR_CONFIG_LoadToolbarsFromFilesYaml():
  INPUT: config/files.yaml on disk
  OUTPUT: FilesConfig.toolbars resolved ToolbarsConfig
  DATA: DEFAULT_FILES_CONFIG (no toolbars key), deepMerge, module cache _filesConfig
  PRE: config path readable or absent
  POST: merged config cached; toolbars returned when present in YAML
  EFFECTS: State, IO
  FAILURE_MODES: missing file OR parse error → warning log and defaults-only merge
  TERMINATION: total
  userYaml := readYamlFile("config/files.yaml")
  merged := deepMerge(DEFAULT_FILES_CONFIG, userYaml)
  CACHE merged AS _filesConfig
  RETURN merged.toolbars WHEN present in YAML ELSE undefined
  ON missing file OR parse error LOG warning AND use defaults-only merge
```

## TOOLBAR_ACTIONS_META

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_CONFIG] [REQ-TOOLBAR_SYSTEM]: how: toolbars.actions supplies description/icon/label for toolbar-only actions (view.columns, compare-filter tri-state, pane.order) consumed by deriveToolbarButton via actionsMeta prop

```
IMPL-TOOLBAR_CONFIG_ToolbarActionsMeta():
  INPUT: toolbars.actions map from YAML
  OUTPUT: ToolbarActionMeta entries keyed by action id
  DATA: passed from FilesPage → WorkspaceView → Toolbar tiers as actionsMeta
  PRE: toolbars.actions defined in merged config
  POST: deriveToolbarButton resolves toolbar-only actions without keybinding rows
  EFFECTS: pure (prop pass-through)
  TERMINATION: total
  FOR each action id IN toolbars.actions
    STORE { description, icon?, label? }
  WorkspaceView passes toolbars.actions unchanged to WorkspaceToolbar, PaneToolbar, SystemToolbar, compact Toolbar
  deriveToolbarButton(action, keybindings, actionsMeta) uses meta WHEN no keybinding row exists
```

## THREE_TIER_TOOLBAR_LAYOUT

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_CONFIG] [REQ-TOOLBAR_SYSTEM]: how: YAML defines workspace, pane, and system tiers each with enabled, position, and named action groups; WorkspaceView renders tiers per IMPL-TOOLBAR_COMPONENT display mode

```
IMPL-TOOLBAR_CONFIG_ThreeTierToolbarLayout():
  INPUT: ToolbarsConfig from getFilesConfig
  OUTPUT: tier visibility and group action lists for UI
  DATA: workspace tier (layout/mesh), pane tier (file ops), system tier (help/search)
  PRE: toolbars.enabled true for any tier render
  POST: each enabled tier exposes position and group action id lists
  EFFECTS: pure (config read)
  TERMINATION: total
  IF NOT toolbars.enabled THEN skip all toolbar render
  FOR tier IN [workspace, pane, system]
    tier.enabled AND tier.position control which Toolbar wrapper renders
    tier.groups[] lists action id strings referencing keybindings OR toolbars.actions
  theme.files.toolbars optional styling keys (ToolbarThemeConfig) for future class overrides
```

## CodeLocations

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: map implementing and verifying source files for this IMPL

// config/files.yaml toolbars section; src/lib/config.types.ts ToolbarsConfig types; src/lib/config.ts getFilesConfig; src/lib/toolbar.utils.ts deriveToolbarButton actionsMeta fallback; src/app/files/page.tsx passes toolbars prop; tests config.test.ts getFilesConfig, toolbar.utils.test.ts deriveToolbarButton with actionsMeta, WorkspaceView.file-columns.test.tsx mockToolbars
