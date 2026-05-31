# IMPL-MOUSE_SUPPORT essence pseudocode

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: Mouse click focus, file column clipboard helpers, and metadata-cell context menu

## MouseClickFocus

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — switch focusIndex when user clicks pane via FilePane onFocusRequest onMouseDown; file row clicks bubble to pane container.

CONTRACT MouseClickFocus
  INPUT: pane index from WorkspaceView map callback, mouseDown on FilePane container
  OUTPUT: focusIndex updated to clicked pane
  DATA: focusIndex state in WorkspaceView

PROCEDURE IMPL-MOUSE_SUPPORT_MouseClickFocus(context)
  ON FilePane container mouseDown CALL onFocusRequest
  SET focusIndex to clicked pane index
  ALLOW file row clicks to bubble to pane container for same focus switch

## FILE_COLUMN_CLIPBOARD

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how — pure helpers format clipboard text and resolve cross-pane paths by cursor filename across workspace pane listings.

CONTRACT FILE_COLUMN_CLIPBOARD
  INPUT: file FileStat; paneFilesList readonly FileStat[][]
  OUTPUT: clipboard strings; CrossPanePathEntry[]
  DATA: cursor filename match key = file.name basename

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

## FILE_COLUMN_CONTEXT_MENU

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how — standalone FileColumnContextMenu component for unit tests; production FilePane uses UNIFIED_ROW_CONTEXT_MENU clipboard section instead

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

## UNIFIED_ROW_CONTEXT_MENU

// [IMPL-MOUSE_SUPPORT] [IMPL-FILE_PANE] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how — FilePane row and metadata-cell right-click open one ContextMenu portal with file ops, optional Set as Base directory on directories, and clipboard section when paneFilesList provided

CONTRACT UNIFIED_ROW_CONTEXT_MENU
  INPUT: contextMenu state from FilePane, paneFilesList, file operation handlers, onSetBaseDirectory for directories
  OUTPUT: single role=menu File operations menu; no separate column-only portal in FilePane
  DATA: showClipboardSection when marks empty and paneFilesList defined; data-testid=file-column-context-menu on clipboard wrapper

PROCEDURE UNIFIED_ROW_CONTEXT_MENU(context)
  RENDER ContextMenu portal at click coordinates
  RENDER file ops section (copy, move, rename, delete) when handlers provided
  IF directory AND onSetBaseDirectory THEN RENDER SET_BASE_DIRECTORY_MENU item
  IF showClipboardSection THEN RENDER clipboard menuitems (same as FILE_COLUMN_CONTEXT_MENU actions)
  ON dismiss → clear FilePane contextMenu state

## SET_BASE_DIRECTORY_MENU

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-DIRECTORY_NAVIGATION]: how — row ContextMenu shows Set as Base directory for directory rows only; invokes onSetBaseDirectory then closes menu; file rows unchanged at seven items

CONTRACT SET_BASE_DIRECTORY_MENU
  INPUT: file.isDirectory, onSetBaseDirectory callback
  OUTPUT: eighth menu item when directory and handler provided
  DATA: placed after file ops divider before clipboard section

PROCEDURE SET_BASE_DIRECTORY_MENU(context)
  IF NOT file.isDirectory OR onSetBaseDirectory missing THEN RETURN
  RENDER menuitem Set as Base directory… data-testid=set-base-directory-menu-item
  ON click → onSetBaseDirectory() THEN onClose()
