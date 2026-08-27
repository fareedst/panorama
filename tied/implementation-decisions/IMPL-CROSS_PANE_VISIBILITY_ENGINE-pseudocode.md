# IMPL-CROSS_PANE_VISIBILITY_ENGINE essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: Filter pipeline stage 2 — **Cross-pane visibility** on focused listing after **Display spec**; **Focused pane visibility** + **Mirrored visibility** (tied/vocab/cross-pane-visibility.md)

## EVALUATE_FOCUS_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_COMPARISON]: how: **Focused pane visibility** — for each file in focused listing, exclude wins; if any include toggle active require match else default visible

```
IMPL-CROSS_PANE_VISIBILITY_ENGINE_EvaluateFocusVisibility(files, focusIndex, state, enhancedIndex, paneCount):
  INPUT: file listing, focusIndex, paneCount, enhancedIndex, CrossPaneVisibilityState
  OUTPUT: boolean visible per file in focused pane; visible basename set + hiddenCount delta
  DATA: criterionMatches per CompareFilterCriterionId; sizeThreshold, timeThreshold
  PRE: focused pane files and visibility state available
  POST: each file classified visible or hidden per exclude/include toggles
  EFFECTS: pure
  TERMINATION: total
  FOR each file IN files
    FOR each criterion WITH toggle exclude
      IF criterionMatches(exclude criterion, file, ...) THEN hidden
    IF any toggle is include
      IF any include criterion matches file THEN visible ELSE hidden
    ELSE visible
  RETURN visible basename set + hiddenCount delta
```

## MIRROR_OTHER_PANES

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: **Mirrored visibility** — non-focused panes filter to rows whose file.name is in focused visible set

```
IMPL-CROSS_PANE_VISIBILITY_ENGINE_MirrorOtherPanes(paneFiles, focusIndex, visibleNames):
  INPUT: paneFiles[][], focusIndex, visibleNames Set
  OUTPUT: displayFilesByPane with non-focus panes filtered by name membership
  PRE: visibleNames from focused pane evaluation
  POST: non-focused panes contain only rows whose name is in visibleNames
  EFFECTS: pure
  TERMINATION: total
  FOR each pane index i != focusIndex
    displayFiles[i] := paneFiles[i] FILTER file.name IN visibleNames
```

## APPLY_CROSS_PANE_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: Filter pipeline apply — compose **Focused pane visibility** then **Mirrored visibility**; return displayFilesByPane and crossPaneHiddenByPane per pane

```
IMPL-CROSS_PANE_VISIBILITY_ENGINE_ApplyCrossPaneVisibility(paneFiles, focusIndex, enhancedIndex, state):
  INPUT: paneFiles[][], focusIndex, enhancedIndex, state
  OUTPUT: { displayFilesByPane, crossPaneHiddenByPane }
  PRE: pane listings and visibility state available
  POST: filtered displayFilesByPane and per-pane hidden counts OR passthrough when inactive
  EFFECTS: pure
  CONTROL: passthrough when paneCount < 2 OR no active toggles
  TERMINATION: total
  IF paneCount < 2 OR NOT isCrossPaneVisibilityActive(state) THEN
    RETURN passthrough listings, zero hidden counts
  BUILD focusedVisible list via EVALUATE_FOCUS_VISIBILITY on paneFiles[focusIndex]
  visibleNames := SET of focusedVisible file.name
  displayFilesByPane := copy focus list; MIRROR_OTHER_PANES for other indices
  crossPaneHiddenByPane[i] := rawCount[i] - displayFilesByPane[i].length
  RETURN { displayFilesByPane, crossPaneHiddenByPane }
```

## RECONCILE_AFTER_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-FILE_MARKING_WEB]: how: after filter apply on focused pane, reconcilePaneSelection drops marks and clamps cursor to visible displayFiles

```
IMPL-CROSS_PANE_VISIBILITY_ENGINE_ReconcileAfterVisibility(focusedPane, displayFiles):
  INPUT: focusedPane, displayFiles after filter
  OUTPUT: pane marks and cursor consistent with visible rows
  PRE: focused pane and post-filter displayFiles available
  POST: marks and cursor reconciled to visible rows when changed
  EFFECTS: State
  TERMINATION: total
  reconciled := reconcilePaneSelection({ ...focusedPane, files: displayFiles })
  IF marks or cursor changed THEN UPDATE focusedPane marks and cursor
```

## BUILD_INDEX_FOR_FILTERS

// [IMPL-WORKSPACE_VIEW] [IMPL-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON] [REQ-CROSS_PANE_VISIBILITY]: how: buildEnhancedComparisonIndex when panes.length >= 2 regardless of comparisonMode

```
IMPL-CROSS_PANE_VISIBILITY_ENGINE_BuildIndexForFilters(panes):
  INPUT: panes file listings
  OUTPUT: Map basename → per-pane EnhancedCompareState
  PRE: panes array available
  POST: comparison index map OR empty when fewer than two panes
  EFFECTS: pure
  TERMINATION: total
  IF panes.length < 2 THEN RETURN empty Map
  RETURN buildEnhancedComparisonIndex(panes.map(p => p.files))
```

## CodeLocations

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: map implementing and verifying source files

// FILE: src/lib/cross-pane-visibility.ts — criterionMatches, isFileVisibleInFocusedPane, applyCrossPaneVisibility
// FILE: src/lib/cross-pane-visibility.test.ts — focus, mirror, threshold criteria
// FILE: src/app/files/WorkspaceView.tsx — apply + reconcile hooks
// FILE: src/app/files/WorkspaceView.cross-pane-visibility.test.tsx — integration
