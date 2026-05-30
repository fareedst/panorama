# IMPL-DIR_HISTORY essence pseudocode

## SAVE_CURSOR_POSITION
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Before leaving a directory, store filename, cursor index, scrollTop, and timestamp in per-pane Map keyed by path; update recent list.

```
SAVE_CURSOR_POSITION(paneId, path, filename, cursorIndex, scrollTop):
  INPUT: paneId number, path string, filename string, cursorIndex number, scrollTop number default 0
  OUTPUT: void; mutates histories Map<paneId, Map<path, DirectoryCursorState>>
  ENSURE paneHistory exists for paneId
  SET paneHistory[path] := { filename, cursorIndex, scrollTop, timestamp: now }
  CALL addRecentDirectory(paneId, path)
```

## RESTORE_CURSOR_POSITION
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: On revisit, prefer filename lookup in listing; fallback to saved index clamped to list bounds; default cursor 0 when no history.

```
RESTORE_CURSOR_POSITION(paneId, path, filenames):
  INPUT: paneId, path, filenames string[]
  OUTPUT: { cursor number, scrollTop number }
  IF no paneHistory for paneId THEN RETURN { cursor: 0, scrollTop: 0 }
  IF no state for path THEN RETURN { cursor: 0, scrollTop: 0 }
  idx := INDEX_OF(state.filename, filenames)
  IF idx >= 0 THEN RETURN { cursor: idx, scrollTop: state.scrollTop }
  fallback := MIN(state.cursorIndex, filenames.length - 1)
  RETURN { cursor: MAX(0, fallback), scrollTop: state.scrollTop }
  IF filenames empty THEN cursor := 0
```

## FIND_SUBDIRECTORY_IN_PARENT
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: When navigating up, locate current directory basename among parent listing directories only.

```
FIND_SUBDIRECTORY_IN_PARENT(currentPath, parentFiles):
  INPUT: currentPath string, parentFiles { name, isDirectory }[]
  OUTPUT: cursor index in parent list (0 when not found or at root)
  parts := SPLIT currentPath on "/" excluding empties
  IF parts empty THEN RETURN 0
  currentDirName := LAST(parts)
  idx := FIND_INDEX parentFiles WHERE isDirectory AND name = currentDirName
  RETURN idx IF idx >= 0 ELSE 0
```

## RECENT_DIRECTORIES
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Maintain LRU-ordered recent path list per pane (max 20); revisiting moves path to front.

```
ADD_RECENT_DIRECTORY(paneId, path):
  REMOVE existing entry for path if present
  PREPEND { path, lastVisit: now } to recents
  IF recents.length > MAX_RECENT (20) THEN TRUNCATE to MAX_RECENT

GET_RECENT_DIRECTORIES(paneId):
  OUTPUT: RecentDirectory[] most-recent-first, separate per paneId
```

## NAVIGATE_BACK_FORWARD
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Walk recent list relative to current path; back moves toward older entries, forward toward newer.

```
NAVIGATE_BACK(paneId, currentPath):
  OUTPUT: previous path string OR null at oldest / unknown current
  idx := INDEX currentPath in recents
  IF idx missing OR idx is last THEN RETURN null
  RETURN recents[idx + 1].path

NAVIGATE_FORWARD(paneId, currentPath):
  OUTPUT: next path string OR null at newest / unknown current
  idx := INDEX currentPath in recents
  IF idx <= 0 THEN RETURN null
  RETURN recents[idx - 1].path
```

## CLEAR_HISTORY
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Remove cursor and recent state for one pane (testing and reset).

```
CLEAR_HISTORY(paneId):
  DELETE histories[paneId]
  DELETE recentDirs[paneId]
```

## LOAD_BOOKMARKS_FROM_STORAGE
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Hydrate bookmarks from localStorage key nx1-file-bookmarks; empty array on SSR, missing, or corrupt data.

```
LOAD_BOOKMARKS_FROM_STORAGE():
  INPUT: window.localStorage when available
  OUTPUT: bookmarks Bookmark[] in memory
  IF SSR OR localStorage unavailable THEN RETURN
  TRY parse JSON FROM nx1-file-bookmarks
  ON failure OR missing THEN bookmarks := []
```

## ADD_BOOKMARK
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Append { id, path, label, created }; persist JSON array; generate unique bm- prefixed id.

```
ADD_BOOKMARK(path, label):
  OUTPUT: Bookmark { id, path, label, created: now }
  APPEND to bookmarks
  PERSIST to localStorage
  RETURN bookmark
```

## REMOVE_BOOKMARK
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Remove by id; persist; return false when id not found.

```
REMOVE_BOOKMARK(id):
  OUTPUT: boolean removed
  IF id not found THEN RETURN false
  SPLICE bookmark from array
  PERSIST
  RETURN true
```

## UPDATE_BOOKMARK
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Change label for existing id; persist; return false when id not found.

```
UPDATE_BOOKMARK(id, label):
  OUTPUT: boolean updated
  IF bookmark missing THEN RETURN false
  SET bookmark.label := label
  PERSIST
  RETURN true
```

## GET_ALL_BOOKMARKS
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: Return shallow copy of bookmarks array preserving insertion order.

```
GET_ALL_BOOKMARKS():
  OUTPUT: Bookmark[] copy (new array instance, same content)
```

## IS_BOOKMARKED
# [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
# how: True when any bookmark.path equals given path.

```
IS_BOOKMARKED(path):
  OUTPUT: boolean
  RETURN EXISTS bookmark WHERE bookmark.path = path
```
