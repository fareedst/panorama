# IMPL-PERFORMANCE_OPT essence pseudocode

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: Planned performance optimizations for large directory listings — no production loci yet; specification derived from REQ satisfaction criteria and ARCH decision

## Summary contract

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: non-functional targets for render, scroll, memory, and comparison-index update latency when implemented

```
IMPL-PERFORMANCE_OPT_Summary():
  INPUT: directory listings with 1000+ FileStat rows, comparison index rebuild triggers
  OUTPUT: sub-linear memory growth, sub-1s initial render at 1000 files, smooth scroll at 5000+ files
  DATA: virtual viewport window, debounce timer, lazy stat fetch queue
  CONTROL: status Planned — retrofit documents intended behavior; verify against future performance tests when code lands
  PRE: performance optimization scope approved; REQ-FILES_PERFORMANCE satisfaction criteria defined
  POST: documented targets for memory, render, scroll, and comparison-index latency when implemented
  EFFECTS: pure
  TERMINATION: total
```

## DEBOUNCED_COMPARISON_INDEX

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: delay comparison index rebuild 300ms after pane file list or mark changes to avoid thrashing on rapid navigation

```
IMPL-PERFORMANCE_OPT_DebouncedComparisonIndex():
  INPUT: panes file arrays, comparison mode toggles
  OUTPUT: comparisonIndexForFilters updated at most once per debounce window
  DATA: 300ms debounce constant per REQ satisfaction criterion
  PRE: comparison mode active; pane file list or marks may change rapidly
  POST: comparison index rebuild fires at most once per 300ms debounce window
  EFFECTS: State
  TERMINATION: total
  ON pane files or marks change SCHEDULE comparison rebuild after 300ms
  IF another change within window THEN reset timer
  ON timer fire REBUILD comparison index once
```

## LAZY_METADATA_LOADING

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: stat only visible rows in viewport plus prefetch buffer; defer size/mtime for off-screen files until scroll brings them near view

```
IMPL-PERFORMANCE_OPT_LazyMetadataLoading():
  INPUT: full file name list, viewport range, scroll position
  OUTPUT: FileStat[] with metadata populated for visible+buffer rows only
  DATA: placeholder stat records for not-yet-loaded rows
  PRE: file list length exceeds eager-stat threshold
  POST: visible and buffer rows have metadata; off-screen rows use lightweight placeholders
  EFFECTS: IO, State
  TERMINATION: total
  COMPUTE visible index range from scroll and row height
  FOR indices in range plus buffer FETCH or reveal cached FileStat metadata
  FOR off-screen indices USE lightweight name-only placeholders until needed
```

## VIRTUAL_SCROLLING

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: render only rows in viewport with total scroll height from row count times fixed row height

```
IMPL-PERFORMANCE_OPT_VirtualScrolling():
  INPUT: sorted visible files[], container height, scrollTop
  OUTPUT: DOM nodes for viewport slice only; smooth scroll with 5000+ logical rows
  DATA: overscan buffer rows above and below viewport
  PRE: container height and row height known; files array non-empty
  POST: only viewport slice rendered; total scroll height reflects full row count
  EFFECTS: pure
  TERMINATION: total
  SET totalHeight := files.length * rowHeight
  SET startIndex := floor(scrollTop / rowHeight) minus overscan
  SET endIndex := startIndex + ceil(containerHeight / rowHeight) plus overscan
  RENDER file rows for startIndex..endIndex only
  APPLY transform or spacer for off-screen offset
```

## OPTIMIZED_SORT

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: avoid full re-sort on every keystroke; reuse stable sort keys or incremental sort for large arrays

```
IMPL-PERFORMANCE_OPT_OptimizedSort():
  INPUT: files[], sortBy, sortDirection, sortDirsFirst
  OUTPUT: sorted visible array within render budget for 1000+ items
  DATA: memoized sort comparator; optional Web Worker for very large sets
  PRE: sort criteria and file array available
  POST: sorted array returned within render budget for large listings
  EFFECTS: pure
  TERMINATION: total
  IF file count below threshold THEN use existing sortFiles
  ELSE use indexed sort or cached permutation until sort criteria change
```

## CodeLocations

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: no production files yet — future loci TBD when status moves from Planned to Active

// PLANNED: FilePane virtual list integration
// PLANNED: comparison index debounce in WorkspaceView or comparison module
// PLANNED: performance test suite under src/test or dedicated perf tests per REQ validation_criteria

## ErrorHandling

// [IMPL-PERFORMANCE_OPT] [ARCH-PERFORMANCE_OPT] [REQ-FILES_PERFORMANCE]: how: on lazy-load failure show row without extended metadata; debounced rebuild errors log without blocking navigation

```
IMPL-PERFORMANCE_OPT_on_error(context, error):
  INPUT: lazy-load or debounced rebuild failure
  OUTPUT: degraded path without blocking navigation
  PRE: optimization path active when error occurs
  POST: UI remains usable; full listing path used on optimization failure
  EFFECTS: IO
  FAILURE_MODES: LAZY_LOAD_FAILED; DEBOUNCE_REBUILD_FAILED
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  DEGRADE to full listing path when optimization path fails
  ASSERT UI remains usable with correctness over performance fallback
```
