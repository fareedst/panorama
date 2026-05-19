# IMPL-RENAME_DIALOG essence pseudocode

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: Top-level Rename File Dialog and R-Key Handler: RenameDialog component, rename state in WorkspaceView, file.rename handler and onRename(file) callback; handleRenameConfirm calls POST /api/files rename then refreshes pane

## Summary contract

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-RENAME_DIALOG
  DATA: state and configuration per implementation_approach

## ContextMenu

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: call onRename(file) instead of onRename(); ContextMenu.test updated to expect onRename(mockFile)

CONTRACT ContextMenu
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_ContextMenu(context)
  // call onRename(file) instead of onRename()
  CALL call onRename(file) instead of onRename()
  // ContextMenu.test updated to expect onRename(mockFile)
  CALL ContextMenu.test updated to expect onRename(mockFile)

## FileRenameActionHandler

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: get pane.files[pane.cursor]; if file, setRenameDialog with file.path, file.name, focusIndex

CONTRACT FileRenameActionHandler
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_FileRenameActionHandler(context)
  // get pane.files[pane.cursor]
  CALL get pane.files[pane.cursor]
  // if file
  CALL if file
  // setRenameDialog with file.path
  CALL setRenameDialog with file.path
  // file.name
  CALL file.name
  // focusIndex
  CALL focusIndex

## FilePaneOnRename

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: (file: FileStat) => void; pass onRename={(file) => setRenameDialog(...)} so context menu opens dialog for that file

CONTRACT FilePaneOnRename
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_FilePaneOnRename(context)
  // (file: FileStat) => void
  CALL (file: FileStat) => void
  // pass onRename={(file) => setRenameDialog(...)} so context menu opens dialog for that file
  CALL pass onRename={(file) => setRenameDialog(...)} so context menu opens dialog for that file

## Footer

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: added 'R: Rename' hint

CONTRACT Footer
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_Footer(context)
  // added 'R: Rename' hint
  CALL added 'R: Rename' hint
  ON invalid input OR missing data THEN RETURN without mutation

## RenameDialogTsx

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: modal with initialName input, onConfirm(newName), onClose; ESC to cancel

CONTRACT RenameDialogTsx
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_RenameDialogTsx(context)
  // modal with initialName input
  CALL modal with initialName input
  // onConfirm(newName)
  CALL onConfirm(newName)
  // onClose
  CALL onClose
  // ESC to cancel
  CALL ESC to cancel

## WorkspaceView

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: renameDialog state { isOpen, filePath, fileName, paneIndex }; handleRenameConfirm(filePath, paneIndex, newName) builds dest path, POST operation rename, handleNavigate(paneIndex, dir)

CONTRACT WorkspaceView
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-RENAME_DIALOG_WorkspaceView(context)
  // renameDialog state { isOpen
  CALL renameDialog state { isOpen
  // filePath
  CALL filePath
  // fileName
  CALL fileName
  // paneIndex }
  CALL paneIndex }
  // handleRenameConfirm(filePath
  CALL handleRenameConfirm(filePath
  // paneIndex
  CALL paneIndex
  // newName) builds dest path
  CALL newName) builds dest path
  // POST operation rename
  CALL POST operation rename

## CodeLocations

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/components/RenameDialog.tsx — Rename modal component
// FILE: src/app/files/WorkspaceView.tsx — renameDialog state, handleRenameConfirm, file.rename handler, RenameDialog render, onRename to FilePane
// FILE: src/app/files/components/FilePane.tsx — onRename prop type (file: FileStat) => void
// FILE: src/app/files/components/ContextMenu.tsx — onRename(file) call and type
// FUNCTION: handleRenameConfirm in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-MOUSE_INTERACTION]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-RENAME_DIALOG_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
