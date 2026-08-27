# IMPL-PANE_MANAGEMENT essence pseudocode

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: Runtime pane add/remove/swap/cycle/reorder with config guards, keybindings, and directory history following pane content

## Summary contract

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: how: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-PANE_MANAGEMENT_Summary():
  INPUT: layoutConfig { allowPaneManagement, maxPanes }, panes[], focusIndex, sharedSort, displaySpecStore
  OUTPUT: mutated panes[], focusIndex, globalDirectoryHistory, scrollTriggers cleared on reorder
  DATA: pane-order.ts helpers; PaneOrderDialog permutation array
  PRE: layout config and pane state available
  POST: pane mutations applied with focus and history following content
  EFFECTS: State, IO
  CONTROL: minimum one pane; reorder disabled when allowPaneManagement false or fewer than two panes
  TERMINATION: total
```

## AddPane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: clone focused pane path and listing into new pane when under maxPanes and management allowed

```
IMPL-PANE_MANAGEMENT_AddPane():
  INPUT: layoutConfig, panes[], focusIndex, sharedSort, displaySpecStore
  OUTPUT: panes[] with appended pane; focusIndex set to new index
  DATA: sourcePane.activeDisplaySpecId, fetchDirectoryListing, buildPaneFromRawListing
  PRE: allowPaneManagement and under maxPanes
  POST: new pane appended at focused path OR null when guards fail
  EFFECTS: State, IO
  TERMINATION: total
  SET sourcePane := panes[focusIndex]
  newIndex := await AppendPaneAtPath(sourcePane.path, focusIndex)
  IF newIndex NOT null THEN SET focusIndex := newIndex
```

## AppendPaneAtPath

// [IMPL-PANE_MANAGEMENT] [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-DIRECTORY_NAVIGATION]: how — shared append at arbitrary directoryPath; used by AddPane (clone path) and SetBaseDirectoryApply newPane (directory path from dialog)

```
IMPL-PANE_MANAGEMENT_AppendPaneAtPath(directoryPath, templatePaneIndex):
  INPUT: directoryPath, templatePaneIndex, layoutConfig, panes[], sharedSort, displaySpecStore
  OUTPUT: new pane index or null when guards fail or fetch errors
  DATA: inherit display spec and cross-pane fields from template pane; sharedSort for listing build
  PRE: directoryPath and template pane index available
  POST: new pane appended OR null on guard/fetch failure
  EFFECTS: State, IO
  FAILURE_MODES: FETCH_ERROR
  TERMINATION: total
  IF NOT allowPaneManagement OR at maxPanes THEN RETURN null
  SET sourcePane := panes[templatePaneIndex]
  IF sourcePane missing THEN RETURN null
  IF sourcePane.activeDisplaySpecId THEN ensureDisplaySpecOnServer(store.get(id))
  FETCH listing for directoryPath with sourcePane.activeDisplaySpecId
  BUILD built via buildPaneFromRawListing with sharedSort, preserveMarks false
  MERGE newPane := mergePaneListingWithCrossPaneFields(built, cross-pane fields from sourcePane)
  SET newIndex := panes.length
  APPEND newPane to panes via setPanes
  RETURN newIndex
  ON fetch error LOG error AND RETURN null
```

## RemovePane

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: splice pane at index and remap focusIndex when removed pane was focused or before focus

```
IMPL-PANE_MANAGEMENT_RemovePane(paneIndex):
  INPUT: paneIndex, panes.length, layoutConfig.allowPaneManagement
  OUTPUT: panes[] minus one entry; adjusted focusIndex
  DATA: minimum one pane invariant
  PRE: paneIndex valid; allowPaneManagement when required
  POST: pane removed with focus remapped; minimum one pane preserved
  EFFECTS: State
  TERMINATION: total
  IF NOT allowPaneManagement THEN RETURN
  IF panes.length less or equal 1 THEN log warn AND RETURN
  SPLICE pane at paneIndex from panes array
  IF paneIndex less than focusIndex THEN decrement focusIndex
  ELSE IF paneIndex equals focusIndex THEN focusIndex := max(0, focusIndex - 1)
