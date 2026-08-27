# IMPL-CURSOR_BOUNDS_CHECK essence pseudocode

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Top-level cursor bounds validation — guard requires cursor >= 0 and cursor < files.length before pane.files[cursor] access in handleNavigate

## Summary contract

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: prevent undefined currentFile when cursor is -1 during directory navigation (e.g. after CopyAll)

```
IMPL-CURSOR_BOUNDS_CHECK_Summary():
  INPUT: pane with files[], cursor index
  OUTPUT: saveCursorPosition only when cursor indexes a real file row
  DATA: globalDirectoryHistory.saveCursorPosition(paneIndex, path, fileName, cursor, scrollTop)
  CONTROL: runs at start of handleNavigate before fetchDirectoryListing
  PRE: handleNavigate invoked with pane state including files[] and cursor index
  POST: saveCursorPosition called only when cursor in [0, files.length - 1]
  EFFECTS: State
  TERMINATION: total
```

## InvalidCursorRootCause

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: prior guard used only cursor < files.length; cursor -1 passed and pane.files[-1] was undefined

```
IMPL-CURSOR_BOUNDS_CHECK_InvalidCursorRootCause(pane):
  INPUT: pane.cursor = -1, pane.files.length > 0
  OUTPUT: prior bug — guard true, array access undefined
  DATA: JavaScript negative index does not throw on length check alone
  PRE: pane.files.length > 0 and pane.cursor < 0
  POST: upper-bound-only guard would pass while pane.files[cursor] is undefined
  EFFECTS: pure
  TERMINATION: total
  IF pane.cursor < pane.files.length AND pane.cursor >= 0 IS FALSE
    WHEN pane.cursor < 0 THEN accessing pane.files[pane.cursor] yields undefined
    CRASH risk on .name when only upper bound checked
```

## SaveCursorGuard

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: add cursor >= 0 to guard before saveCursorPosition and pane.files[cursor] read

```
IMPL-CURSOR_BOUNDS_CHECK_SaveCursorGuard(paneIndex, pane):
  INPUT: paneIndex, pane state
  OUTPUT: cursor position saved or skipped
  DATA: currentFile := pane.files[pane.cursor] only when in range [0, files.length - 1]
  PRE: paneIndex valid; pane.files is array
  POST: saveCursorPosition skipped when cursor out of range; navigation continues without throw
  EFFECTS: State
  DATA_TRANSITION: cursor position saved only when in-range; otherwise history unchanged
  FAILURE_MODES: OUT_OF_RANGE_CURSOR
  TERMINATION: total
  IF pane.files.length = 0 THEN RETURN
  IF pane.cursor < 0 OR pane.cursor >= pane.files.length THEN RETURN
  currentFile := pane.files[pane.cursor]
  CALL globalDirectoryHistory.saveCursorPosition(
    paneIndex, pane.path, currentFile.name, pane.cursor, scrollTop)
  CONTINUE handleNavigate listing fetch and restore
```

## CodeLocations

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleNavigate save-cursor block
// FILE: src/app/files/WorkspaceView.execute.test.tsx — handleNavigate refresh composition coverage
// FUNCTION: handleNavigate in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: skip save when out of range; navigation proceeds without throwing

```
IMPL-CURSOR_BOUNDS_CHECK_on_error(context, error):
  INPUT: pane with out-of-range cursor
  OUTPUT: navigation proceeds; no saveCursorPosition call
  PRE: cursor < 0 OR cursor >= files.length OR files.length = 0
  POST: no array access on pane.files[cursor]; handleNavigate continues
  EFFECTS: pure
  FAILURE_MODES: OUT_OF_RANGE_CURSOR
  TERMINATION: total
  Guard prevents invalid array access
  No alternate cursor mutation in this block
```
