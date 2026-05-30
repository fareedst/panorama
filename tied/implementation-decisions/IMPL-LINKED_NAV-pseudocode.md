# IMPL-LINKED_NAV essence pseudocode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: Linked pane navigation — shared directory moves, filename cursor sync, sort sync, auto-disable on partial failure, parent navigation via handleNavigate

## Summary contract

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: how: linkedMode boolean plus syncingRef prevent re-entrant sync; only initiating navigation propagates to other panes

CONTRACT Summary
  INPUT: pane operations (navigate, cursor, sort, parent) on WorkspaceView state
  OUTPUT: synchronized panes OR linkedMode cleared on divergence
  DATA: linkedMode from layout.defaultLinkedMode default true; syncingRef Set of pane indexes
  CONTROL: linking requires panes.length >= 2 for UI and toggle; single pane suppresses badges

## LinkedModeStateAndSyncGuard

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

CONTRACT LinkedModeStateAndSyncGuard
  INPUT: paneIndex initiating call
  OUTPUT: isInitiatingNavigation flag
  DATA: syncingRef Set

PROCEDURE IMPL-LINKED_NAV_LinkedModeStateAndSyncGuard(paneIndex)
  INIT linkedMode FROM restoreUi OR layoutConfig.defaultLinkedMode OR true
  isInitiating := NOT syncingRef.has(paneIndex)
  WHEN syncing pane receives navigate skip initiating linked branch

## LinkToggle

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: toggle linkedMode on link.toggle keybinding and L key

CONTRACT LinkToggle
  INPUT: link.toggle action OR L key via registry
  OUTPUT: flipped linkedMode when at least two panes
  DATA: actionHandlers link.toggle entry

PROCEDURE IMPL-LINKED_NAV_LinkToggle()
  IF panes.length < 2 THEN RETURN without toggle
  setLinkedMode NOT previous value

## DownwardNavigationSync

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: append relative subdirectory path to each linked pane on initiating navigate

CONTRACT DownwardNavigationSync
  INPUT: source paneIndex, oldPath, newPath
  OUTPUT: other panes navigated to linkedTargetPath OR failure counted
  DATA: normalizedOld normalizedNew; relativePath slice rules for root

PROCEDURE IMPL-LINKED_NAV_DownwardNavigationSync(paneIndex, oldPath, newPath)
  IF NOT isInitiating OR NOT linkedMode OR panes < 2 THEN RETURN
  COMPUTE isDownward from prefix rules AND root edge cases
  IF NOT isDownward THEN skip downward branch
  DERIVE relativePath from oldPath newPath (root uses slice(1) not slice(2))
  successCount := 1 failureCount := 0
  FOR each other pane i
    ADD i to syncingRef
    linkedTargetPath := join linkedPane.path and relativePath normalize slashes
    FETCH api files path linkedTargetPath
    IF ok array listing THEN await handleNavigate(i, linkedTargetPath) successCount++
    ELSE failureCount++ LOG warn
    REMOVE i from syncingRef
  IF successCount > 0 AND failureCount > 0 THEN setLinkedMode false LOG diverged warning

## UpwardNavigationSync

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: move all linked panes up same number of directory levels

CONTRACT UpwardNavigationSync
  INPUT: source oldPath newPath
  OUTPUT: other panes parent paths updated via handleNavigate
  DATA: stepsUp segment count difference; root normalization for isUpward

PROCEDURE IMPL-LINKED_NAV_UpwardNavigationSync(oldPath, newPath)
  IF NOT isUpward per normalizedNew and oldPath prefix rules THEN RETURN
  stepsUp := segment count old minus new
  FOR each other pane POP stepsUp path segments toward root
  IF fetch parent ok THEN handleNavigate linked pane to linkedTargetPath

## CursorSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: sync cursor to same filename in all panes when linkedMode ON

CONTRACT CursorSynchronization
  INPUT: paneIndex, newCursor
  OUTPUT: matching cursors and scrollTriggers map
  DATA: crossPaneVisibilityResult.displayFilesByPane for visible rows

PROCEDURE IMPL-LINKED_NAV_CursorSynchronization(paneIndex, newCursor)
  CLAMP cursor to visible file list bounds for source pane
  IF linkedMode AND panes >= 2 AND cursor in range
  READ cursorFilename from visible file at cursor
  FOR other panes FIND matchIndex by file.name equals cursorFilename in linked visible list
  IF matchIndex >= 0 SET cursor matchIndex AND queue scrollTrigger
  ELSE SET cursor -1 for that pane (no throw)

## ScrollSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: trigger scrollIntoView center smooth on linked panes after cursor sync

CONTRACT ScrollSynchronization
  INPUT: scrollTriggers Map paneIndex to row index
  OUTPUT: FilePane scrollIntoView block center smooth
  DATA: scrollTrigger prop per FilePane

PROCEDURE IMPL-LINKED_NAV_ScrollSynchronization()
  AFTER setPanes APPLY setScrollTriggers from cursor sync
  FilePane ON scrollTrigger effect CALL element scrollIntoView smooth center

## SortSynchronization

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: apply sort criterion direction dirsFirst to all panes when linked

CONTRACT SortSynchronization
  INPUT: criterion, direction, dirsFirst, optional singlePaneOnly
  OUTPUT: all panes sorted with preserved filename cursor when linked
  DATA: sortFiles helper

PROCEDURE IMPL-LINKED_NAV_SortSynchronization(criterion, direction, dirsFirst, options)
  panesToUpdate := IF singlePaneOnly OR NOT linked OR panes<2 THEN [focusIndex] ELSE all indexes
  FOR each paneIdx SORT files APPLY settings FIND cursor on same filename after sort

## ParentNavigationSync

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: navigateToParent calls handleNavigate so Backspace and Parent button sync linked panes

CONTRACT ParentNavigationSync
  INPUT: paneIndex
  OUTPUT: parent directory navigation with linked upward sync
  DATA: globalDirectoryHistory saveCursorPosition on subdir name

PROCEDURE IMPL-LINKED_NAV_ParentNavigationSync(paneIndex)
  COMPUTE parentPath pop last segment OR root
  IF already at root THEN RETURN
  SAVE cursor hint subdir name on parent path in directory history
  AWAIT handleNavigate(paneIndex, parentPath) to run upward linked branch
  FilePane shows Parent button when not root via onNavigateParent callback

## VisualIndicators

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: show link badge in footer and pane headers when linkedMode and two or more panes

CONTRACT VisualIndicators
  INPUT: linkedMode, panes.length
  OUTPUT: footer and header link badge visible or hidden
  DATA: copy label Linked with link emoji

PROCEDURE IMPL-LINKED_NAV_VisualIndicators()
  IF panes.length < 2 THEN hide badges even if linkedMode true
  ELSE WHEN linkedMode show footer and per-pane header indicators

## ConfigDrivenLinkedMode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: initialize linkedMode from layout.defaultLinkedMode defaulting true

CONTRACT ConfigDrivenLinkedMode
  INPUT: layoutConfig.defaultLinkedMode, restoreUi.linkedMode
  OUTPUT: initial linkedMode state
  DATA: config defaultLinkedMode true in config.ts

PROCEDURE IMPL-LINKED_NAV_ConfigDrivenLinkedMode()
  USE restoreUi.linkedMode WHEN mesh restore present
  ELSE USE layoutConfig.defaultLinkedMode
  WHEN omitted default linked ON

## SinglePaneMode

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: suppress linked UI when only one pane even if linkedMode true

CONTRACT SinglePaneMode
  INPUT: panes.length
  OUTPUT: no link UI; toggle no-op
  DATA: same as VisualIndicators guard

PROCEDURE IMPL-LINKED_NAV_SinglePaneMode()
  REQUIRE panes.length >= 2 for toggle and badges

## CodeLocations

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: map implementing and verifying source files

// FILE: src/app/files/WorkspaceView.tsx — handleNavigate, handleCursorMove, handleSortChange, navigateToParent, link.toggle
// FILE: src/app/files/components/FilePane.tsx — Parent button, link prop, onNavigateParent
// FILE: src/app/files/WorkspaceView.test.tsx — TEST-LINKED_PANES suite
// FILE: src/lib/config.ts — defaultLinkedMode

## ErrorHandling

// [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: how: missing target logs warn; partial downward failure disables link; missing filename sets cursor -1 without disabling

PROCEDURE IMPL-LINKED_NAV_on_error(context, error)
  ON fetch failure for linked target INCREMENT failureCount continue
  ON partial downward success AND failure setLinkedMode false
  ON missing filename in pane SET cursor -1 LOG optional warn only