```

## SwapPanes

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: swap panes[i] and panes[j]; remap focusIndex; permute directory history; clear scrollTriggers

```
IMPL-PANE_MANAGEMENT_SwapPanes(i, j):
  INPUT: indices i, j; panes[]; focusIndex
  OUTPUT: swapped panes[]; focus follows pane content; history swapped
  DATA: swapArrayAt, remapFocusIndexAfterSwap, globalDirectoryHistory.swapPaneHistories
  PRE: allowPaneManagement; at least two panes; i != j
  POST: panes swapped; focus and history follow content; scrollTriggers cleared
  EFFECTS: State
  TERMINATION: total
  IF NOT allowPaneManagement OR panes.length less than 2 OR i equals j THEN RETURN
  SET panes := swapArrayAt(panes, i, j)
  SET focusIndex := remapFocusIndexAfterSwap(focusIndex, i, j)
  CALL globalDirectoryHistory.swapPaneHistories(i, j)
  CLEAR scrollTriggers map
```

## SwapFocusedNeighbor

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with wrapped next/prev neighbor

```
IMPL-PANE_MANAGEMENT_SwapFocusedNeighbor(direction):
  INPUT: direction next or prev; panes.length; focusIndex
  OUTPUT: SwapPanes on computed neighbor indices
  DATA: neighborIndexNext, neighborIndexPrev
  PRE: at least two panes for swap
  POST: focused pane swapped with neighbor per direction rules
  EFFECTS: State
  TERMINATION: total
  IF panes.length equals 2 THEN CALL SwapPanes(0, 1) AND RETURN
  IF direction is next THEN j := neighborIndexNext(focusIndex, length)
  ELSE j := neighborIndexPrev(focusIndex, length)
  CALL SwapPanes(focusIndex, j)
```

## CyclePanes

// [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: rotate all panes one slot forward or backward; remap focus and directory history

```
IMPL-PANE_MANAGEMENT_CyclePanes(direction):
  INPUT: direction forward or backward; panes[]; focusIndex
  OUTPUT: rotated panes[]; focus and history follow pane content
  DATA: rotateArray, remapFocusIndexAfterRotate, globalDirectoryHistory.rotatePaneHistories
  PRE: allowPaneManagement; at least two panes
  POST: panes rotated; focus and history remapped; scrollTriggers cleared
  EFFECTS: State
  TERMINATION: total
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET panes := rotateArray(panes, direction)
  SET focusIndex := remapFocusIndexAfterRotate(focusIndex, length, direction)
  CALL globalDirectoryHistory.rotatePaneHistories(direction, length)
  CLEAR scrollTriggers map
```

## PaneOrderDialogOpen

// [IMPL-PANE_MANAGEMENT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.order keybind sets paneOrderDialogOpen true without reordering panes

```
IMPL-PANE_MANAGEMENT_PaneOrderDialogOpen():
  INPUT: action pane.order; allowPaneManagement; panes.length
  OUTPUT: paneOrderDialogOpen true
  DATA: disabled when single pane or management off
  PRE: pane.order action triggered
  POST: dialog open flag set when management allowed and multiple panes
  EFFECTS: State
  TERMINATION: total
  IF NOT allowPaneManagement OR panes.length less than 2 THEN RETURN
  SET paneOrderDialogOpen := true
