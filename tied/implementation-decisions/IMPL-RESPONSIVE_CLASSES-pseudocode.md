# IMPL-RESPONSIVE_CLASSES essence pseudocode

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: Files workspace Tailwind mobile-first layouts — default single-column/stacked; lg: breakpoint and max-w viewport guards on overlays

## HelpOverlayResponsiveGrid

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: Help overlay shortcut categories use grid-cols-1 by default and lg:grid-cols-2 for wide viewports

```
IMPL-RESPONSIVE_CLASSES_HelpOverlayResponsiveGrid(context):
  INPUT: isOpen boolean, categories from keybind registry
  OUTPUT: modal content grid with one column on small screens two columns at lg breakpoint
  DATA: class grid grid-cols-1 lg:grid-cols-2 gap-8; modal max-w-5xl w-full mx-4 max-h 90vh
  PRE: HelpOverlay isOpen when rendering grid
  POST: category grid uses one column below lg and two columns at lg and above
  EFFECTS: pure
  TERMINATION: total
  IF NOT isOpen THEN RETURN null
  RENDER modal shell flex centered inset-0
  RENDER scrollable content area
  RENDER category sections inside grid with 1 column below lg and 2 columns at lg and above
```

## DialogViewportMaxWidth

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: file manager dialogs cap panel width and add max-w-[90vw] so narrow viewports do not overflow horizontally

```
IMPL-RESPONSIVE_CLASSES_DialogViewportMaxWidth(context):
  INPUT: dialog panel fixed width token (w-96, w-72, w-[28rem])
  OUTPUT: panel remains within viewport on mobile
  DATA: Tailwind max-w-[90vw] combined with fixed w-* on SortDialog ColumnOrderDialog PaneOrderDialog LayoutPickerPopover
  PRE: dialog panel element rendered with base width class
  POST: max-w-[90vw] applied on same panel element preventing horizontal overflow
  EFFECTS: pure
  TERMINATION: total
  APPLY base width class for dialog type
  APPLY max-w-[90vw] on same panel element
  CENTER overlay with flex items-center justify-center (or items-start for top-aligned finder/search)
```

## FilePaneFlexColumnLayout

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: FilePane uses flex flex-col so header path bar file grid and footer stack vertically within pane bounds

```
IMPL-RESPONSIVE_CLASSES_FilePaneFlexColumnLayout(context):
  INPUT: pane dimensions and file listing
  OUTPUT: pane interior scrolls file list in flex-1 overflow-y-auto region
  DATA: outer absolute overflow-hidden flex flex-col; file list flex-1; footer flex row at bottom
  PRE: FilePane mounted with listing and optional footer content
  POST: header, scrollable file list, and footer stack vertically within pane bounds
  EFFECTS: pure
  TERMINATION: total
  RENDER pane container flex flex-col full height
  RENDER path header row flex items-center truncate
  RENDER file list region flex-1 overflow-y-auto with CSS grid rows per file
  RENDER footer flex items-center justify-between when status non-empty
```

## CodeLocations

// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: map files workspace implementing sources for this IMPL

// FILE: src/app/files/components/HelpOverlay.tsx — lg:grid-cols-2 responsive category grid
// FILE: src/app/files/components/SortDialog.tsx — w-96 max-w-[90vw]
// FILE: src/app/files/components/ColumnOrderDialog.tsx — w-96 max-w-[90vw]
// FILE: src/app/files/components/PaneOrderDialog.tsx — w-[28rem] max-w-[90vw]
// FILE: src/app/files/components/LayoutPickerPopover.tsx — w-72 max-w-[90vw]
// FILE: src/app/files/components/FilePane.tsx — flex flex-col pane shell and flex-1 scrolling list
