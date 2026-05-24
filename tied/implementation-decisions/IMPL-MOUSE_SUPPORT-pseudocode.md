# IMPL-MOUSE_SUPPORT essence pseudocode

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: Top-level Mouse and Touch Interaction Implementation: Mouse and Touch Interaction Implementation

## Summary contract

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-MOUSE_SUPPORT
  DATA: state and configuration per implementation_approach

## MouseClickFocus

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: switch focusIndex when user clicks pane via FilePane onFocusRequest onMouseDown

CONTRACT MouseClickFocus
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-MOUSE_SUPPORT_MouseClickFocus(context)
  // INPUT pane index from WorkspaceView map callback
  ON FilePane container mouseDown CALL onFocusRequest
  SET focusIndex to clicked pane index
  // BUBBLE file row clicks to pane container for same focus switch
  CALL BUBBLE file row clicks to pane container for same focus switch

## FILE_COLUMN_CLIPBOARD

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how: pure helpers format clipboard text and resolve cross-pane paths by cursor filename (file.name) across workspace pane listings

```
CONTRACT FILE_COLUMN_CLIPBOARD
  INPUT: file: FileStat; paneFilesList: readonly FileStat[][]
  OUTPUT: clipboard strings; CrossPanePathEntry[]
  DATA: cursor filename = file.name (basename match key)

PROCEDURE formatCursorFilenameForClipboard(file)
  RETURN file.name

PROCEDURE formatAbsolutePathForClipboard(file)
  RETURN file.path

PROCEDURE resolveCrossPanePathsForFilename(paneFilesList, filename)
  FOR each paneIndex IN paneFilesList
    match := files.find(f => f.name === filename)
    IF match THEN push { paneIndex, path: match.path }
  RETURN entries

PROCEDURE formatCrossPanePathsForClipboard(entries)
  RETURN entries.map(({ paneIndex, path }) => "Pane " + (paneIndex + 1) + ": " + path).join("\n")

PROCEDURE copyTextToClipboard(text)
  IF navigator.clipboard.writeText available THEN await writeText(text)
  ELSE throw Error("Clipboard API unavailable")
```

## FILE_COLUMN_CONTEXT_MENU

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: portal FileColumnContextMenu on metadata cell right-click; copy filename, absolute path, or cross-pane paths; disable cross-pane action when no listing matches

```
CONTRACT FILE_COLUMN_CONTEXT_MENU
  INPUT: x, y, file, paneFilesList, copyText injectable, onClose
  OUTPUT: portal menu; clipboard side effect; onClose after copy or dismiss
  DATA: crossPaneEntries from resolveCrossPanePathsForFilename

PROCEDURE FILE_COLUMN_CONTEXT_MENU(context)
  crossPaneEntries := resolveCrossPanePathsForFilename(paneFilesList, file.name)
  crossPaneText := formatCrossPanePathsForClipboard(crossPaneEntries)
  RENDER portal menu data-testid=file-column-context-menu
    menuitem Copy filename → formatCursorFilenameForClipboard(file)
    menuitem Copy path → formatAbsolutePathForClipboard(file)
    menuitem Copy paths in all panes (count) disabled WHEN crossPaneEntries.length === 0
  ADJUST left/top to stay within viewport
  ON outside mousedown OR Escape → onClose
  ON menuitem click → await copyText(text) THEN onClose
```

## CodeLocations

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: map implementing and verifying source files for this IMPL

// FILE: src/lib/file-column-clipboard.ts — FILE_COLUMN_CLIPBOARD helpers
// FILE: src/lib/file-column-clipboard.test.ts — unit tests
// FILE: src/app/files/components/FileColumnContextMenu.tsx — FILE_COLUMN_CONTEXT_MENU component
// FILE: src/app/files/components/FileColumnContextMenu.test.tsx — component unit tests
// FILE: src/app/files/components/ContextMenu.tsx — row file operations context menu (existing)

## ErrorHandling

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-MOUSE_SUPPORT_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
