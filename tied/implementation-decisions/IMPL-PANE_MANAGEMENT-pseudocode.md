# IMPL-PANE_MANAGEMENT essence pseudocode

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: Runtime pane add/remove/swap/cycle/reorder with config guards, keybindings, and directory history following pane content

## Summary contract

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: how: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: layoutConfig { allowPaneManagement, maxPanes }, panes[], focusIndex, sharedSort, displaySpecStore
  OUTPUT: mutated panes[], focusIndex, globalDirectoryHistory, scrollTriggers cleared on reorder
  DATA: pane-order.ts helpers; PaneOrderDialog permutation array
  CONTROL: minimum one pane; reorder disabled when allowPaneManagement false or fewer than two panes

## AddPane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: clone focused pane path and listing into new pane when under maxPanes and management allowed

CONTRACT AddPane
  INPUT: layoutConfig, panes[], focusIndex, sharedSort, displaySpecStore
  OUTPUT: panes[] with appended pane; focusIndex set to new index
  DATA: sourcePane.activeDisplaySpecId, fetchDirectoryListing, buildPaneFromRawListing

PROCEDURE IMPL-PANE_MANAGEMENT_AddPane()
  IF NOT layoutConfig.allowPaneManagement THEN log warn AND RETURN
  IF maxPanes greater than zero AND panes.length greater or equal maxPanes THEN log warn AND RETURN
  SET sourcePane := panes[focusIndex]
  IF sourcePane.activeDisplaySpecId THEN ensureDisplaySpecOnServer(store.get(id))
  FETCH listing for sourcePane.path with activeDisplaySpecId
  BUILD newPane via buildPaneFromRawListing with sharedSort, preserveMarks false
  MERGE cross-pane visibility fields from sourcePane
  APPEND newPane to panes
  SET focusIndex := panes.length (index of new pane)

## RemovePane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: splice pane at index and remap focusIndex when removed pane was focused or before focus

CONTRACT RemovePane
  INPUT: paneIndex, panes.length, layoutConfig.allowPaneManagement
  OUTPUT: panes[] minus one entry; adjusted focusIndex
  DATA: minimum one pane invariant

PROCEDURE IMPL-PANE_MANAGEMENT_RemovePane(paneIndex)
  IF NOT allowPaneManagement THEN RETURN
  IF panes.length less or equal 1 THEN log warn AND RETURN
  SPLICE pane at paneIndex from panes array
  IF paneIndex less than focusIndex THEN decrement focusIndex
  ELSE IF paneIndex equals focusIndex THEN focusIndex := max(0, focusIndex - 1)

## SwapPanes

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: swap panes[i] and panes[j]; remap focusIndex; permute directory history; clear scrollTriggers

CONTRACT SwapPanes
  INPUT: indices i, j; panes[]; focusIndex
  OUTPUT: swapped panes[]; focus follows pane content; history swapped
  DATA: swapArrayAt, remapFocusIndexAfterSwap, globalDirectoryHistory.swapPaneHistories

PROCEDURE IMPL-PANE_MANAGEMENT_SwapPanes(i, j)
  IF NOT allowPaneManagement OR panes.length less than 2 OR i equals j THEN RETURN
  SET panes := swapArrayAt(panes, i, j)
  SET focusIndex := remapFocusIndexAfterSwap(focusIndex, i, j)
  CALL globalDirectoryHistory.swapPaneHistories(i, j)
  CLEAR scrollTriggers map

## SwapFocusedNeighbor

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with wrapped next/prev neighbor

CONTRACT SwapFocusedNeighbor
  INPUT: direction next or prev; panes.length; focusIndex
  OUTPUT: SwapPanes on computed neighbor indices
  DATA: neighborIndexNext, neighborIndexPrev

PROCEDURE IMPL-PANE_MANAGEMENT_SwapFocusedNeighbor(direction)
  IF panes.length equals 2 THEN CALL SwapPanes(0, 1) AND RETURN
  IF direction is next THEN j := neighborIndexNext(focusIndex, length)
  ELSE j := neighborIndexPrev(focusIndex, length)
  CALL SwapPanes(focusIndex, j)

