# IMPL-TOOLBAR_CONFIG essence pseudocode

## TOOLBAR_CONFIG_TYPES

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: how: TypeScript interfaces in config.types.ts define toolbar position, groups, per-tier config, and toolbars.actions metadata map

```
CONTRACT ToolbarConfigTypes
  INPUT: none (compile-time schema)
  OUTPUT: ToolbarsConfig, ToolbarConfig, ToolbarGroupConfig, ToolbarActionMeta, ToolbarPosition, ToolbarButtonOverride
  DATA: ToolbarPosition := top | bottom | hidden | per-pane

PROCEDURE TOOLBAR_CONFIG_TYPES
  ToolbarGroupConfig := { name: string, actions: string[] }
  ToolbarConfig := { enabled, position, groups[], buttons? }
  ToolbarActionMeta := { description, label?, icon? }
  ToolbarsConfig := { enabled, workspace: ToolbarConfig, pane: ToolbarConfig, system: ToolbarConfig, actions?: Record<string, ToolbarActionMeta> }
  FilesConfig.toolbars?: ToolbarsConfig
```

## LOAD_TOOLBARS_FROM_FILES_YAML

// [IMPL-TOOLBAR_CONFIG] [IMPL-CONFIG_LOADER] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: getFilesConfig reads config/files.yaml toolbars section, deep-merges with DEFAULT_FILES_CONFIG (toolbars omitted in defaults), caches result

```
CONTRACT LoadToolbarsFromFilesYaml
  INPUT: config/files.yaml on disk
  OUTPUT: FilesConfig.toolbars resolved ToolbarsConfig
  DATA: DEFAULT_FILES_CONFIG (no toolbars key), deepMerge, module cache _filesConfig

PROCEDURE LOAD_TOOLBARS_FROM_FILES_YAML
  userYaml := readYamlFile("config/files.yaml")
  merged := deepMerge(DEFAULT_FILES_CONFIG, userYaml)
  CACHE merged AS _filesConfig
  RETURN merged.toolbars WHEN present in YAML ELSE undefined
  ON missing file OR parse error LOG warning AND use defaults-only merge
```

## TOOLBAR_ACTIONS_META

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_CONFIG] [REQ-TOOLBAR_SYSTEM]: how: toolbars.actions supplies description/icon/label for toolbar-only actions (view.columns, compare-filter tri-state, pane.order) consumed by deriveToolbarButton via actionsMeta prop

```
CONTRACT ToolbarActionsMeta
  INPUT: toolbars.actions map from YAML
  OUTPUT: ToolbarActionMeta entries keyed by action id
  DATA: passed from FilesPage → WorkspaceView → Toolbar tiers as actionsMeta

PROCEDURE TOOLBAR_ACTIONS_META
  FOR each action id IN toolbars.actions
    STORE { description, icon?, label? }
  WorkspaceView passes toolbars.actions unchanged to WorkspaceToolbar, PaneToolbar, SystemToolbar, compact Toolbar
  deriveToolbarButton(action, keybindings, actionsMeta) uses meta WHEN no keybinding row exists
```

## THREE_TIER_TOOLBAR_LAYOUT

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_CONFIG] [REQ-TOOLBAR_SYSTEM]: how: YAML defines workspace, pane, and system tiers each with enabled, position, and named action groups; WorkspaceView renders tiers per IMPL-TOOLBAR_COMPONENT display mode

```
CONTRACT ThreeTierToolbarLayout
  INPUT: ToolbarsConfig from getFilesConfig
  OUTPUT: tier visibility and group action lists for UI
  DATA: workspace tier (layout/mesh), pane tier (file ops), system tier (help/search)

PROCEDURE THREE_TIER_TOOLBAR_LAYOUT
  IF NOT toolbars.enabled THEN skip all toolbar render
  FOR tier IN [workspace, pane, system]
    tier.enabled AND tier.position control which Toolbar wrapper renders
    tier.groups[] lists action id strings referencing keybindings OR toolbars.actions
  theme.files.toolbars optional styling keys (ToolbarThemeConfig) for future class overrides
```

## CodeLocations

// [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-CONFIG_DRIVEN_UI] [REQ-TOOLBAR_CONFIG]: map implementing and verifying source files for this IMPL

// config/files.yaml toolbars section; src/lib/config.types.ts ToolbarsConfig types; src/lib/config.ts getFilesConfig; src/lib/toolbar.utils.ts deriveToolbarButton actionsMeta fallback; src/app/files/page.tsx passes toolbars prop; tests config.test.ts getFilesConfig, toolbar.utils.test.ts deriveToolbarButton with actionsMeta, WorkspaceView.file-columns.test.tsx mockToolbars
