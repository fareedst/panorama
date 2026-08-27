# IMPL-MOUSE_SUPPORT essence pseudocode

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: Mouse click focus, file column clipboard helpers, and metadata-cell context menu

## MouseClickFocus

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — switch focusIndex when user clicks pane via FilePane onFocusRequest onMouseDown; file row clicks bubble to pane container.

```
IMPL-MOUSE_SUPPORT_MouseClickFocus(context):
  INPUT: pane index from WorkspaceView map callback, mouseDown on FilePane container
  OUTPUT: focusIndex updated to clicked pane
  DATA: focusIndex state in WorkspaceView
  PRE: FilePane mounted with onFocusRequest callback
  POST: focusIndex equals clicked pane index
  EFFECTS: State
  TERMINATION: total
  ON FilePane container mouseDown CALL onFocusRequest
  SET focusIndex to clicked pane index
  ALLOW file row clicks to bubble to pane container for same focus switch
```

## FILE_COLUMN_CLIPBOARD

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how — pure helpers format clipboard text and resolve cross-pane paths by cursor filename across workspace pane listings.

```
IMPL-MOUSE_SUPPORT_FormatCursorFilenameForClipboard(file):
  INPUT: file FileStat
  OUTPUT: clipboard string (basename)
  DATA: file.name
  PRE: file with name present
  POST: returns file.name
  EFFECTS: pure
  TERMINATION: total
  RETURN file.name

IMPL-MOUSE_SUPPORT_FormatAbsolutePathForClipboard(file):
  INPUT: file FileStat
  OUTPUT: absolute path string
  DATA: file.path
  PRE: file with path present
  POST: returns file.path
  EFFECTS: pure
  TERMINATION: total
  RETURN file.path

IMPL-MOUSE_SUPPORT_ResolveCrossPanePathsForFilename(paneFilesList, filename):
  INPUT: paneFilesList readonly FileStat[][], filename string
  OUTPUT: CrossPanePathEntry[] { paneIndex, path }
  DATA: cursor filename match key = file.name basename
  PRE: paneFilesList and filename defined
  POST: entries for each pane containing matching filename
  EFFECTS: pure
  TERMINATION: total
  FOR each paneIndex IN paneFilesList
    match := files.find(f => f.name === filename)
    IF match THEN push { paneIndex, path: match.path }
  RETURN entries

IMPL-MOUSE_SUPPORT_FormatCrossPanePathsForClipboard(entries):
  INPUT: CrossPanePathEntry[]
  OUTPUT: multi-line clipboard string
  PRE: entries array defined
  POST: formatted "Pane N: path" lines joined by newline
  EFFECTS: pure
  TERMINATION: total
  RETURN entries.map(({ paneIndex, path }) => "Pane " + (paneIndex + 1) + ": " + path).join("\n")

IMPL-MOUSE_SUPPORT_CopyTextToClipboard(text):
  INPUT: text string
  OUTPUT: clipboard write side effect
  PRE: navigator.clipboard.writeText available
  POST: text written to clipboard OR error thrown
  EFFECTS: IO
  FAILURE_MODES: Clipboard API unavailable → throw Error
  TERMINATION: total
  IF navigator.clipboard.writeText available THEN await writeText(text)
  ELSE throw Error("Clipboard API unavailable")
```

## FILE_COLUMN_CONTEXT_MENU

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how — standalone FileColumnContextMenu component for unit tests; production FilePane uses UNIFIED_ROW_CONTEXT_MENU clipboard section instead

```
IMPL-MOUSE_SUPPORT_FileColumnContextMenu(context):
  INPUT: x, y, file, paneFilesList, copyText injectable, onClose
  OUTPUT: portal menu; clipboard side effect; onClose after copy or dismiss
  DATA: crossPaneEntries from resolveCrossPanePathsForFilename
  PRE: coordinates and file defined; copyText injectable
  POST: menu rendered or dismissed; copy invokes onClose
  EFFECTS: IO, State
  TERMINATION: total
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

## UNIFIED_ROW_CONTEXT_MENU

// [IMPL-MOUSE_SUPPORT] [IMPL-FILE_PANE] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how — FilePane row and metadata-cell right-click open one ContextMenu portal with file ops, optional Set as Base directory on directories, and clipboard section when paneFilesList provided

```
IMPL-MOUSE_SUPPORT_UnifiedRowContextMenu(context):
  INPUT: contextMenu state from FilePane, paneFilesList, file operation handlers, onSetBaseDirectory for directories
  OUTPUT: single role=menu File operations menu; no separate column-only portal in FilePane
  DATA: showClipboardSection when marks empty and paneFilesList defined; data-testid=file-column-context-menu on clipboard wrapper
  PRE: contextMenu open with coordinates and target file
  POST: menu sections rendered per handler availability; dismiss clears FilePane contextMenu state
  EFFECTS: IO, State
  TERMINATION: total
  RENDER ContextMenu portal at click coordinates
  RENDER file ops section (copy, move, rename, delete) when handlers provided
  IF directory AND onSetBaseDirectory THEN RENDER SET_BASE_DIRECTORY_MENU item
  IF onTouch THEN RENDER Touch… menu item (REQ-TOUCH_MTIME)
  // [IMPL-MOUSE_SUPPORT] [IMPL-EXECUTE_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-PANE_COMMAND_EXEC]: how — Execute… menu item when onExecute provided; after Touch, before Delete
  IF onExecute THEN RENDER Execute… menu item
  IF showClipboardSection THEN RENDER clipboard menuitems (same as FILE_COLUMN_CONTEXT_MENU actions)
  ON dismiss → clear FilePane contextMenu state
```

## SET_BASE_DIRECTORY_MENU

// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-DIRECTORY_NAVIGATION]: how — row ContextMenu shows Set as Base directory for directory rows only; invokes onSetBaseDirectory then closes menu; file rows unchanged at seven items

```
IMPL-MOUSE_SUPPORT_SetBaseDirectoryMenu(context):
  INPUT: file.isDirectory, onSetBaseDirectory callback
  OUTPUT: eighth menu item when directory and handler provided
  DATA: placed after file ops divider before clipboard section
  PRE: context menu open for row file
  POST: menu item rendered for directories with handler OR no item when file row
  EFFECTS: State
  TERMINATION: total
  IF NOT file.isDirectory OR onSetBaseDirectory missing THEN RETURN
  RENDER menuitem Set as Base directory… data-testid=set-base-directory-menu-item
  ON click → onSetBaseDirectory() THEN onClose()
```
