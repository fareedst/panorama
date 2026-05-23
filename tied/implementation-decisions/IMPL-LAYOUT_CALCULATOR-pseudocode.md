# IMPL-LAYOUT_CALCULATOR essence pseudocode

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: Top-level Layout Calculation Algorithms: Pure TypeScript functions calculate PaneBounds[] from container dimensions and layout type

## Summary contract

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-LAYOUT_CALCULATOR
  DATA: state and configuration per implementation_approach

## Fullscreen

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: all panes at (0,0) with full dimensions

CONTRACT Fullscreen
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_Fullscreen(context)
  // all panes at (0
  CALL all panes at (0
  // 0) with full dimensions
  CALL 0) with full dimensions

## HelperFunctions

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: getTotalArea, doOverlap for validation

CONTRACT HelperFunctions
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_HelperFunctions(context)
  // getTotalArea
  CALL getTotalArea
  // doOverlap for validation
  CALL doOverlap for validation

## OneColumn

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: equal height vertically

CONTRACT OneColumn
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_OneColumn(context)
  // equal height vertically
  CALL equal height vertically
  ON invalid input OR missing data THEN RETURN without mutation

## OneRow

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: equal width horizontally

CONTRACT OneRow
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_OneRow(context)
  // equal width horizontally
  CALL equal width horizontally
  ON invalid input OR missing data THEN RETURN without mutation

## Tile

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: first pane left 50%, others stacked vertically right 50%

CONTRACT Tile
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_Tile(context)
  // first pane left 50%
  CALL first pane left 50%
  // others stacked vertically right 50%
  CALL others stacked vertically right 50%

## CreatedSrcLibFiles

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: Created src/lib/files.layout.ts

CONTRACT CreatedSrcLibFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_CreatedSrcLibFiles(context)
  // Created src/lib/files.layout.ts
  CALL Created src/lib/files.layout.ts
  ON invalid input OR missing data THEN RETURN without mutation

## ExportedLayoutTypeTileOneRow

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: Exported LayoutType = 'Tile' | 'OneRow' | 'OneColumn' | 'Fullscreen

CONTRACT ExportedLayoutTypeTileOneRow
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_ExportedLayoutTypeTileOneRow(context)
  // Exported LayoutType = 'Tile' | 'OneRow' | 'OneColumn' | 'Fullscreen
  CALL Exported LayoutType = 'Tile' | 'OneRow' | 'OneColumn' | 'Fullscreen
  ON invalid input OR missing data THEN RETURN without mutation

## ExportedPaneBoundsInterfaceX

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: Exported PaneBounds interface (x, y, width, height)

CONTRACT ExportedPaneBoundsInterfaceX
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_ExportedPaneBoundsInterfaceX(context)
  // Exported PaneBounds interface (x
  CALL Exported PaneBounds interface (x
  // width
  CALL width
  // height)
  CALL height)

## WORKSPACE_AREA_MEASUREMENT

// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how WorkspaceView supplies measured workspace-area client width/height to calculateLayout; pure files.layout.ts unchanged

CONTRACT WorkspaceAreaMeasurement
  INPUT: workspaceAreaRef on flex-1 min-h-0 container (data-testid workspace-area)
  OUTPUT: containerWidth, containerHeight for calculateLayout
  DATA: useElementSize hook, ResizeObserver, deps toolbarExpanded and toolbars.enabled

PROCEDURE IMPL-LAYOUT_CALCULATOR_WorkspaceAreaMeasurement(context)
  ATTACH workspaceAreaRef to workspace flex region below header and toolbars
  MEASURE clientWidth and clientHeight via useElementSize(ResizeObserver + window resize)
  ON zero client dimensions in jsdom THEN fallback viewport minus JSDOM_FALLBACK_CHROME_HEIGHT
  RE-MEASURE when toolbarExpanded or toolbars.enabled changes (explicit effect deps)
  PASS measured width and height to calculateLayout in WorkspaceView
  KEEP calculateLayout and layout algorithms in src/lib/files.layout.ts pure

## ImplementedCalculateLayoutContainerWidthContainerHeight

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: Implemented calculateLayout(containerWidth, containerHeight, numPanes, layoutType)

CONTRACT ImplementedCalculateLayoutContainerWidthContainerHeight
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LAYOUT_CALCULATOR_ImplementedCalculateLayoutContainerWidthContainerHeight(context)
  // Implemented calculateLayout(containerWidth
  CALL Implemented calculateLayout(containerWidth
  // containerHeight
  CALL containerHeight
  // numPanes
  CALL numPanes
  // layoutType)
  CALL layoutType)

## CodeLocations

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.layout.ts — Layout calculation algorithms
// FILE: src/lib/files.layout.test.ts — Layout tests (62 tests)
// FILE: src/lib/useElementSize.ts — workspace-area measurement hook
// FILE: src/lib/useElementSize.test.ts — useElementSize unit tests
// FILE: src/app/files/WorkspaceView.tsx — consumer: workspaceAreaRef, useElementSize, calculateLayout
// FUNCTION: useElementSize in src/lib/useElementSize.ts
// FUNCTION: calculateLayout in src/lib/files.layout.ts
// FUNCTION: calculateTileLayout in src/lib/files.layout.ts
// FUNCTION: calculateOneRowLayout in src/lib/files.layout.ts
// FUNCTION: calculateOneColumnLayout in src/lib/files.layout.ts

## ErrorHandling

// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-LAYOUT_CALCULATOR_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
