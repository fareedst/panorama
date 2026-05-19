# IMPL-DIR_HISTORY essence pseudocode

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: Top-level Directory History with localStorage Bookmarks: Map-based history in React state, localStorage for bookmarks

## Summary contract

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-DIR_HISTORY
  DATA: state and configuration per implementation_approach

## SaveCursorPosition

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: persist pane cursor filename and index per directory path

CONTRACT SaveCursorPosition
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-DIR_HISTORY_SaveCursorPosition(context)
  // INPUT paneIndex directoryPath filename cursor index
  // STORE in globalDirectoryHistory map keyed by pane and path
  CALL STORE in globalDirectoryHistory map keyed by pane and path

## RestoreCursorPosition

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: on navigate back find filename in new listing and set cursor

CONTRACT RestoreCursorPosition
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-DIR_HISTORY_RestoreCursorPosition(context)
  // LOOKUP saved entry for paneIndex and path
  CALL LOOKUP saved entry for paneIndex and path
  // FIND index of filename in files name list
  CALL FIND index of filename in files name list
  IF found RETURN cursor index ELSE RETURN zero

## CodeLocations

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.history.ts — History management
// FILE: src/lib/files.bookmarks.ts — Bookmark management
// FUNCTION: saveCursorPosition in src/lib/files.history.ts

## ErrorHandling

// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-DIR_HISTORY_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
