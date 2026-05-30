# IMPL-PANE_REFRESH essence pseudocode

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Manual pane refresh via keybindings that re-invoke handleNavigate on current path(s)

## Summary contract

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: panes[], focusIndex, keybindings from config/files.yaml
  OUTPUT: refreshed directory listings without full page reload
  DATA: handleNavigate (fetch /api/files, sort, cursor restore, clear marks)
  CONTROL: pane.refresh pane-scoped; pane.refresh-all workspace-scoped in workspaceActionHandlers

## CONFIG_KEYBINDINGS

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: config/files.yaml registers pane.refresh (Ctrl+R) and pane.refresh-all (Ctrl+Shift+R) in pane-management category

CONTRACT ConfigKeybindings
  INPUT: config/files.yaml keybindings array
  OUTPUT: matchKeybinding resolves pane.refresh and pane.refresh-all
  DATA: category pane-management; Ctrl+R and Ctrl+Shift+R modifiers

PROCEDURE IMPL-PANE_REFRESH_ConfigKeybindings()
  REGISTER key Ctrl+R action pane.refresh category pane-management
  REGISTER key Ctrl+Shift+R action pane.refresh-all category pane-management
  ASSERT keybind system preventDefault blocks browser full-page reload on Ctrl+R

## PANE_REFRESH_HANDLER

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh action calls handleNavigate(focusIndex, pane.path) for focused pane only

CONTRACT PaneRefreshHandler
  INPUT: focusIndex, panes[focusIndex].path
  OUTPUT: pane listing refetched and state updated via handleNavigate
  DATA: paneActionHandlers map entry

PROCEDURE IMPL-PANE_REFRESH_PaneRefreshHandler()
  SET pane := panes[focusIndex]
  IF pane missing THEN RETURN
  CALL handleNavigate(focusIndex, pane.path) asynchronously

## PANE_REFRESH_ALL_HANDLER

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh-all uses Promise.all over every pane index calling handleNavigate(idx, p.path)

CONTRACT PaneRefreshAllHandler
  INPUT: panes[] all indices
  OUTPUT: all panes refreshed in parallel
  DATA: workspaceActionHandlers map entry

PROCEDURE IMPL-PANE_REFRESH_PaneRefreshAllHandler()
  CALL Promise.all(panes.map((p, idx) => handleNavigate(idx, p.path)))

## DELEGATE_HANDLE_NAVIGATE

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [REQ-PANE_REFRESH]: how: handleNavigate already fetches listing, applies sort, restores cursor from history, clears marks — refresh reuses without new logic

CONTRACT DelegateHandleNavigate
  INPUT: paneIndex, current path (same as existing pane.path)
  OUTPUT: updated pane files, cursor, marks cleared
  DATA: fetchDirectoryListing or /api/files; buildPaneFromRawListing; globalDirectoryHistory.restoreCursorPosition

PROCEDURE IMPL-PANE_REFRESH_DelegateHandleNavigate(paneIndex, path)
  FETCH directory listing for path with pane activeDisplaySpecId
  APPLY sort and display filter via buildPaneFromRawListing
  RESTORE cursor from directory history when possible
  CLEAR marks on navigate (existing handleNavigate behavior)

## CodeLocations

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — pane.refresh and pane.refresh-all keybinding definitions
// FILE: src/app/files/WorkspaceView.tsx — paneActionHandlers pane.refresh; workspaceActionHandlers pane.refresh-all
// FILE: src/lib/toolbar.utils.ts — ACTION_ICON_MAP refresh-cw and refresh-ccw icons

## ErrorHandling

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [REQ-PANE_REFRESH]: how: handleNavigate catch logs fetch failure; refresh does not add separate error UI

PROCEDURE IMPL-PANE_REFRESH_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  DELEGATE to handleNavigate error path (console.error, pane state unchanged on failure)
