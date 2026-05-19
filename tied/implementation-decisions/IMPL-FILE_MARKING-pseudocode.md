# IMPL-FILE_MARKING essence pseudocode

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: Top-level React State Mark Management: React useState with Set<string> per pane, keyboard and mouse handlers

## Summary contract

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILE_MARKING
  DATA: state and configuration per implementation_approach

## PaneMarkState

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: initialize per-pane marks as Set of filenames in PaneState

CONTRACT PaneMarkState
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_PaneMarkState(context)
  DATA pane.marks AS Set<string> keyed by file.name
  ON pane load OR directory refresh RETAIN marks for names still present in files list
  // SKIP marking parent directory entry (..)
  CALL SKIP marking parent directory entry (..)

## MarkToggle

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: toggle single file mark on m key or checkbox click via handleToggleMark

CONTRACT MarkToggle
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkToggle(context)
  // INPUT focused file row in active pane
  IF filename IN pane.marks THEN REMOVE filename ELSE ADD filename
  // UPDATE footer marked count display
  CALL UPDATE footer marked count display

## MarkWithSpace

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: mark focused file then advance cursor down one row (Space key)

CONTRACT MarkWithSpace
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkWithSpace(context)
  CALL MarkToggle for cursor file
  IF cursor not on last file THEN INCREMENT cursor index
  IF cursor on last file THEN leave cursor unchanged

## MarkAll

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: mark every file in pane on Shift+M via handleMarkAll

CONTRACT MarkAll
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkAll(context)
  SET pane.marks TO new Set of every file.name in pane.files
  // UPDATE footer marked count
  CALL UPDATE footer marked count

## InvertMarks

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: symmetric difference of marks on Ctrl+M via handleInvertMarks

CONTRACT InvertMarks
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_InvertMarks(context)
  FOR EACH file.name IN pane.files
  IF name IN pane.marks THEN REMOVE ELSE ADD
  // UPDATE footer marked count
  CALL UPDATE footer marked count

## ClearMarks

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: remove all marks on Escape via handleClearMarks

CONTRACT ClearMarks
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_ClearMarks(context)
  // CLEAR pane.marks
  CALL CLEAR pane.marks
  IF marks already empty THEN no error
  // UPDATE footer marked count to zero
  CALL UPDATE footer marked count to zero

## MarkPersistence

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: name-based Set survives re-sort and refresh per ARCH-MARKING_STATE

CONTRACT MarkPersistence
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkPersistence(context)
  ON sort OR filter OR reload files list
  // MATCH marks by filename string not row index
  CALL MATCH marks by filename string not row index
  // DROP marks for names no longer in listing
  CALL DROP marks for names no longer in listing

## MarkVisualFeedback

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: checkbox and bg-marked styling in FilePane per theme

CONTRACT MarkVisualFeedback
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkVisualFeedback(context)
  // RENDER checkbox per file row
  CALL RENDER checkbox per file row
  IF WHEN name IN pane.marks THEN checked state AND marked background class
  // DISPLAY footer as [markedCount/totalCount]
  CALL DISPLAY footer as [markedCount/totalCount]

## PerPaneIndependence

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: each pane maintains isolated mark Set

CONTRACT PerPaneIndependence
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_PerPaneIndependence(context)
  ON pane focus change DO NOT merge marks across panes
  // BULK operations use marks from source pane only
  CALL BULK operations use marks from source pane only

## EmptyDirectoryEdgeCases

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: mark keys on empty listing produce no footer count and no error

CONTRACT EmptyDirectoryEdgeCases
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_EmptyDirectoryEdgeCases(context)
  IF pane.files length is zero THEN omit marked footer text
  ON m OR Shift+M OR Escape WITH empty files THEN no throw

## MultiMarkWorkflow

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: compose mark-all, invert, clear, and toggle in one session

CONTRACT MultiMarkWorkflow
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MultiMarkWorkflow(context)
  // ALLOW sequential mark.toggle-cursor, mark.invert, mark.clear
  CALL ALLOW sequential mark.toggle-cursor, mark.invert, mark.clear
  // ALLOW mark.all followed by mark.toggle-cursor to reduce count
  CALL ALLOW mark.all followed by mark.toggle-cursor to reduce count

## MarkWithNavigation

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: preserve marks when cursor moves with arrow keys

CONTRACT MarkWithNavigation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkWithNavigation(context)
  ON navigate.up OR navigate.down DO NOT clear pane.marks
  // MARK count unchanged until explicit mark action
  CALL MARK count unchanged until explicit mark action

## MarkedCountDisplay

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: DISPLAY footer as [markedCount/totalCount] with highlight class when count greater than zero

CONTRACT MarkedCountDisplay
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_MARKING_MarkedCountDisplay(context)
  IF marks.size equals zero THEN hide marked footer segment
  IF marks.size greater than zero THEN show bracketed count with accent class

## CodeLocations

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — Mark state and handlers
// FILE: src/app/files/components/FilePane.tsx — Checkbox rendering
// FUNCTION: handleToggleMark in src/app/files/WorkspaceView.tsx
// FUNCTION: handleMarkAll in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILE_MARKING_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
