# IMPL-FILE_SEARCH essence pseudocode

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: Dual-mode search — client finder (Ctrl+F) and server content search (Ctrl+Shift+F) with SSR-safe history

## Summary contract

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_SEARCH_Summary():
  INPUT: pane files[]; basePath; pattern; options { caseSensitive, regex, recursive, filePattern, maxResults }
  OUTPUT: filtered FileStat[] (finder); ContentSearchResponse (API); flat result rows in SearchDialog
  DATA: SearchHistory localStorage key files:search:{finder|content}:history; MAX_HISTORY=20; MAX_RESULTS=1000; MAX_FILE_SIZE=10MB
  CONTROL: typeof window === 'undefined' guards in SearchHistory add/getAll/clear
  PRE: search invoked in browser or SSR-safe guarded path
  POST: finder or content search results returned within configured caps
  EFFECTS: IO, State
  TERMINATION: total
```

## FuzzyMatchAndFilter

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: files.search.ts fuzzyMatch, filterFiles, scoreMatch for finder ranking

```
IMPL-FILE_SEARCH_FuzzyMatchAndFilter(context):
  INPUT: files[], pattern, caseSensitive flag
  OUTPUT: filtered and ranked FileStat[]
  PRE: files array available
  POST: empty pattern returns all files; non-empty pattern returns fuzzy-matched sorted results
  EFFECTS: pure
  TERMINATION: total
  IF pattern empty THEN RETURN all files
  TRIM pattern
  FILTER files WHERE fuzzyMatch(pattern, file.name, caseSensitive)
  SORT filtered BY scoreMatch(pattern, name) descending
```

## SearchHistorySSRGuards

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: SearchHistory persists up to 20 entries per finder|content type

```
IMPL-FILE_SEARCH_SearchHistorySSRGuards(context):
  INPUT: pattern, history type (finder|content)
  OUTPUT: persisted or retrieved history entries
  PRE: browser environment for mutating operations
  POST: up to MAX_HISTORY entries stored per type; SSR paths return empty or no-op
  EFFECTS: IO, State
  FAILURE_MODES: LOCALSTORAGE_UNAVAILABLE
  TERMINATION: total
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
IMPL-FILE_SEARCH_FinderDialog(context):
  INPUT: isOpen, files[], copy.search, pattern
  OUTPUT: filtered results UI and selection callbacks
  PRE: FinderDialog open with files listing
  POST: incremental filter, history, and keyboard navigation wired
  EFFECTS: State, Control
  TERMINATION: total
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
IMPL-FILE_SEARCH_SearchDialogContentApi(context):
  INPUT: basePath, search options, pattern
  OUTPUT: content search results and flat navigation rows
  PRE: SearchDialog submit invoked with valid basePath
  POST: results and flatResults populated or error message set
  EFFECTS: IO, State
  TERMINATION: total
  ON submit SET loading; CALL searchContent POST with body
  ON success SET results; BUILD flatResults from results[].matches
  ON error SET error message
  ON result click onSelectResult(path, line)
  OPTIONS panel toggles recursive, caseSensitive, regex, filePattern
```

## POSTApiFilesSearch

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: route validates path and regex; line-by-line scan with caps

```
IMPL-FILE_SEARCH_POSTApiFilesSearch(context):
  INPUT: POST body with pattern, basePath, options
  OUTPUT: ContentSearchResponse with matches and truncation flag
  PRE: request body includes pattern and basePath
  POST: validated search returns matches up to MAX_RESULTS within duration budget
  EFFECTS: IO
  FAILURE_MODES: INVALID_PATH; INVALID_REGEX; MAX_RESULTS_EXCEEDED
  TERMINATION: total
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
IMPL-FILE_SEARCH_WorkspaceIntegration(context):
  INPUT: finder or search dialog events
  OUTPUT: navigation or preview panel updates
  PRE: WorkspaceView mounted with dialog state
  POST: finder selection navigates or moves cursor; search selection opens preview
  EFFECTS: State, Control
  TERMINATION: total
  STATE finderOpen, searchOpen
  ON finder select IF directory handleNavigate ELSE findIndex by name handleCursorMove
  ON search result select SET previewPanel preview filePath (line highlight deferred)
  RENDER FinderDialog and SearchDialog with config copy props
```

## KeyboardNavigation

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH]: how: both dialogs clamp selection; Enter confirms; Escape closes

```
IMPL-FILE_SEARCH_KeyboardNavigation(context):
  INPUT: keyboard event in finder or search dialog
  OUTPUT: updated selection or close/submit action
  PRE: dialog focused with result or history list
  POST: selection clamped; Enter confirms; Escape closes without mutation
  EFFECTS: Control
  TERMINATION: total
  ArrowDown := min(index+1, listLength-1)
  ArrowUp := max(index-1, 0)
  Enter := select current row or submit search
  Escape := onClose without mutation
```

## CodeLocations

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.search.ts — fuzzyMatch, filterFiles, SearchHistory, searchContent client
// FILE: src/lib/files.search.test.ts — unit tests
// FILE: src/app/files/components/FinderDialog.tsx — finder UI
// FILE: src/app/files/components/FinderDialog.test.tsx
// FILE: src/app/files/components/SearchDialog.tsx — content search UI
// FILE: src/app/files/components/SearchDialog.test.tsx
// FILE: src/app/api/files/search/route.ts — POST content search
// FILE: src/app/api/files/search/route.test.ts
// FILE: src/app/files/WorkspaceView.tsx — dialog state and handlers

## ErrorHandling

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: how: API returns 400 on validation failure; SearchDialog surfaces error string; history fails silently

```
IMPL-FILE_SEARCH_on_error(context, error):
  INPUT: validation, search, or storage failure
  OUTPUT: 400 JSON error, UI error string, or silent history no-op
  PRE: error on path/regex validation, oversized file, or localStorage
  POST: client receives actionable error or degraded silent path
  EFFECTS: IO
  FAILURE_MODES: INVALID_PATH; INVALID_REGEX; FILE_TOO_LARGE; LOCALSTORAGE_FAILED
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON invalid path OR regex THEN RETURN 400 JSON error to client
  ON oversized file SKIP file in search (warn log, empty matches for file)
  ON localStorage failure IN SearchHistory THEN silent no-op
```
