# IMPL-CROSS_PANE_VISIBILITY_ENGINE essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: Filter pipeline stage 2 — **Cross-pane visibility** on focused listing after **Display spec**; **Focused pane visibility** + **Mirrored visibility** (tied/vocab/cross-pane-visibility.md)

## EVALUATE_FOCUS_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_COMPARISON]: how: **Focused pane visibility** — for each file in focused listing, exclude wins; if any include toggle active require match else default visible

CONTRACT EVALUATE_FOCUS_VISIBILITY
  INPUT: file, focusIndex, paneCount, enhancedIndex, CrossPaneVisibilityState
  OUTPUT: boolean visible in focused pane
  DATA: criterionMatches per CompareFilterCriterionId; sizeThreshold, timeThreshold

PROCEDURE EVALUATE_FOCUS_VISIBILITY(files, focusIndex, state, enhancedIndex, paneCount)
  FOR each file IN files
    FOR each criterion WITH toggle exclude
      IF criterionMatches(exclude criterion, file, ...) THEN hidden
    IF any toggle is include
      IF any include criterion matches file THEN visible ELSE hidden
    ELSE visible
  RETURN visible basename set + hiddenCount delta

## MIRROR_OTHER_PANES

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: **Mirrored visibility** — non-focused panes filter to rows whose file.name is in focused visible set

CONTRACT MIRROR_OTHER_PANES
  INPUT: paneFiles[][], focusIndex, visibleNames Set
  OUTPUT: displayFilesByPane with non-focus panes filtered by name membership

PROCEDURE MIRROR_OTHER_PANES(paneFiles, focusIndex, visibleNames)
  FOR each pane index i != focusIndex
    displayFiles[i] := paneFiles[i] FILTER file.name IN visibleNames

## APPLY_CROSS_PANE_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: Filter pipeline apply — compose **Focused pane visibility** then **Mirrored visibility**; return displayFilesByPane and crossPaneHiddenByPane per pane

CONTRACT APPLY_CROSS_PANE_VISIBILITY
  INPUT: paneFiles[][], focusIndex, enhancedIndex, state
  OUTPUT: { displayFilesByPane, crossPaneHiddenByPane }
  CONTROL: passthrough when paneCount < 2 OR no active toggles

PROCEDURE APPLY_CROSS_PANE_VISIBILITY(paneFiles, focusIndex, enhancedIndex, state)
  IF paneCount < 2 OR NOT isCrossPaneVisibilityActive(state) THEN
    RETURN passthrough listings, zero hidden counts
  BUILD focusedVisible list via EVALUATE_FOCUS_VISIBILITY on paneFiles[focusIndex]
  visibleNames := SET of focusedVisible file.name
  displayFilesByPane := copy focus list; MIRROR_OTHER_PANES for other indices
  crossPaneHiddenByPane[i] := rawCount[i] - displayFilesByPane[i].length
  RETURN { displayFilesByPane, crossPaneHiddenByPane }

## RECONCILE_AFTER_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-FILE_MARKING_WEB]: how: after filter apply on focused pane, reconcilePaneSelection drops marks and clamps cursor to visible displayFiles

CONTRACT RECONCILE_AFTER_VISIBILITY
  INPUT: focusedPane, displayFiles after filter
  OUTPUT: pane marks and cursor consistent with visible rows

PROCEDURE RECONCILE_AFTER_VISIBILITY(focusedPane, displayFiles)
  reconciled := reconcilePaneSelection({ ...focusedPane, files: displayFiles })
  IF marks or cursor changed THEN UPDATE focusedPane marks and cursor

## BUILD_INDEX_FOR_FILTERS

// [IMPL-WORKSPACE_VIEW] [IMPL-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON] [REQ-CROSS_PANE_VISIBILITY]: how: buildEnhancedComparisonIndex when panes.length >= 2 regardless of comparisonMode

CONTRACT BUILD_INDEX_FOR_FILTERS
  INPUT: panes file listings
  OUTPUT: Map basename → per-pane EnhancedCompareState

PROCEDURE BUILD_INDEX_FOR_FILTERS(panes)
  IF panes.length < 2 THEN RETURN empty Map
  RETURN buildEnhancedComparisonIndex(panes.map(p => p.files))

## CodeLocations

// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: map implementing and verifying source files

// FILE: src/lib/cross-pane-visibility.ts — criterionMatches, isFileVisibleInFocusedPane, applyCrossPaneVisibility
// FILE: src/lib/cross-pane-visibility.test.ts — focus, mirror, threshold criteria
// FILE: src/app/files/WorkspaceView.tsx — apply + reconcile hooks
// FILE: src/app/files/WorkspaceView.cross-pane-visibility.test.tsx — integration
