# IMPL-TOOLBAR_COMPONENT essence pseudocode

## ACTIONS_META_PASS_THROUGH

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [IMPL-FILE_COLUMN_CONFIG]: how: WorkspaceView passes toolbars.actions to Toolbar via actionsMeta on workspace/pane/system tiers and compact merged row

```
PROCEDURE ACTIONS_META_PASS_THROUGH(context)
  Toolbar props include actionsMeta?: Record<string, ToolbarActionMeta>
  FOR each action in group.actions CALL deriveToolbarButton(action, keybindings, actionsMeta)
  WorkspaceToolbar PaneToolbar SystemToolbar forward actionsMeta unchanged
```

## ICON_REGISTRY

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: how: merge lucide-icons and panorama-icons in registry.ts; Icon component resolves getIconPaths; unmapped names render icon-unknown and warn in development

```
PROCEDURE ICON_REGISTRY(context)
  ICON_REGISTRY := merge(LUCIDE_ICONS, PANORAMA_ICONS)
  getIconPaths(name) RETURNS SVG children or null
  isIconRegistered(name) RETURNS name in ICON_REGISTRY
  getReferencedToolbarIconNames() := union(ACTION_ICON_MAP values, TOOLBAR_ACTIONS_ICON_NAMES)
  deriveIconFromAction(action) RETURNS ACTION_ICON_MAP[action] OR "icon-unknown"
  Icon(name) IF NOT isIconRegistered(name) THEN warn AND render icon-unknown
```

### ICON_REGISTRY_NSYNC_MULTI_PANE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM] [REQ-NSYNC_MULTI_TARGET]: how: ACTION_ICON_MAP maps file.copyAll and file.moveAll to panorama-icons copy-all and move-all so pane toolbar NSYNC actions are distinct from help.show (help-circle)

```
PROCEDURE ICON_REGISTRY_NSYNC_MULTI_PANE(context)
  ACTION_ICON_MAP["file.copyAll"] := "copy-all"
  ACTION_ICON_MAP["file.moveAll"] := "move-all"
  PANORAMA_ICONS registers copy-all and move-all glyphs
```

## DERIVE_TOOLBAR_BUTTON_FALLBACK

// [IMPL-TOOLBAR_COMPONENT] [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: how: deriveToolbarButton uses keybinding registry first; else toolbars.actions description/icon/label for toolbar-only actions such as view.columns

```
PROCEDURE DERIVE_TOOLBAR_BUTTON_FALLBACK(context)
  IF keybinding exists for action THEN icon label shortcut from registry
  ELSE IF actionsMeta[action] THEN use description icon label; shortcut undefined
  deriveIconFromAction(unmapped) RETURNS "icon-unknown" NOT "help-circle"
  ToolbarButton renders icon-only when no shortcut; title from description
```

## TOOLBAR_COMPACT_TOGGLE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle on first top toolbar switches session toolbarExpanded state; expanded shows three tiers with keystroke badges; compact shows merged single row icon-only; tooltips unchanged

```
CONTRACT ToolbarCompactToggle
  INPUT: toolbarExpanded boolean, onToggle callback
  OUTPUT: ToolbarCompactToggle button at leading slot
  DATA: aria-pressed, data-testid toolbar-compact-toggle

PROCEDURE TOOLBAR_COMPACT_TOGGLE(context)
  RENDER ToolbarCompactToggle with chevrons-up when expanded, chevrons-down when compact
  ON click TOGGLE toolbarExpanded in WorkspaceView
  KEEP button title and aria-label keystroke-free (UI-only control)
```

## MERGE_TOP_TOOLBARS

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: mergeTopToolbarConfigs concatenates enabled top-position workspace, pane, system groups for compact single-row render

```
CONTRACT MergeTopToolbars
  INPUT: ToolbarsConfig from server
  OUTPUT: merged ToolbarConfig or null
  DATA: workspace, pane, system tier groups

PROCEDURE MERGE_TOP_TOOLBARS(context)
  FILTER tiers WHERE enabled AND position == top
  CONCAT groups IN ORDER workspace, pane, system
  IF no groups THEN RETURN null
  RETURN merged ToolbarConfig for compact Toolbar render
```

## WORKSPACE_TOOLBAR_DISPLAY_MODE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: WorkspaceView useState(false) defaults to compact; expanded renders up to three top tiers with toggle on first visible tier; compact renders single merged Toolbar with showKeystroke=false and singleRow; pane bounds use useElementSize on workspace-area ref

```
CONTRACT WorkspaceToolbarDisplayMode
  INPUT: toolbars config, toolbarExpanded boolean, mergedToolbarConfig from mergeTopToolbarConfigs
  OUTPUT: one or three top toolbars plus toggle placement on first visible tier; workspace-area measured dimensions feed calculateLayout
  DATA: showWorkspaceTop, showPaneTop, showSystemTop, toolbarCompactToggle element, workspaceAreaRef, useElementSize deps include toolbarExpanded

PROCEDURE WORKSPACE_TOOLBAR_DISPLAY_MODE(context)
  ATTACH workspaceAreaRef to flex-1 min-h-0 workspace container (no fixed pixel height)
  MEASURE workspace area via useElementSize(workspaceAreaRef, [toolbarExpanded, toolbars.enabled])
  PASS measured width/height to calculateLayout for FilePane bounds
  IF toolbarExpanded THEN
    RENDER WorkspaceToolbar WHEN showWorkspaceTop WITH leadingContent toggle
    RENDER PaneToolbar WHEN showPaneTop WITH leadingContent toggle IF workspace tier not top
    RENDER SystemToolbar WHEN showSystemTop WITH leadingContent toggle IF workspace and pane tiers not top
  ELSE
    IF mergedToolbarConfig THEN
      RENDER Toolbar merged config showKeystroke=false singleRow className toolbar-compact WITH leadingContent toggle
    ENDIF
  ENDIF
  KEEP toolbarExpanded session-only (not persisted to URL or mesh snapshot)
```

## CodeLocations

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// src/app/files/components/ToolbarCompactToggle.tsx, Toolbar.tsx, ToolbarButton.tsx, WorkspaceToolbar.tsx, PaneToolbar.tsx, SystemToolbar.tsx, src/lib/toolbar.utils.ts, src/components/icons/*, src/components/Icon.tsx, src/lib/useElementSize.ts, src/app/files/WorkspaceView.tsx; tests registry.test.ts, toolbar.utils.test.ts, useElementSize.test.ts, Toolbar*.test.tsx, WorkspaceView.toolbar-compact.test.tsx
