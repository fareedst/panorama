# IMPL-CROSS_PANE_VISIBILITY_ENGINE essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: src/lib/cross-pane-visibility.ts — criterion evaluation and cross-pane mirroring

## EVALUATE_FOCUS_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_COMPARISON]: how: for each file in focused pane listing, exclude wins; if any include toggle active require match else default visible

```
PROCEDURE EVALUATE_FOCUS_VISIBILITY(files, focusIndex, state, enhancedIndex, paneCount)
  FOR each file IN files
    IF any active EXCLUDE criterion matches file THEN hidden
    ELSE IF any toggle in INCLUDE state
      IF any active INCLUDE matches file THEN visible ELSE hidden
    ELSE visible
  RETURN visible basename set + hiddenCount delta
```

## MIRROR_OTHER_PANES

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: non-focused panes filter to rows whose file.name is in focused visible set

```
PROCEDURE MIRROR_OTHER_PANES(panes, focusIndex, visibleNames)
  FOR each pane index i != focusIndex
    displayFiles[i] := pane.files FILTER name IN visibleNames
```

## APPLY_CROSS_PANE_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: compose EVALUATE_FOCUS_VISIBILITY then MIRROR_OTHER_PANES; return displayFilesByPane and crossPaneHiddenByPane per pane

```
PROCEDURE APPLY_CROSS_PANE_VISIBILITY(paneFiles, focusIndex, enhancedIndex, state)
  IF paneCount < 2 OR state has no active toggles THEN RETURN passthrough listings
  focusedVisible := EVALUATE_FOCUS_VISIBILITY(paneFiles[focusIndex], focusIndex, state, enhancedIndex, paneCount)
  visibleNames := SET of focusedVisible file.name
  displayFilesByPane := MIRROR_OTHER_PANES(paneFiles, focusIndex, visibleNames)
  crossPaneHiddenByPane[i] := rawCount[i] - displayFilesByPane[i].length
  RETURN { displayFilesByPane, crossPaneHiddenByPane }
```

## RECONCILE_AFTER_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-FILE_MARKING_WEB]: how: after filter apply on focused pane, reconcilePaneSelection drops marks and clamps cursor to visible displayFiles

```
PROCEDURE RECONCILE_AFTER_VISIBILITY(focusedPane, displayFiles)
  reconciled := reconcilePaneSelection({ ...focusedPane, files: displayFiles })
  IF marks or cursor changed THEN UPDATE focusedPane marks and cursor
```

## BUILD_INDEX_FOR_FILTERS

// [IMPL-WORKSPACE_VIEW] [IMPL-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON] [REQ-CROSS_PANE_VISIBILITY]: how: buildEnhancedComparisonIndex when panes.length >= 2 regardless of comparisonMode

```
PROCEDURE BUILD_INDEX_FOR_FILTERS(panes)
  IF panes.length < 2 THEN RETURN empty Map
  RETURN buildEnhancedComparisonIndex(panes.map(p => p.files))
```
