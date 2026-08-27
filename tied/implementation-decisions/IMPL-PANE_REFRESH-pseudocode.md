# IMPL-PANE_REFRESH essence pseudocode

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: Manual pane refresh via keybindings that re-invoke handleNavigate on current path(s)

## Summary contract

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-PANE_REFRESH_Summary():
  INPUT: panes[], focusIndex, keybindings from config/files.yaml
  OUTPUT: refreshed directory listings without full page reload
  DATA: handleNavigate (fetch /api/files, sort, cursor restore, clear marks)
  CONTROL: pane.refresh pane-scoped; pane.refresh-all workspace-scoped in workspaceActionHandlers
  PRE: WorkspaceView mounted with pane state and keybinding registry initialized
  POST: focused or all panes receive fresh listings via handleNavigate without full page reload
  EFFECTS: IO, State
  TERMINATION: total
```

## CONFIG_KEYBINDINGS

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: config/files.yaml registers pane.refresh (Ctrl+R) and pane.refresh-all (Ctrl+Shift+R) in pane-management category

```
IMPL-PANE_REFRESH_ConfigKeybindings():
  INPUT: config/files.yaml keybindings array
  OUTPUT: matchKeybinding resolves pane.refresh and pane.refresh-all
  DATA: category pane-management; Ctrl+R and Ctrl+Shift+R modifiers
  PRE: getFilesConfig returns keybindings including pane-management entries
  POST: pane.refresh and pane.refresh-all registered with correct modifiers and category
  EFFECTS: pure
  TERMINATION: total
  REGISTER key Ctrl+R action pane.refresh category pane-management
  REGISTER key Ctrl+Shift+R action pane.refresh-all category pane-management
  ASSERT keybind system preventDefault blocks browser full-page reload on Ctrl+R
```

## PANE_REFRESH_HANDLER

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh action calls handleNavigate(focusIndex, pane.path) for focused pane only

```
IMPL-PANE_REFRESH_PaneRefreshHandler():
  INPUT: focusIndex, panes[focusIndex].path
  OUTPUT: pane listing refetched and state updated via handleNavigate
  DATA: paneActionHandlers map entry
  PRE: focusIndex indexes a pane with valid path
  POST: handleNavigate invoked for focused pane only when pane exists
  EFFECTS: IO, State
  TERMINATION: total
  SET pane := panes[focusIndex]
  IF pane missing THEN RETURN
  CALL handleNavigate(focusIndex, pane.path) asynchronously
```

## PANE_REFRESH_ALL_HANDLER

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh-all uses Promise.all over every pane index calling handleNavigate(idx, p.path)

```
IMPL-PANE_REFRESH_PaneRefreshAllHandler():
  INPUT: panes[] all indices
  OUTPUT: all panes refreshed in parallel
  DATA: workspaceActionHandlers map entry
  PRE: panes array non-empty with valid paths
  POST: handleNavigate called once per pane index in parallel
  EFFECTS: IO, State
  TERMINATION: total
  CALL Promise.all(panes.map((p, idx) => handleNavigate(idx, p.path)))
```

## DELEGATE_HANDLE_NAVIGATE

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [REQ-PANE_REFRESH]: how: handleNavigate already fetches listing, applies sort, restores cursor from history, clears marks — refresh reuses without new logic

```
IMPL-PANE_REFRESH_DelegateHandleNavigate(paneIndex, path):
  INPUT: paneIndex, current path (same as existing pane.path)
  OUTPUT: updated pane files, cursor, marks cleared
  DATA: fetchDirectoryListing or /api/files; buildPaneFromRawListing; globalDirectoryHistory.restoreCursorPosition
  PRE: paneIndex valid; path is current pane directory
  POST: pane listing updated with sort/filter applied; cursor restored when possible; marks cleared
  EFFECTS: IO, State
  DATA_TRANSITION: pane files replaced from fresh listing; marks cleared on navigate
  TERMINATION: total
  FETCH directory listing for path with pane activeDisplaySpecId
  APPLY sort and display filter via buildPaneFromRawListing
  RESTORE cursor from directory history when possible
  CLEAR marks on navigate (existing handleNavigate behavior)
```

## CodeLocations

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — pane.refresh and pane.refresh-all keybinding definitions
// FILE: src/app/files/WorkspaceView.tsx — paneActionHandlers pane.refresh; workspaceActionHandlers pane.refresh-all
// FILE: src/lib/toolbar.utils.ts — ACTION_ICON_MAP refresh-cw and refresh-ccw icons

## ErrorHandling

// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [REQ-PANE_REFRESH]: how: handleNavigate catch logs fetch failure; refresh does not add separate error UI

```
IMPL-PANE_REFRESH_on_error(context, error):
  INPUT: fetch or navigation failure during refresh
  OUTPUT: logged diagnostic; pane state unchanged on failure
  PRE: handleNavigate error path active
  POST: no separate refresh error UI; pane state unchanged when fetch fails
  EFFECTS: IO
  FAILURE_MODES: LISTING_FETCH_FAILED
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  DELEGATE to handleNavigate error path (console.error, pane state unchanged on failure)
```
