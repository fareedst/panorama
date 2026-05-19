# IMPL-LINKED_NAV essence pseudocode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: Top-level Linked Pane Navigation Implementation: Add linkedMode boolean state to WorkspaceView, modify handleNavigate to sync with auto-disable, modify handleCursorMove for filename sync, modify handleSortChange for all-pane sync, refactor parent navigation to navigateToParent(paneIndex), add Parent .. button in FilePane header, add visual indicators in footer and pane headers, register link.toggle keybinding

## Summary contract

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-LINKED_NAV
  DATA: state and configuration per implementation_approach

## LinkedModeState

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

CONTRACT LinkedModeState
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_LinkedModeState(context)
  DATA linkedMode FROM layout.defaultLinkedMode OR true when unset
  DATA syncingRef AS Set of pane indexes currently receiving sync navigation
  IF pane index IN syncingRef THEN skip initiating linked sync for that navigation

## LinkToggle

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: toggle linkedMode on link.toggle keybinding and L key

CONTRACT LinkToggle
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_LinkToggle(context)
  ON link.toggle FLIP linkedMode boolean
  IF WHEN linkedMode AND panes.length at least 2 THEN show link badge in footer

## CursorSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: sync cursor to same filename in all panes when linkedMode ON

CONTRACT CursorSynchronization
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_CursorSynchronization(context)
  // INPUT paneIndex, newCursor clamped to file list bounds
  IF linkedMode AND panes.length greater than 1 THEN read cursorFilename from source pane
  FOR each other pane FIND index WHERE file.name equals cursorFilename
  IF match THEN set cursor to matchIndex AND queue scrollTrigger
  IF no match THEN set cursor to minus one for that pane

## GracefulDegradation

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: log warning and continue when filename not found in linked pane

CONTRACT GracefulDegradation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_GracefulDegradation(context)
  IF matchIndex is minus one THEN do not throw
  // CONTINUE other panes without disabling linkedMode solely for missing filename
  CALL CONTINUE other panes without disabling linkedMode solely for missing filename

## ScrollSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: trigger scrollIntoView center smooth on linked panes after cursor sync

CONTRACT ScrollSynchronization
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_ScrollSynchronization(context)
  SET scrollTriggers map paneIndex to target cursor row
  // FilePane ON scrollTrigger CALL scrollIntoView block center behavior smooth
  CALL FilePane ON scrollTrigger CALL scrollIntoView block center behavior smooth

## DownwardNavigation

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: append relative subdirectory path to each linked pane on initiating navigate

CONTRACT DownwardNavigation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_DownwardNavigation(context)
  IF isInitiatingNavigation AND linkedMode AND panes.length greater than 1
  // COMPUTE isDownward using normalized root paths and newPath prefix rules
  CALL COMPUTE isDownward using normalized root paths and newPath prefix rules
  // DERIVE relativePath from oldPath and newPath with root edge cases
  CALL DERIVE relativePath from oldPath and newPath with root edge cases
  FOR each non-source pane BUILD linkedTargetPath and fetch directory
  IF fetch ok THEN recurse handleNavigate for that pane AND increment successCount ELSE increment failureCount

## UpwardNavigation

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: move all linked panes up same number of directory levels

CONTRACT UpwardNavigation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_UpwardNavigation(context)
  // COMPUTE stepsUp from oldPath and newPath segment counts
  CALL COMPUTE stepsUp from oldPath and newPath segment counts
  FOR each non-source pane POP path segments stepsUp times toward root
  IF parent path fetch ok THEN handleNavigate linked pane

## AutoDisable

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: disable linkedMode when partial downward navigation failure

CONTRACT AutoDisable
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_AutoDisable(context)
  IF successCount greater than zero AND failureCount greater than zero THEN setLinkedMode false
  // LOG warning linked navigation disabled directory structures diverged
  CALL LOG warning linked navigation disabled directory structures diverged

## SortSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: apply sort criterion direction dirsFirst to all panes when linked

CONTRACT SortSynchronization
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_SortSynchronization(context)
  ON handleSortChange IF linkedMode THEN update every pane index
  // PRESERVE cursor on same filename after sortFiles per pane
  CALL PRESERVE cursor on same filename after sortFiles per pane

## VisualIndicators

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: show link badge in footer and pane headers when linkedMode and two or more panes

CONTRACT VisualIndicators
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_VisualIndicators(context)
  IF panes.length less than 2 THEN hide link badge even if linkedMode true
  // RENDER footer text with link emoji and Linked label when visible
  CALL RENDER footer text with link emoji and Linked label when visible

## ParentNavigationSync

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: navigateToParent calls handleNavigate so Backspace and Parent button sync linked panes

CONTRACT ParentNavigationSync
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_ParentNavigationSync(context)
  // SAVE cursor position for subdirectory name before parent move
  CALL SAVE cursor position for subdirectory name before parent move
  CALL handleNavigate with parent path for initiating pane
  // Parent button visible when path not root via FilePane onNavigateParent
  CALL Parent button visible when path not root via FilePane onNavigateParent

## ConfigDrivenLinkedMode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: initialize linkedMode from layout.defaultLinkedMode defaulting true

CONTRACT ConfigDrivenLinkedMode
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_ConfigDrivenLinkedMode(context)
  IF defaultLinkedMode false THEN start unlinked
  IF defaultLinkedMode omitted THEN default linked ON

## SinglePaneMode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: suppress linked UI when only one pane even if linkedMode true

CONTRACT SinglePaneMode
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-LINKED_NAV_SinglePaneMode(context)
  IF panes.length less than 2 THEN do not render link indicators

## CodeLocations

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — Link state management and synchronization logic
// FILE: src/app/files/components/FilePane.tsx — Link prop interface, Parent .. button UI, onNavigateParent callback
// FILE: src/app/files/WorkspaceView.test.tsx — Comprehensive test coverage
// FUNCTION: handleNavigate in src/app/files/WorkspaceView.tsx
// FUNCTION: handleCursorMove in src/app/files/WorkspaceView.tsx
// FUNCTION: handleSortChange in src/app/files/WorkspaceView.tsx
// FUNCTION: navigateToParent in src/app/files/WorkspaceView.tsx
// FUNCTION: link.toggle action handler in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-LINKED_NAV_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
