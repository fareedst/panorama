# IMPL-LAYOUT_CALCULATOR essence pseudocode

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Pure layout algorithms in files.layout.ts plus workspace-area measurement hook feeding calculateLayout from WorkspaceView

## Summary contract

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: given container width/height, pane count, and LayoutType return PaneBounds[]; consumer measures flex workspace-area not raw viewport

CONTRACT Summary
  INPUT: containerWidth, containerHeight, numPanes, layoutType
  OUTPUT: PaneBounds[] (x, y, width, height per pane)
  DATA: LayoutType Tile | OneRow | OneColumn | Fullscreen; LAYOUT_ALIASES for config strings
  CONTROL: invalid dimensions yield zero-size bounds; numPanes < 1 yields []

## NormalizeLayoutTypeFromConfig

// [IMPL-LAYOUT_CALCULATOR] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-WORKSPACE_MESH_BRIDGE]: how: map mesh/UI aliases to canonical LayoutType

CONTRACT NormalizeLayoutTypeFromConfig
  INPUT: string or unknown from config snapshot
  OUTPUT: LayoutType OR null
  DATA: LAYOUT_ALIASES lowercase keys; canonical names pass through

PROCEDURE IMPL-LAYOUT_CALCULATOR_NormalizeLayoutTypeFromConfig(value)
  IF value not non-empty string THEN RETURN null
  IF value in canonical set THEN RETURN value
  RETURN LAYOUT_ALIASES lowercased lookup OR null

## CalculateLayoutDispatch

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: switch layoutType to tile, one row, one column, fullscreen helpers; default tile

CONTRACT CalculateLayoutDispatch
  INPUT: containerWidth, containerHeight, numPanes, layoutType
  OUTPUT: PaneBounds[]
  DATA: per-algorithm functions

PROCEDURE IMPL-LAYOUT_CALCULATOR_CalculateLayoutDispatch(w, h, n, layoutType)
  IF n < 1 THEN RETURN empty array
  IF w <= 0 OR h <= 0 THEN RETURN n entries zero bounds at origin
  SWITCH layoutType
    Tile -> calculateTileLayout
    OneRow -> calculateOneRowLayout
    OneColumn -> calculateOneColumnLayout
    Fullscreen -> calculateFullscreenLayout
    default -> calculateTileLayout

## TileLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: pane 0 left 50% full height; panes 1+ stacked in right 50%

CONTRACT TileLayoutAlgorithm
  INPUT: width, height, numPanes
  OUTPUT: bounds per pane

PROCEDURE IMPL-LAYOUT_CALCULATOR_TileLayoutAlgorithm(width, height, numPanes)
  IF numPanes is 1 THEN RETURN single fullscreen bounds
  SET pane0 width floor width/2 full height
  SPLIT right half vertically among remaining panes equal height slices
  POSITION right stack x at width/2

## OneRowLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: divide container width equally across panes; full height each

CONTRACT OneRowLayoutAlgorithm
  INPUT: width, height, numPanes
  OUTPUT: horizontal strip bounds

PROCEDURE IMPL-LAYOUT_CALCULATOR_OneRowLayoutAlgorithm(width, height, numPanes)
  paneWidth := floor width / numPanes
  FOR i IN 0..numPanes-1 SET x i*paneWidth y 0 width paneWidth height full

## OneColumnLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: divide container height equally; full width each

CONTRACT OneColumnLayoutAlgorithm
  INPUT: width, height, numPanes
  OUTPUT: vertical stack bounds

PROCEDURE IMPL-LAYOUT_CALCULATOR_OneColumnLayoutAlgorithm(width, height, numPanes)
  paneHeight := floor height / numPanes
  FOR i IN 0..numPanes-1 SET x 0 y i*paneHeight width full height paneHeight

## FullscreenLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: every pane receives full container bounds (stacked visually; focus shows active)

CONTRACT FullscreenLayoutAlgorithm
  INPUT: width, height, numPanes
  OUTPUT: n identical full-area bounds

PROCEDURE IMPL-LAYOUT_CALCULATOR_FullscreenLayoutAlgorithm(width, height, numPanes)
  FOR each pane RETURN x 0 y 0 width height full container

## LayoutValidationHelpers

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: getTotalArea sums pane areas; doOverlap detects intersection for tests

CONTRACT LayoutValidationHelpers
  INPUT: PaneBounds[]
  OUTPUT: numeric area OR boolean overlap

PROCEDURE IMPL-LAYOUT_CALCULATOR_LayoutValidationHelpers(bounds)
  getTotalArea SUM width*height per bound
  doOverlap CHECK any pair intersects excluding edge-touch

## WorkspaceAreaMeasurement

// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: WorkspaceView attaches workspaceAreaRef; useElementSize supplies dimensions to calculateLayout when toolbar state changes

CONTRACT WorkspaceAreaMeasurement
  INPUT: workspaceAreaRef on flex-1 min-h-0 region data-testid workspace-area
  OUTPUT: containerWidth, containerHeight state
  DATA: useElementSize ResizeObserver; deps toolbarExpanded and toolbars.enabled

PROCEDURE IMPL-LAYOUT_CALCULATOR_WorkspaceAreaMeasurement()
  ATTACH ref to workspace region below header and toolbars
  readElementSize USE clientWidth clientHeight
  IF both zero THEN fallback window innerWidth and innerHeight minus JSDOM_FALLBACK_CHROME_HEIGHT
  useElementSize OBSERVE element AND window resize AND re-run when deps change
  PASS width height into calculateLayout for each pane style in WorkspaceView
  KEEP files.layout.ts functions pure (no DOM)

## CodeLocations

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files

// FILE: src/lib/files.layout.ts — calculateLayout, algorithms, helpers, normalizeLayoutType
// FILE: src/lib/files.layout.test.ts — layout and normalize tests
// FILE: src/lib/useElementSize.ts — measurement hook
// FILE: src/lib/useElementSize.test.ts — hook tests
// FILE: src/app/files/WorkspaceView.tsx — workspaceAreaRef, useElementSize, calculateLayout consumer
// FILE: src/test/setup.ts — ResizeObserver polyfill for jsdom

## ErrorHandling

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: non-positive container returns zero bounds instead of throw; unknown layout alias returns null at normalize layer

PROCEDURE IMPL-LAYOUT_CALCULATOR_on_error(context, error)
  IF numPanes invalid low THEN RETURN []
  IF measure ref missing THEN dimensions 0 until attach
  DELEGATE invalid layout string to normalize returning null and caller fallback layout
