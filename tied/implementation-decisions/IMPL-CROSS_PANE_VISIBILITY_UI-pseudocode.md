# IMPL-CROSS_PANE_VISIBILITY_UI essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_UI] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-TOOLBAR_SYSTEM]: how: tri-state toolbar, threshold dialog, pane header selector, manager dialog

## CYCLE_TRI_STATE

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-TOOLBAR_COMPONENT] [REQ-CROSS_PANE_VISIBILITY]: how: click cycles inactive → include → exclude → inactive; TriStateToolbarButton exposes data-tri-state

```
PROCEDURE CYCLE_TRI_STATE(action, toggles)
  toggles[action] := next state in cycle
```

## THRESHOLD_DIALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: view.compareFilter.thresholds opens CompareFilterThresholdDialog; sets sizeThreshold and timeThreshold ISO

```
PROCEDURE THRESHOLD_DIALOG(state)
  ON Apply SET state.sizeThreshold, state.timeThreshold
```

## SYNC_TOOLBAR_TO_FOCUS

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: triStateActions and handlers read RESOLVE_PANE_VISIBILITY(panes[focusIndex])

```
PROCEDURE SYNC_TOOLBAR_TO_FOCUS(focusIndex, panes)
  focusedState := RESOLVE_PANE_VISIBILITY(panes[focusIndex])
  triStateActions := map criterion -> focusedState.toggles
  ON CYCLE_TRI_STATE UPDATE panes[focusIndex].crossPaneVisibilityDraft
```

## PANE_HEADER_SELECTOR

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: CrossPaneVisibilitySelector dropdown sets activeCrossPaneVisibilityId via SET_ACTIVE_PRESET

```
PROCEDURE PANE_HEADER_SELECTOR(paneIndex, presetId)
  CALL SET_ACTIVE_PRESET(paneIndex, presetId, store)
  SHOW Draft indicator WHEN isCrossPaneVisibilityDraftDirty
```

## MANAGER_DIALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: CrossPaneVisibilityManagerDialog lists presets, Save focused draft, delete with panesUsingPreset guard

```
PROCEDURE MANAGER_DIALOG(focusedDraft, store)
  ON Save CALL SAVE_DRAFT_TO_CATALOG(focusedDraft, name, store)
  ON Delete IF panesUsingPreset(id) > 0 THEN warn ELSE store.delete(id)
```
