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

## TOOLBAR_NAMED_LABELS

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: ToolbarButton and TriStateToolbarButton accept showActionLabel; when true render deriveToolbarButton label visibly alongside icon; tooltips unchanged

```
CONTRACT ToolbarNamedLabels
  INPUT: showActionLabel boolean, deriveToolbarButton label string
  OUTPUT: visible Action label span on ToolbarButton and TriStateToolbarButton when showActionLabel true
  DATA: showVisibleLabel := showActionLabel OR NOT icon

PROCEDURE TOOLBAR_NAMED_LABELS(context)
  Toolbar passes showActionLabel from named display mode
  ToolbarButton renders label span when showVisibleLabel
  TriStateToolbarButton renders visible label when showActionLabel else sr-only
  KEEP tooltip and aria-label with shortcut when keystroke exists
```

## TOOLBAR_DISPLAY_PROPS

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: toolbarDisplayProps maps ToolbarDisplayMode to showKeystroke/showActionLabel/singleRow/className; cycleToolbarDisplayMode advances compact → expanded → named → compact

```
CONTRACT ToolbarDisplayProps
  INPUT: ToolbarDisplayMode
  OUTPUT: ToolbarDisplayProps { showKeystroke, showActionLabel, singleRow, mergedClassName?, tierClassName? }

PROCEDURE TOOLBAR_DISPLAY_PROPS(context)
  CASE compact → showKeystroke=false, showActionLabel=false, singleRow=true, mergedClassName=toolbar-compact
  CASE expanded → showKeystroke=true, showActionLabel=false, singleRow=false
  CASE named → showKeystroke=false, showActionLabel=true, singleRow=false, tierClassName=toolbar-named
  cycleToolbarDisplayMode RETURNS next mode in cycle
```

## TOOLBAR_COMPACT_TOGGLE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle on first top toolbar cycles session toolbarDisplayMode compact → expanded → named → compact; expanded shows three tiers with keystroke badges; named shows three tiers with showActionLabel; compact shows merged single row icon-only; tooltips unchanged

```
CONTRACT ToolbarCompactToggle
  INPUT: toolbarDisplayMode ToolbarDisplayMode, onCycle callback
  OUTPUT: ToolbarCompactToggle button at leading slot
  DATA: aria-pressed when compact, data-testid toolbar-compact-toggle, data-toolbar-display-mode

PROCEDURE TOOLBAR_COMPACT_TOGGLE(context)
  RENDER chevrons-down when compact else chevrons-up
  title/aria-label: Expand toolbar | Show action labels | Compact toolbar (next mode on click)
  ON click CYCLE toolbarDisplayMode compact → expanded → named → compact in WorkspaceView
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

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: WorkspaceView useState("compact") defaults to compact; expanded renders up to three top tiers with showKeystroke; named renders three tiers with showActionLabel and showKeystroke=false; compact renders single merged Toolbar; pane bounds use useElementSize on workspace-area ref

```
CONTRACT WorkspaceToolbarDisplayMode
  INPUT: toolbars config, toolbarDisplayMode ToolbarDisplayMode, mergedToolbarConfig from mergeTopToolbarConfigs
  OUTPUT: one or three top toolbars plus toggle placement on first visible tier; workspace-area measured dimensions feed calculateLayout
  DATA: showWorkspaceTop, showPaneTop, showSystemTop, toolbarCompactToggle element, workspaceAreaRef, useElementSize deps include toolbarDisplayMode

PROCEDURE WORKSPACE_TOOLBAR_DISPLAY_MODE(context)
  ATTACH workspaceAreaRef to flex-1 min-h-0 workspace container (no fixed pixel height)
  MEASURE workspace area via useElementSize(workspaceAreaRef, [toolbarDisplayMode, toolbars.enabled])
  PASS measured width/height to calculateLayout for FilePane bounds
  SWITCH toolbarDisplayMode
    CASE compact:
      IF mergedToolbarConfig THEN
        RENDER Toolbar merged showKeystroke=false showActionLabel=false singleRow className toolbar-compact WITH leadingContent toggle
      ENDIF
    CASE expanded:
      RENDER three tiers WITH showKeystroke=true showActionLabel=false AND toggle on first visible top tier
    CASE named:
      RENDER three tiers WITH showKeystroke=false showActionLabel=true className toolbar-named AND toggle on first visible top tier
  ENDSWITCH
  KEEP toolbarDisplayMode session-only (not persisted to URL or mesh snapshot)
```

## CodeLocations

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// src/app/files/components/ToolbarCompactToggle.tsx, Toolbar.tsx, ToolbarButton.tsx, TriStateToolbarButton.tsx, WorkspaceToolbar.tsx, PaneToolbar.tsx, SystemToolbar.tsx, src/lib/toolbar.utils.ts (toolbarDisplayProps, cycleToolbarDisplayMode), src/components/icons/*, src/components/Icon.tsx, src/lib/useElementSize.ts, src/app/files/WorkspaceView.tsx; tests registry.test.ts, toolbar.utils.test.ts, useElementSize.test.ts, Toolbar*.test.tsx, TriStateToolbarButton.test.tsx, WorkspaceView.toolbar-compact.test.tsx
