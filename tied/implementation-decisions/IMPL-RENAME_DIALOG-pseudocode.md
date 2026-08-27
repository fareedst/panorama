# IMPL-RENAME_DIALOG essence pseudocode

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: Single-file rename via RenameDialog modal — R keybind and context menu both open dialog; confirm POSTs rename then refreshes pane

## Summary contract

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: how: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-RENAME_DIALOG_Summary():
  INPUT: cursor file or context-menu target file, paneIndex, newName from dialog
  OUTPUT: file renamed on disk via POST /api/files; pane listing refreshed
  DATA: renameDialog state { isOpen, filePath, fileName, paneIndex }; displaySpecPayload for active spec
  PRE: target file and pane index available
  POST: file renamed on disk OR error surfaced; listing refreshed on success
  EFFECTS: State, IO
  CONTROL: context menu Rename hidden when marks.size greater than zero
  TERMINATION: total
```

## RENAME_DIALOG_UI

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: modal with initialName input, focus+select on open, submit trimmed newName, ESC cancels

```
IMPL-RENAME_DIALOG_RenameDialogUi():
  INPUT: isOpen, initialName, onConfirm(newName), onClose
  OUTPUT: modal rendered or null when closed
  DATA: local name state synced from initialName
  PRE: dialog props defined
  POST: modal closed on cancel or successful confirm; trimmed name submitted when changed
  EFFECTS: State, IO
  TERMINATION: total
  IF NOT isOpen THEN RETURN null
  ON open FOCUS and SELECT text input
  ON form submit IF trimmed name non-empty AND differs from initialName THEN onConfirm(trimmed) AND onClose
  ON submit IF trimmed equals initialName THEN onClose only
  ON Escape key THEN onClose
  ON backdrop click THEN onClose
```

## FILE_RENAME_KEYBIND

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: file.rename handler reads visibleFiles[pane.cursor]; opens renameDialog with path, name, focusIndex

```
IMPL-RENAME_DIALOG_FileRenameKeybind():
  INPUT: focusIndex, visibleFiles, pane.cursor
  OUTPUT: renameDialog.isOpen true with target file metadata
  DATA: paneActionHandlers map; key r in file-operations category
  PRE: focused pane with cursor on visible file
  POST: renameDialog state open with file path, name, paneIndex OR no-op when no file
  EFFECTS: State
  TERMINATION: total
  SET file := visibleFiles[pane.cursor]
  IF file missing THEN RETURN
  SET renameDialog := { isOpen: true, filePath: file.path, fileName: file.name, paneIndex: focusIndex }
```

## CONTEXT_MENU_RENAME

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-MOUSE_INTERACTION] [REQ-FILE_OPERATIONS]: how: ContextMenu calls onRename(file) with right-clicked file; hidden when marks non-empty

```
IMPL-RENAME_DIALOG_ContextMenuRename():
  INPUT: file FileStat, marks Set, onRename callback
  OUTPUT: rename dialog opened for that file via WorkspaceView setRenameDialog
  DATA: ContextMenu portal menuitem Rename with R hint in menu only
  PRE: context menu open for file row
  POST: onRename invoked with FileStat OR Rename menuitem hidden
  EFFECTS: State
  TERMINATION: total
  IF marks.size greater than zero OR onRename missing OR file missing THEN hide Rename menuitem
  ON Rename click CALL onRename(file) AND close menu
  ASSERT onRename invoked with FileStat argument not zero-arity
```

## FILE_PANE_WIRING

// [IMPL-RENAME_DIALOG] [REQ-MOUSE_INTERACTION] [REQ-FILE_OPERATIONS]: how: FilePane onRename prop (file: FileStat) => void passed from WorkspaceView per pane index

```
IMPL-RENAME_DIALOG_FilePaneWiring(index, file):
  INPUT: pane index, file from context menu
  OUTPUT: setRenameDialog with file.path, file.name, paneIndex
  DATA: FilePane passes onRename to ContextMenu
  PRE: FilePane wired with onRename callback
  POST: renameDialog state set for target file and pane index
  EFFECTS: State
  TERMINATION: total
  CALL setRenameDialog({ isOpen: true, filePath: file.path, fileName: file.name, paneIndex: index })
```

## HANDLE_RENAME_CONFIRM

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS]: how: build dest path with path.join(dirname, newName); POST operation rename; on success handleNavigate(paneIndex, dir)

```
IMPL-RENAME_DIALOG_HandleRenameConfirm(filePath, paneIndex, newName):
  INPUT: filePath, paneIndex, newName
  OUTPUT: dialog closed; listing refreshed in parent directory
  DATA: POST body { operation: rename, src, dest, displaySpecId? }
  PRE: filePath and non-empty newName defined
  POST: dialog closed; listing refreshed on success OR alert on failure
  EFFECTS: State, IO
  FAILURE_MODES: POST not ok → alert user; listing unchanged
  TERMINATION: total
  SET dir := path.dirname(filePath)
  SET newPath := path.join(dir, newName)
  CLOSE renameDialog
  POST /api/files { operation: rename, src: filePath, dest: newPath, ...displaySpecPayload(paneIndex) }
  IF response not ok THEN parse error AND alert user
  ELSE CALL handleNavigate(paneIndex, dir)
```

## CodeLocations

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/components/RenameDialog.tsx — rename modal component
// FILE: src/app/files/WorkspaceView.tsx — renameDialog state, handleRenameConfirm, file.rename handler, RenameDialog render
// FILE: src/app/files/components/FilePane.tsx — onRename prop forwarded to ContextMenu
// FILE: src/app/files/components/ContextMenu.tsx — onRename(file) menu action
// TEST: src/app/files/components/ContextMenu.test.tsx — onRename(mockFile) expectation

## ErrorHandling

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS]: how: rename POST failure alerts user; dialog already closed; pane listing unchanged until successful navigate

```
IMPL-RENAME_DIALOG_on_error(context, error):
  INPUT: error from rename POST or validation
  OUTPUT: user alert; pane listing unchanged
  PRE: rename POST failed after dialog closed
  POST: user alerted; listing left as before failed POST
  EFFECTS: IO
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ALERT "Rename failed:" + error message
  LEAVE pane listing as before failed POST
```