## CyclePanes

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: rotate all panes one slot forward or backward; remap focus and directory history

CONTRACT CyclePanes
  INPUT: direction forward or backward; panes[]; focusIndex
  OUTPUT: rotated panes[]; focus and history follow pane content
  DATA: rotateArray, remapFocusIndexAfterRotate, globalDirectoryHistory.rotatePaneHistories

PROCEDURE IMPL-PANE_MANAGEMENT_CyclePanes(direction)
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET panes := rotateArray(panes, direction)
  SET focusIndex := remapFocusIndexAfterRotate(focusIndex, length, direction)
  CALL globalDirectoryHistory.rotatePaneHistories(direction, length)
  CLEAR scrollTriggers map

## PaneOrderDialogOpen

// [IMPL-PANE_MANAGEMENT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.order keybind sets paneOrderDialogOpen true without reordering panes

CONTRACT PaneOrderDialogOpen
  INPUT: action pane.order; allowPaneManagement; panes.length
  OUTPUT: paneOrderDialogOpen true
  DATA: disabled when single pane or management off

PROCEDURE IMPL-PANE_MANAGEMENT_PaneOrderDialogOpen()
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET paneOrderDialogOpen := true

## PaneOrderDialogApply

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: Apply reorders panes[] by index permutation from dialog; focus follows previous focus pane content

CONTRACT PaneOrderDialogApply
  INPUT: order[] where order[newIndex] = oldIndex; panes[]; focusIndex
  OUTPUT: permuted panes[]; focusIndex := order.indexOf(previousFocusPaneIndex)
  DATA: reorderArrayByIndices, globalDirectoryHistory.reorderPaneHistories

PROCEDURE IMPL-PANE_MANAGEMENT_PaneOrderDialogApply(order)
  IF NOT allowPaneManagement OR order.length not equal panes.length THEN RETURN
  SET previousFocusPaneIndex := focusIndex
  SET panes := reorderArrayByIndices(panes, order)
  SET focusIndex := order.indexOf(previousFocusPaneIndex)
  CALL globalDirectoryHistory.reorderPaneHistories(order)
  CLEAR scrollTriggers map
  SET paneOrderDialogOpen := false

## KeybindDisabledRules

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: disable pane.swap, cycle, order when allowPaneManagement false or fewer than two panes

CONTRACT KeybindDisabledRules
  INPUT: layoutConfig, panes.length, focusIndex
  OUTPUT: disabled action set for toolbar and keybind layer
  DATA: pane.add disabled at maxPanes; pane.remove disabled when length equals 1

PROCEDURE IMPL-PANE_MANAGEMENT_KeybindDisabledRules()
  IF NOT allowPaneManagement THEN disable pane.add pane.remove swap cycle order actions
  IF panes.length less or equal 1 THEN disable pane.remove swap cycle order actions

## CodeLocations

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleAddPane, handleRemovePane, handleSwapPanes, handleSwapFocusedNext/Prev, handleCyclePanes, handleApplyPaneOrder, keybinding handlers
// FILE: src/app/files/components/PaneOrderDialog.tsx — pane order dialog UI
// FILE: src/lib/pane-order.ts — swap, rotate, reorder, focus remap helpers
// FILE: src/lib/files.history.ts — swapPaneHistories, rotatePaneHistories, reorderPaneHistories
// FILE: config/files.yaml — pane management keybindings
// TEST: src/lib/pane-order.test.ts
// TEST: src/lib/files.history.test.ts
// TEST: src/app/files/components/PaneOrderDialog.test.tsx
// TEST: src/app/files/WorkspaceView.pane-reorder.test.tsx
// TEST: src/lib/config.test.ts — Pane Management Config describe

## ErrorHandling

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: add-pane fetch failure logs error without mutating panes; guard clauses return early on invalid config

PROCEDURE IMPL-PANE_MANAGEMENT_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF add pane listing fetch fails THEN log AND leave panes unchanged
  ELSE propagate error to caller
