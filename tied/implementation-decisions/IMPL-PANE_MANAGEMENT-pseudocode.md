# IMPL-PANE_MANAGEMENT essence pseudocode

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: Top-level runtime pane management — add/remove/swap/cycle panes, pane order dialog, keybindings and toolbar integration

## Summary contract

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-PANE_MANAGEMENT (add, remove, swap, cycle, arbitrary reorder)
  DATA: panes[], focusIndex, layoutConfig.allowPaneManagement, globalDirectoryHistory, scrollTriggers, paneOrderDialogOpen

## AddPane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: clone focused pane path and sort into new pane when under maxPanes

CONTRACT AddPane
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_MANAGEMENT_AddPane(context)
  IF NOT allowPaneManagement THEN RETURN
  IF maxPanes reached THEN warn and RETURN
  // FETCH files for sourcePane.path
  CALL FETCH files for sourcePane.path
  // APPEND new pane to panes array
  CALL APPEND new pane to panes array
  SET focusIndex to new pane index

## RemovePane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: splice pane and adjust focusIndex

CONTRACT RemovePane
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-PANE_MANAGEMENT_RemovePane(context)
  IF panes.length less than or equal 1 THEN RETURN
  // SPLICE pane at index
  CALL SPLICE pane at index
  IF removed index before focus THEN decrement focusIndex
  IF removed index equals focus THEN focus max zero index minus one

## SwapPanes

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: swap panes[i] and panes[j]; remap focusIndex and directory history; clear scrollTriggers

CONTRACT SwapPanes
  INPUT: pane indices i, j
  OUTPUT: reordered panes[] with focus and history following pane content
  DATA: panes[], focusIndex, globalDirectoryHistory, scrollTriggers

PROCEDURE IMPL-PANE_MANAGEMENT_SwapPanes(context, i, j)
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET panes to swapArrayAt(panes, i, j)
  SET focusIndex to remapFocusIndexAfterSwap(focusIndex, i, j)
  CALL globalDirectoryHistory.swapPaneHistories(i, j)
  CLEAR scrollTriggers

## SwapFocusedNeighbor

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with next/prev neighbor (wrap)

CONTRACT SwapFocusedNeighbor
  INPUT: direction next or prev
  OUTPUT: SwapPanes on computed neighbor indices
  DATA: panes.length, focusIndex, allowPaneManagement

PROCEDURE IMPL-PANE_MANAGEMENT_SwapFocusedNeighbor(context, direction)
  IF panes.length equals 2 THEN CALL SwapPanes(0, 1) RETURN
  IF direction is next THEN j = neighborIndexNext(focusIndex, length)
  ELSE j = neighborIndexPrev(focusIndex, length)
  CALL SwapPanes(focusIndex, j)

## CyclePanes

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: rotate all panes one slot; remap focus and directory history

CONTRACT CyclePanes
  INPUT: direction forward or backward
  OUTPUT: rotated panes[] with focus and history following pane content
  DATA: panes[], focusIndex, globalDirectoryHistory, scrollTriggers

PROCEDURE IMPL-PANE_MANAGEMENT_CyclePanes(context, direction)
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET panes to rotateArray(panes, direction)
  SET focusIndex to remapFocusIndexAfterRotate(focusIndex, length, direction)
  CALL globalDirectoryHistory.rotatePaneHistories(direction, length)
  CLEAR scrollTriggers

## PaneOrderDialogOpen

// [IMPL-PANE_MANAGEMENT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: pane.order (toolbar-only) sets paneOrderDialogOpen without reordering

CONTRACT PaneOrderDialogOpen
  INPUT: action pane.order
  OUTPUT: dialog visible
  DATA: paneOrderDialogOpen

PROCEDURE IMPL-PANE_MANAGEMENT_PaneOrderDialogOpen(context)
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET paneOrderDialogOpen to true

## PaneOrderDialogApply

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Apply reorders panes[] by index permutation from dialog

CONTRACT PaneOrderDialogApply
  INPUT: order array where order[newIndex] = oldIndex
  OUTPUT: permuted panes[] with focus and history following pane content
  DATA: panes[], focusIndex, globalDirectoryHistory, scrollTriggers, paneOrderDialogOpen

PROCEDURE IMPL-PANE_MANAGEMENT_PaneOrderDialogApply(context, order)
  IF NOT allowPaneManagement OR order.length not equal panes.length THEN RETURN
  SET panes to reorderArrayByIndices(panes, order)
  SET focusIndex to order.indexOf(previousFocusPaneIndex)
  CALL globalDirectoryHistory.reorderPaneHistories(order)
  CLEAR scrollTriggers
  SET paneOrderDialogOpen to false

## CodeLocations

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleAddPane, handleRemovePane, handleSwapPanes, handleSwapFocusedNext, handleSwapFocusedPrev, handleCyclePanes, handleApplyPaneOrder, keybinding handlers
// FILE: src/app/files/components/PaneOrderDialog.tsx — pane order dialog UI
// FILE: src/lib/pane-order.ts — swap, rotate, move, focus remap helpers
// FILE: src/lib/files.history.ts — swapPaneHistories, rotatePaneHistories, reorderPaneHistories
// FILE: config/files.yaml — pane reorder keybindings, copy, toolbar actions
// FILE: src/lib/config.types.ts — paneManagement copy keys
// FILE: src/lib/files.keybinds.ts — pane-management category labels and validation
// FILE: src/lib/toolbar.utils.ts — ACTION_ICON_MAP for pane.swap, pane.cycle, pane.order
// TEST: src/lib/pane-order.test.ts
// TEST: src/lib/files.history.test.ts — swapPaneHistories, rotatePaneHistories, reorderPaneHistories
// TEST: src/app/files/components/PaneOrderDialog.test.tsx
// TEST: src/app/files/WorkspaceView.pane-reorder.test.tsx
// FUNCTION: handleAddPane in src/app/files/WorkspaceView.tsx
// FUNCTION: handleRemovePane in src/app/files/WorkspaceView.tsx
// FUNCTION: handleSwapPanes in src/app/files/WorkspaceView.tsx
// FUNCTION: handleSwapFocusedNext in src/app/files/WorkspaceView.tsx
// FUNCTION: handleSwapFocusedPrev in src/app/files/WorkspaceView.tsx
// FUNCTION: handleCyclePanes in src/app/files/WorkspaceView.tsx
// FUNCTION: handleApplyPaneOrder in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-PANE_MANAGEMENT_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
