# IMPL-CROSS_PANE_VISIBILITY_UI essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_UI] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-TOOLBAR_SYSTEM]: how: tri-state toolbar, threshold dialog, pane header selector, manager dialog

## CYCLE_TRI_STATE

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-TOOLBAR_COMPONENT] [REQ-CROSS_PANE_VISIBILITY]: how: click cycles inactive → include → exclude → inactive; TriStateToolbarButton exposes data-tri-state

```
IMPL-CROSS_PANE_VISIBILITY_UI_CycleTriState(action, toggles):
  INPUT: current TriState per criterion action
  OUTPUT: next TriState
  PRE: toolbar action and toggles map available
  POST: toggles[action] cycled inactive → include → exclude → inactive
  EFFECTS: State
  TERMINATION: total
  toggles[action] := cycleTriState(current)  // inactive → include → exclude → inactive
  TriStateToolbarButton SET data-tri-state attribute to new value
```

## THRESHOLD_DIALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: view.compareFilter.thresholds opens CompareFilterThresholdDialog; sets sizeThreshold and timeThreshold ISO

```
IMPL-CROSS_PANE_VISIBILITY_UI_ThresholdDialog(state):
  INPUT: CrossPaneVisibilityState draft
  OUTPUT: updated sizeThreshold (number | null), timeThreshold (ISO string | null)
  PRE: draft state and dialog handler available
  POST: sizeThreshold and timeThreshold updated from dialog Apply
  EFFECTS: State, IO
  TERMINATION: total
  ON handler view.compareFilter.thresholds OPEN CompareFilterThresholdDialog
  ON Apply SET state.sizeThreshold, state.timeThreshold FROM dialog fields
```

## SYNC_TOOLBAR_TO_FOCUS

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: triStateActions and handlers read RESOLVE_PANE_VISIBILITY(panes[focusIndex])

```
IMPL-CROSS_PANE_VISIBILITY_UI_SyncToolbarToFocus(focusIndex, panes):
  INPUT: focusIndex, panes[]
  OUTPUT: toolbar reflects focused pane draft; updates write crossPaneVisibilityDraft
  PRE: focusIndex valid; panes state available
  POST: triStateActions mirror focused draft; cycle updates focused pane draft
  EFFECTS: State
  TERMINATION: partial
  focusedState := RESOLVE_PANE_VISIBILITY(panes[focusIndex])
  triStateActions := map criterion → focusedState.toggles
  ON CYCLE_TRI_STATE UPDATE panes[focusIndex].crossPaneVisibilityDraft toggles
```

## PANE_HEADER_SELECTOR

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: CrossPaneVisibilitySelector dropdown sets activeCrossPaneVisibilityId via SET_ACTIVE_PRESET

```
IMPL-CROSS_PANE_VISIBILITY_UI_PaneHeaderSelector(paneIndex, presetId):
  INPUT: paneIndex, presetId | null, store
  OUTPUT: pane preset fields updated; draft indicator when dirty
  PRE: pane and catalog store available
  POST: activeCrossPaneVisibilityId and draft loaded from preset OR default
  EFFECTS: State, IO
  TERMINATION: total
  CALL SET_ACTIVE_PRESET(pane, presetId, store)
  SHOW Draft indicator WHEN isCrossPaneVisibilityDraftDirty(pane, store)
```

## MANAGER_DIALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: CrossPaneVisibilityManagerDialog lists presets, Save focused draft, delete with panesUsingPreset guard

```
IMPL-CROSS_PANE_VISIBILITY_UI_ManagerDialog(focusedDraft, store):
  INPUT: focusedDraft, store, panesUsingPreset(id)
  OUTPUT: catalog CRUD from UI
  PRE: manager dialog open with focused draft
  POST: preset saved OR deleted with panes-in-use guard
  EFFECTS: State, IO
  FAILURE_MODES: delete when panesUsingPreset(id) > 0 → warn user, no delete
  TERMINATION: total
  ON Save CALL SAVE_DRAFT_TO_CATALOG(focusedDraft, name, store)
  ON Delete IF panesUsingPreset(id) > 0 THEN warn user ELSE store.delete(id)
```

## CodeLocations

// [IMPL-CROSS_PANE_VISIBILITY_UI] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: map implementing and verifying source files

// FILE: src/lib/cross-pane-visibility.ts — cycleTriState
// FILE: src/app/files/components/TriStateToolbarButton.tsx
// FILE: src/app/files/components/CompareFilterThresholdDialog.tsx
// FILE: src/app/files/components/CrossPaneVisibilitySelector.tsx
// FILE: src/app/files/components/CrossPaneVisibilityManagerDialog.tsx
// FILE: src/app/files/WorkspaceView.tsx — toolbar handlers SYNC_TOOLBAR_TO_FOCUS
// TEST: TriStateToolbarButton.test.tsx, CompareFilterThresholdDialog.test.tsx, CrossPaneVisibilitySelector.test.tsx, CrossPaneVisibilityManagerDialog.test.tsx, WorkspaceView.cross-pane-visibility.test.tsx
