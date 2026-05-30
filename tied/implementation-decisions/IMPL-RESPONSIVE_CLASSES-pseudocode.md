# IMPL-RESPONSIVE_CLASSES essence pseudocode

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: Files workspace Tailwind mobile-first layouts — default single-column/stacked; lg: breakpoint and max-w viewport guards on overlays

## HelpOverlayResponsiveGrid

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: Help overlay shortcut categories use grid-cols-1 by default and lg:grid-cols-2 for wide viewports

CONTRACT HelpOverlayResponsiveGrid
  INPUT: isOpen boolean, categories from keybind registry
  OUTPUT: modal content grid with one column on small screens two columns at lg breakpoint
  DATA: class grid grid-cols-1 lg:grid-cols-2 gap-8; modal max-w-5xl w-full mx-4 max-h 90vh

PROCEDURE IMPL-RESPONSIVE_CLASSES_HelpOverlayResponsiveGrid(context)
  IF NOT isOpen THEN RETURN null
  RENDER modal shell flex centered inset-0
  RENDER scrollable content area
  RENDER category sections inside grid with 1 column below lg and 2 columns at lg and above

## DialogViewportMaxWidth

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: file manager dialogs cap panel width and add max-w-[90vw] so narrow viewports do not overflow horizontally

CONTRACT DialogViewportMaxWidth
  INPUT: dialog panel fixed width token (w-96, w-72, w-[28rem])
  OUTPUT: panel remains within viewport on mobile
  DATA: Tailwind max-w-[90vw] combined with fixed w-* on SortDialog ColumnOrderDialog PaneOrderDialog LayoutPickerPopover

PROCEDURE IMPL-RESPONSIVE_CLASSES_DialogViewportMaxWidth(context)
  APPLY base width class for dialog type
  APPLY max-w-[90vw] on same panel element
  CENTER overlay with flex items-center justify-center (or items-start for top-aligned finder/search)

## FilePaneFlexColumnLayout

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: FilePane uses flex flex-col so header path bar file grid and footer stack vertically within pane bounds

CONTRACT FilePaneFlexColumnLayout
  INPUT: pane dimensions and file listing
  OUTPUT: pane interior scrolls file list in flex-1 overflow-y-auto region
  DATA: outer absolute overflow-hidden flex flex-col; file list flex-1; footer flex row at bottom

PROCEDURE IMPL-RESPONSIVE_CLASSES_FilePaneFlexColumnLayout(context)
  RENDER pane container flex flex-col full height
  RENDER path header row flex items-center truncate
  RENDER file list region flex-1 overflow-y-auto with CSS grid rows per file
  RENDER footer flex items-center justify-between when status non-empty

## CodeLocations

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: map files workspace implementing sources for this IMPL

// FILE: src/app/files/components/HelpOverlay.tsx — lg:grid-cols-2 responsive category grid
// FILE: src/app/files/components/SortDialog.tsx — w-96 max-w-[90vw]
// FILE: src/app/files/components/ColumnOrderDialog.tsx — w-96 max-w-[90vw]
// FILE: src/app/files/components/PaneOrderDialog.tsx — w-[28rem] max-w-[90vw]
// FILE: src/app/files/components/LayoutPickerPopover.tsx — w-72 max-w-[90vw]
// FILE: src/app/files/components/FilePane.tsx — flex flex-col pane shell and flex-1 scrolling list
