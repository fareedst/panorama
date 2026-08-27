# IMPL-LAYOUT_CALCULATOR essence pseudocode

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Pure layout algorithms in files.layout.ts plus workspace-area measurement hook feeding calculateLayout from WorkspaceView

## Summary contract

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: given container width/height, pane count, and LayoutType return PaneBounds[]; consumer measures flex workspace-area not raw viewport

```
IMPL-LAYOUT_CALCULATOR_Summary():
  INPUT: containerWidth, containerHeight, numPanes, layoutType
  OUTPUT: PaneBounds[] (x, y, width, height per pane)
  DATA: LayoutType Tile | OneRow | OneColumn | Fullscreen; LAYOUT_ALIASES for config strings
  PRE: container dimensions and pane count available
  POST: bounds array returned per layout algorithm
  EFFECTS: pure
  CONTROL: invalid dimensions yield zero-size bounds; numPanes < 1 yields []
  TERMINATION: total
```

## NormalizeLayoutTypeFromConfig

// [IMPL-LAYOUT_CALCULATOR] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-WORKSPACE_MESH_BRIDGE]: how: map mesh/UI aliases to canonical LayoutType

```
IMPL-LAYOUT_CALCULATOR_NormalizeLayoutTypeFromConfig(value):
  INPUT: string or unknown from config snapshot
  OUTPUT: LayoutType OR null
  DATA: LAYOUT_ALIASES lowercase keys; canonical names pass through
  PRE: config or snapshot layout value available
  POST: canonical LayoutType OR null when unrecognized
  EFFECTS: pure
  TERMINATION: total
  IF value not non-empty string THEN RETURN null
  IF value in canonical set THEN RETURN value
  RETURN LAYOUT_ALIASES lowercased lookup OR null
```

## CalculateLayoutDispatch

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: switch layoutType to tile, one row, one column, fullscreen helpers; default tile

```
IMPL-LAYOUT_CALCULATOR_CalculateLayoutDispatch(w, h, n, layoutType):
  INPUT: containerWidth, containerHeight, numPanes, layoutType
  OUTPUT: PaneBounds[]
  DATA: per-algorithm functions
  PRE: dimensions and pane count provided
  POST: bounds per layoutType algorithm OR empty/zero bounds on invalid input
  EFFECTS: pure
  TERMINATION: total
  IF n < 1 THEN RETURN empty array
  IF w <= 0 OR h <= 0 THEN RETURN n entries zero bounds at origin
  SWITCH layoutType
    Tile -> calculateTileLayout
    OneRow -> calculateOneRowLayout
    OneColumn -> calculateOneColumnLayout
    Fullscreen -> calculateFullscreenLayout
    default -> calculateTileLayout
```

## TileLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: pane 0 left 50% full height; panes 1+ stacked in right 50%

```
IMPL-LAYOUT_CALCULATOR_TileLayoutAlgorithm(width, height, numPanes):
  INPUT: width, height, numPanes
  OUTPUT: bounds per pane
  PRE: positive width and height; numPanes >= 1
  POST: tile layout bounds with left half pane0 and right stack for remainder
  EFFECTS: pure
  TERMINATION: total
  IF numPanes is 1 THEN RETURN single fullscreen bounds
  SET pane0 width floor width/2 full height
  SPLIT right half vertically among remaining panes equal height slices
  POSITION right stack x at width/2
```

## OneRowLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: divide container width equally across panes; full height each

```
IMPL-LAYOUT_CALCULATOR_OneRowLayoutAlgorithm(width, height, numPanes):
  INPUT: width, height, numPanes
  OUTPUT: horizontal strip bounds
  PRE: positive dimensions; numPanes >= 1
  POST: equal-width horizontal pane bounds
  EFFECTS: pure
  TERMINATION: total
  paneWidth := floor width / numPanes
  FOR i IN 0..numPanes-1 SET x i*paneWidth y 0 width paneWidth height full
```

## OneColumnLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: divide container height equally; full width each

```
IMPL-LAYOUT_CALCULATOR_OneColumnLayoutAlgorithm(width, height, numPanes):
  INPUT: width, height, numPanes
  OUTPUT: vertical stack bounds
  PRE: positive dimensions; numPanes >= 1
  POST: equal-height vertical pane bounds
  EFFECTS: pure
  TERMINATION: total
  paneHeight := floor height / numPanes
  FOR i IN 0..numPanes-1 SET x 0 y i*paneHeight width full height paneHeight
```

## FullscreenLayoutAlgorithm

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: every pane receives full container bounds (stacked visually; focus shows active)

```
IMPL-LAYOUT_CALCULATOR_FullscreenLayoutAlgorithm(width, height, numPanes):
  INPUT: width, height, numPanes
  OUTPUT: n identical full-area bounds
  PRE: positive dimensions; numPanes >= 1
  POST: each pane receives full container bounds
  EFFECTS: pure
  TERMINATION: total
  FOR each pane RETURN x 0 y 0 width height full container
```

## LayoutValidationHelpers

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: how: getTotalArea sums pane areas; doOverlap detects intersection for tests

```
IMPL-LAYOUT_CALCULATOR_LayoutValidationHelpers(bounds):
  INPUT: PaneBounds[]
  OUTPUT: numeric area OR boolean overlap
  PRE: bounds array available
  POST: total area sum OR overlap boolean for test validation
  EFFECTS: pure
  TERMINATION: total
  getTotalArea SUM width*height per bound
  doOverlap CHECK any pair intersects excluding edge-touch
```

## WorkspaceAreaMeasurement

// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: WorkspaceView attaches workspaceAreaRef; useElementSize supplies dimensions to calculateLayout when toolbar state changes

```
IMPL-LAYOUT_CALCULATOR_WorkspaceAreaMeasurement():
  INPUT: workspaceAreaRef on flex-1 min-h-0 region data-testid workspace-area
  OUTPUT: containerWidth, containerHeight state
  DATA: useElementSize ResizeObserver; deps toolbarDisplayMode (compact | expanded | named) and toolbars.enabled
  PRE: workspace-area ref attached below header and toolbars
  POST: measured dimensions passed to calculateLayout; fallback when zero in test env
  EFFECTS: IO, State
  TERMINATION: partial
  ATTACH ref to workspace region below header and toolbars
  readElementSize USE clientWidth clientHeight
  IF both zero THEN fallback window innerWidth and innerHeight minus JSDOM_FALLBACK_CHROME_HEIGHT
  useElementSize OBSERVE element AND window resize AND re-run when deps change
  PASS width height into calculateLayout for each pane style in WorkspaceView
  KEEP files.layout.ts functions pure (no DOM)
```

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

```
IMPL-LAYOUT_CALCULATOR_on_error(context, error):
  INPUT: context, error
  OUTPUT: safe fallback bounds or null layout type
  PRE: invalid input or missing ref
  POST: empty bounds or null normalize without throw
  EFFECTS: pure
  TERMINATION: total
  IF numPanes invalid low THEN RETURN []
  IF measure ref missing THEN dimensions 0 until attach
  DELEGATE invalid layout string to normalize returning null and caller fallback layout
```