```

## PaneOrderDialogApply

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: Apply reorders panes[] by index permutation from dialog; focus follows previous focus pane content

```
IMPL-PANE_MANAGEMENT_PaneOrderDialogApply(order):
  INPUT: order[] where order[newIndex] = oldIndex; panes[]; focusIndex
  OUTPUT: permuted panes[]; focusIndex := order.indexOf(previousFocusPaneIndex)
  DATA: reorderArrayByIndices, globalDirectoryHistory.reorderPaneHistories
  PRE: valid permutation matching panes.length
  POST: panes reordered; focus follows previous focus content; dialog closed
  EFFECTS: State
  TERMINATION: total
  IF NOT allowPaneManagement OR order.length not equal panes.length THEN RETURN
  SET previousFocusPaneIndex := focusIndex
  SET panes := reorderArrayByIndices(panes, order)
  SET focusIndex := order.indexOf(previousFocusPaneIndex)
  CALL globalDirectoryHistory.reorderPaneHistories(order)
  CLEAR scrollTriggers map
  SET paneOrderDialogOpen := false
```

## SetBaseDirectorySwapCompose

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-DIRECTORY_NAVIGATION]: how — after navigating neighbor pane to base directory path, swap initiating pane slot with neighbor via handleSwapPanes; focus follows pane content

```
IMPL-PANE_MANAGEMENT_SetBaseDirectorySwapCompose(initiating, neighbor, path):
  INPUT: initiatingPaneIndex, neighborIndex, directoryPath
  OUTPUT: neighbor pane at new path; pane slots swapped
  DATA: handleSwapPanes(initiating, neighbor); requires allowPaneManagement
  PRE: initiating and neighbor indices valid; path available
  POST: neighbor navigated; slots swapped when management allowed
  EFFECTS: State, IO
  TERMINATION: total
  syncingRef.add(neighbor)
  TRY await handleNavigate(neighbor, path)
  FINALLY syncingRef.delete(neighbor)
  IF allowPaneManagement THEN handleSwapPanes(initiating, neighbor)
```

## KeybindDisabledRules

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: disable pane.swap, cycle, order when allowPaneManagement false or fewer than two panes

```
IMPL-PANE_MANAGEMENT_KeybindDisabledRules():
  INPUT: layoutConfig, panes.length, focusIndex
  OUTPUT: disabled action set for toolbar and keybind layer
  DATA: pane.add disabled at maxPanes; pane.remove disabled when length equals 1
  PRE: layout config and pane count available
  POST: disabled actions computed for toolbar and keybind layer
  EFFECTS: pure
  TERMINATION: total
  IF NOT allowPaneManagement THEN disable pane.add pane.remove swap cycle order actions
  IF panes.length less or equal 1 THEN disable pane.remove swap cycle order actions
```

## CodeLocations

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE] [REQ-TOOLBAR_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — appendPaneAtPath, handleAddPane, handleRemovePane, handleSwapPanes, handleSwapFocusedNext/Prev, handleCyclePanes, handleApplyPaneOrder, keybinding handlers
// FILE: src/app/files/components/PaneOrderDialog.tsx — pane order dialog UI
// FILE: src/lib/pane-order.ts — swap, rotate, reorder, focus remap helpers
// FILE: src/lib/files.history.ts — swapPaneHistories, rotatePaneHistories, reorderPaneHistories
// FILE: config/files.yaml — pane management keybindings
// TEST: src/lib/pane-order.test.ts
// TEST: src/lib/files.history.test.ts
// TEST: src/app/files/components/PaneOrderDialog.test.tsx
// TEST: src/app/files/WorkspaceView.pane-reorder.test.tsx
// TEST: src/app/files/WorkspaceView.set-base-directory.test.tsx — appendPaneAtPath via newPane target
// TEST: src/lib/set-base-directory.test.ts
// TEST: src/lib/config.test.ts — Pane Management Config describe

## ErrorHandling

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: add-pane fetch failure logs error without mutating panes; guard clauses return early on invalid config

```
IMPL-PANE_MANAGEMENT_on_error(context, error):
  INPUT: context, error
  OUTPUT: logged diagnostic; panes unchanged on fetch failure
  PRE: error during pane management operation
  POST: add-pane fetch failure leaves panes unchanged; other errors propagated
  EFFECTS: pure
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF add pane listing fetch fails THEN log AND leave panes unchanged
  ELSE propagate error to caller
```
