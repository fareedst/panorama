# IMPL-PANE_REFRESH essence pseudocode

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Top-level Manual Pane Refresh Implementation: Add Ctrl+R and Ctrl+Shift+R keybindings, handlers call handleNavigate with current path

## Summary contract

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-PANE_REFRESH
  DATA: state and configuration per implementation_approach

## ConfigFilesYaml

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Add pane.refresh (Ctrl+R) and pane.refresh-all (Ctrl+Shift+R) keybindings

CONTRACT ConfigFilesYaml
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_ConfigFilesYaml(context)
  // Add pane.refresh (Ctrl+R)
  CALL Add pane.refresh (Ctrl+R)
  // pane.refresh-all (Ctrl+Shift+R) keybindings
  CALL pane.refresh-all (Ctrl+Shift+R) keybindings

## HandleNavigateAlreadyProvides

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: fetch from /api/files, sortFiles application, cursor restoration

CONTRACT HandleNavigateAlreadyProvides
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_HandleNavigateAlreadyProvides(context)
  // fetch from /api/files
  CALL fetch from /api/files
  // sortFiles application
  CALL sortFiles application
  // cursor restoration
  CALL cursor restoration

## WorkspaceViewTsxActionHandlers

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: pane.refresh calls handleNavigate(focusIndex, pane.path)

CONTRACT WorkspaceViewTsxActionHandlers
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_WorkspaceViewTsxActionHandlers(context)
  // pane.refresh calls handleNavigate(focusIndex
  CALL pane.refresh calls handleNavigate(focusIndex
  // pane.path)
  CALL pane.path)

## BothActionsInPane

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Both actions in pane-management category for organization

CONTRACT BothActionsInPane
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_BothActionsInPane(context)
  // Both actions in pane-management category for organization
  CALL Both actions in pane-management category for organization
  ON invalid input OR missing data THEN RETURN without mutation

## MarksClearedAutomaticallyExisting

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Marks cleared automatically (existing handleNavigate behavior)

CONTRACT MarksClearedAutomaticallyExisting
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_MarksClearedAutomaticallyExisting(context)
  // Marks cleared automatically (existing handleNavigate behavior)
  CALL Marks cleared automatically (existing handleNavigate behavior)
  ON invalid input OR missing data THEN RETURN without mutation

## NoChangesNeededTo

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: No changes needed to useMemo dependencies (handleNavigate and panes already included)

CONTRACT NoChangesNeededTo
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_NoChangesNeededTo(context)
  // No changes needed to useMemo dependencies (handleNavigate
  CALL No changes needed to useMemo dependencies (handleNavigate
  // panes already included)
  CALL panes already included)

## PaneRefreshAllUses

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: pane.refresh-all uses Promise.all(panes.map((p, idx) => handleNavigate(idx, p.path)))

CONTRACT PaneRefreshAllUses
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_REFRESH_PaneRefreshAllUses(context)
  // pane.refresh-all uses Promise.all(panes.map((p
  CALL pane.refresh-all uses Promise.all(panes.map((p
  // idx) => handleNavigate(idx
  CALL idx) => handleNavigate(idx
  // p.path)))
  CALL p.path)))

## CodeLocations

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — Added pane.refresh and pane.refresh-all keybinding definitions
// FILE: src/app/files/WorkspaceView.tsx — Added refresh action handlers in actionHandlers Map
// FUNCTION: pane.refresh handler in src/app/files/WorkspaceView.tsx
// FUNCTION: pane.refresh-all handler in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-PANE_REFRESH_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
