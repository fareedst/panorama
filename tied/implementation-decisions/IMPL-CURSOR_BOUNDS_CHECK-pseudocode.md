# IMPL-CURSOR_BOUNDS_CHECK essence pseudocode

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Top-level Cursor Bounds Validation Fix: Add cursor >= 0 check to guard condition before accessing pane.files[pane.cursor]

## Summary contract

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-CURSOR_BOUNDS_CHECK
  DATA: state and configuration per implementation_approach

## RootCause

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Guard checked 'cursor < files.length' but not 'cursor >= 0

CONTRACT RootCause
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_RootCause(context)
  // Guard checked 'cursor < files.length' but not 'cursor >= 0
  CALL Guard checked 'cursor < files.length' but not 'cursor >= 0
  ON invalid input OR missing data THEN RETURN without mutation

## Solution

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Add 'cursor >= 0' to guard condition

CONTRACT Solution
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_Solution(context)
  // Add 'cursor >= 0' to guard condition
  CALL Add 'cursor >= 0' to guard condition
  ON invalid input OR missing data THEN RETURN without mutation

## WhenCursor1

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: -1 < 8 evaluates to true, guard passes but pane.files[-1] = undefined

CONTRACT WhenCursor1
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_WhenCursor1(context)
  // -1 < 8 evaluates to true
  CALL -1 < 8 evaluates to true
  // guard passes but pane.files[-1] = undefined
  CALL guard passes but pane.files[-1] = undefined

## EnsuresCursorIsIn

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: Ensures cursor is in valid range [0, files.length-1] before array access

CONTRACT EnsuresCursorIsIn
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_EnsuresCursorIsIn(context)
  // Ensures cursor is in valid range [0
  CALL Ensures cursor is in valid range [0
  // files.length-1] before array access
  CALL files.length-1] before array access

## CodeLocations

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleNavigate function guard condition for saving cursor position
// FUNCTION: handleNavigate in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-CURSOR_BOUNDS_CHECK_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
