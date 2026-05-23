# IMPL-TOOLBAR_COMPONENT essence pseudocode

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design

## Summary contract

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-TOOLBAR_COMPONENT
  DATA: state and configuration per implementation_approach

## MainBehavior

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: React components for toolbar system including base and specialized toolbars with compact icon-only button design

CONTRACT MainBehavior
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-TOOLBAR_COMPONENT_MainBehavior(context)
  // STEP 1: React components for toolbar system including base and specialized toolbars with compact icon-only button design
  CALL STEP 1: React components for toolbar system including base and specialized toolbars with compact icon-only button design
  ON error LOG diagnostic with token refs

## TOOLBAR_COMPACT_TOGGLE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle on first top toolbar switches session toolbarExpanded state; expanded shows three tiers with keystroke badges; compact shows merged single row icon-only; tooltips unchanged

CONTRACT ToolbarCompactToggle
  INPUT: toolbarExpanded boolean, onToggle callback
  OUTPUT: ToolbarCompactToggle button at leading slot
  DATA: aria-pressed, data-testid toolbar-compact-toggle

PROCEDURE IMPL-TOOLBAR_COMPONENT_ToolbarCompactToggle(context)
  RENDER ToolbarCompactToggle with chevrons-up when expanded, chevrons-down when compact
  ON click TOGGLE toolbarExpanded in WorkspaceView
  KEEP button title and aria-label keystroke-free (UI-only control)

## MERGE_TOP_TOOLBARS

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: mergeTopToolbarConfigs concatenates enabled top-position workspace, pane, system groups for compact single-row render

CONTRACT MergeTopToolbars
  INPUT: ToolbarsConfig from server
  OUTPUT: merged ToolbarConfig or null
  DATA: workspace, pane, system tier groups

PROCEDURE IMPL-TOOLBAR_COMPONENT_MergeTopToolbars(context)
  FILTER tiers WHERE enabled AND position == top
  CONCAT groups IN ORDER workspace, pane, system
  IF no groups THEN RETURN null
  RETURN merged ToolbarConfig for compact Toolbar render

## WORKSPACE_TOOLBAR_DISPLAY_MODE

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: WorkspaceView branches on toolbarExpanded; expanded renders up to three top tiers with toggle on first visible tier; compact renders single merged Toolbar with showKeystroke=false and singleRow; pane bounds use useElementSize(ResizeObserver) on workspace-area ref so toolbar height changes re-layout panes instead of clipping bottom

CONTRACT WorkspaceToolbarDisplayMode
  INPUT: toolbars config, toolbarExpanded boolean, mergedToolbarConfig from mergeTopToolbarConfigs
  OUTPUT: one or three top toolbars plus toggle placement on first visible tier; workspace-area measured dimensions feed calculateLayout
  DATA: showWorkspaceTop, showPaneTop, showSystemTop, toolbarCompactToggle element, workspaceAreaRef, useElementSize deps include toolbarExpanded

PROCEDURE IMPL-TOOLBAR_COMPONENT_WorkspaceToolbarDisplayMode(context)
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

## CodeLocations

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// src/app/files/components/ToolbarCompactToggle.tsx, Toolbar.tsx, ToolbarButton.tsx, WorkspaceToolbar.tsx, PaneToolbar.tsx, SystemToolbar.tsx, src/lib/toolbar.utils.ts, src/lib/useElementSize.ts, src/app/files/WorkspaceView.tsx; tests toolbar.utils.test.ts, useElementSize.test.ts, Toolbar*.test.tsx, WorkspaceView.toolbar-compact.test.tsx

## ErrorHandling

// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-TOOLBAR_COMPONENT_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
