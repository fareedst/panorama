# IMPL-FILE_SEARCH essence pseudocode

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: Dual-mode search — client finder (Ctrl+F) and server content search (Ctrl+Shift+F) with SSR-safe history

## Summary contract

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: bound module inputs, outputs, and shared data for all runtime blocks below

```
CONTRACT Summary
  INPUT: pane files[]; basePath; pattern; options { caseSensitive, regex, recursive, filePattern, maxResults }
  OUTPUT: filtered FileStat[] (finder); ContentSearchResponse (API); flat result rows in SearchDialog
  DATA: SearchHistory localStorage key files:search:{finder|content}:history; MAX_HISTORY=20; MAX_RESULTS=1000; MAX_FILE_SIZE=10MB
  CONTROL: typeof window === 'undefined' guards in SearchHistory add/getAll/clear
```

## FuzzyMatchAndFilter

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: files.search.ts fuzzyMatch, filterFiles, scoreMatch for finder ranking

```
PROCEDURE FuzzyMatchAndFilter(context)
  IF pattern empty THEN RETURN all files
  TRIM pattern
  FILTER files WHERE fuzzyMatch(pattern, file.name, caseSensitive)
  SORT filtered BY scoreMatch(pattern, name) descending
```

## SearchHistorySSRGuards

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: SearchHistory persists up to 20 entries per finder|content type

```
PROCEDURE SearchHistorySSRGuards(context)
  ON add(pattern):
    IF pattern blank OR typeof window undefined THEN RETURN
    DEDUPE prior same pattern; unshift entry; slice(0, MAX_HISTORY)
    TRY localStorage.setItem; ON failure silent return
  ON getAll: IF typeof window undefined OR no localStorage THEN RETURN []
    TRY parse JSON; ON corrupt RETURN []
  ON clear: IF typeof window undefined THEN RETURN; removeItem key
```

## FinderDialog

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: FinderDialog incremental filter, history dropdown, keyboard nav

```
PROCEDURE FinderDialog(context)
  INPUT: isOpen, files[], copy.search, onSelect, onClose
  STATE pattern, selectedIndex, showHistory
  filteredFiles := filterFiles + scoreMatch sort (memo)
  ON open FOCUS input after short timeout
  ON pattern change RESET selectedIndex; hide history
  ON ArrowDown/Up INCREMENT/DECREMENT selectedIndex (results OR history list)
  ON Enter IF history mode SET pattern from history entry
         ELSE IF result selected historyManager.add(pattern); onSelect(file); onClose
  ON Escape onClose
  ON Tab TOGGLE showHistory
  RENDER match highlighting and result count
```

## SearchDialogContentApi

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: SearchDialog POST searchContent → /api/files/search; flatten matches for navigation

```
PROCEDURE SearchDialogContentApi(context)
  INPUT: basePath, options recursive/caseSensitive/regex/filePattern
  ON submit SET loading; CALL searchContent POST with body
  ON success SET results; BUILD flatResults from results[].matches
  ON error SET error message
  ON result click onSelectResult(path, line)
  OPTIONS panel toggles recursive, caseSensitive, regex, filePattern
```

## POSTApiFilesSearch

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: route validates path and regex; line-by-line scan with caps

```
PROCEDURE POSTApiFilesSearch(context)
  VALIDATE body pattern and basePath present
  validatePath(basePath) — reject "..", require absolute
  IF regex option THEN validateRegex(pattern) — length cap, compile test, ReDoS heuristics
  DISCOVER files under basePath respecting recursive and filePattern glob
  FOR each file IF size <= MAX_FILE_SIZE
    searchFile line-by-line — regex OR case-aware substring matcher
    ACCUMULATE matches until MAX_RESULTS
  RETURN { results, totalMatches, truncated, duration }
```

## WorkspaceIntegration

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: WorkspaceView finderOpen/searchOpen state; handleFinderSelect navigates dir or moves cursor

```
PROCEDURE WorkspaceIntegration(context)
  STATE finderOpen, searchOpen
  ON finder select IF directory handleNavigate ELSE findIndex by name handleCursorMove
  ON search result select SET previewPanel preview filePath (line highlight deferred)
  RENDER FinderDialog and SearchDialog with config copy props
```

## KeyboardNavigation

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: both dialogs clamp selection; Enter confirms; Escape closes

```
PROCEDURE KeyboardNavigation(context)
  ArrowDown := min(index+1, listLength-1)
  ArrowUp := max(index-1, 0)
  Enter := select current row or submit search
  Escape := onClose without mutation
```

## CodeLocations

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

```
// FILE: src/lib/files.search.ts — fuzzyMatch, filterFiles, SearchHistory, searchContent client
// FILE: src/lib/files.search.test.ts — unit tests
// FILE: src/app/files/components/FinderDialog.tsx — finder UI
// FILE: src/app/files/components/FinderDialog.test.tsx
// FILE: src/app/files/components/SearchDialog.tsx — content search UI
// FILE: src/app/files/components/SearchDialog.test.tsx
// FILE: src/app/api/files/search/route.ts — POST content search
// FILE: src/app/api/files/search/route.test.ts
// FILE: src/app/files/WorkspaceView.tsx — dialog state and handlers
```

## ErrorHandling

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: API returns 400 on validation failure; SearchDialog surfaces error string; history fails silently

```
PROCEDURE IMPL-FILE_SEARCH_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON invalid path OR regex THEN RETURN 400 JSON error to client
  ON oversized file SKIP file in search (warn log, empty matches for file)
  ON localStorage failure IN SearchHistory THEN silent no-op
```
