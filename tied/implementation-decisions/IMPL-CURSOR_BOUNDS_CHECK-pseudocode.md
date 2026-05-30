# IMPL-CURSOR_BOUNDS_CHECK essence pseudocode

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Top-level cursor bounds validation — guard requires cursor >= 0 and cursor < files.length before pane.files[cursor] access in handleNavigate

## Summary contract

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: prevent undefined currentFile when cursor is -1 during directory navigation (e.g. after CopyAll)

CONTRACT Summary
  INPUT: pane with files[], cursor index
  OUTPUT: saveCursorPosition only when cursor indexes a real file row
  DATA: globalDirectoryHistory.saveCursorPosition(paneIndex, path, fileName, cursor, scrollTop)
  CONTROL: runs at start of handleNavigate before fetchDirectoryListing

## InvalidCursorRootCause

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: prior guard used only cursor < files.length; cursor -1 passed and pane.files[-1] was undefined

CONTRACT InvalidCursorRootCause
  INPUT: pane.cursor = -1, pane.files.length > 0
  OUTPUT: prior bug — guard true, array access undefined
  DATA: JavaScript negative index does not throw on length check alone

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_InvalidCursorRootCause(pane)
  IF pane.cursor < pane.files.length AND pane.cursor >= 0 IS FALSE
    WHEN pane.cursor < 0 THEN accessing pane.files[pane.cursor] yields undefined
    CRASH risk on .name when only upper bound checked

## SaveCursorGuard

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: add cursor >= 0 to guard before saveCursorPosition and pane.files[cursor] read

CONTRACT SaveCursorGuard
  INPUT: paneIndex, pane state
  OUTPUT: cursor position saved or skipped
  DATA: currentFile := pane.files[pane.cursor] only when in range [0, files.length - 1]

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_SaveCursorGuard(paneIndex, pane)
  IF pane.files.length = 0 THEN RETURN
  IF pane.cursor < 0 OR pane.cursor >= pane.files.length THEN RETURN
  currentFile := pane.files[pane.cursor]
  CALL globalDirectoryHistory.saveCursorPosition(
    paneIndex, pane.path, currentFile.name, pane.cursor, scrollTop)
  CONTINUE handleNavigate listing fetch and restore

## CodeLocations

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleNavigate save-cursor block
// FUNCTION: handleNavigate in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: skip save when out of range; navigation proceeds without throwing

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_on_error(context, error)
  Guard prevents invalid array access
  No alternate cursor mutation in this block
