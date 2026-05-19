# IMPL-FILE_SEARCH essence pseudocode

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: Top-level Dual-Mode Search Implementation with SSR Guards: Client-side incremental finder + server-side content search API with SSR guards

## Summary contract

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILE_SEARCH
  DATA: state and configuration per implementation_approach

## FinderFilter

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: client-side filter file list as user types

CONTRACT FinderFilter
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_SEARCH_FinderFilter(context)
  // INPUT query string file list
  // LOWERCASE query
  CALL LOWERCASE query
  // FILTER files WHERE name includes query
  CALL FILTER files WHERE name includes query
  // UPDATE visible list and highlight index
  CALL UPDATE visible list and highlight index

## SearchDialogApi

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: server search via api files search route

CONTRACT SearchDialogApi
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_SEARCH_SearchDialogApi(context)
  ON submit AWAIT fetch search endpoint with query
  // RENDER result rows with path and line
  CALL RENDER result rows with path and line
  ON select INVOKE onSelect callback

## KeyboardNavigation

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: arrow keys move selection enter confirms escape closes

CONTRACT KeyboardNavigation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_SEARCH_KeyboardNavigation(context)
  ON ArrowDown INCREMENT selected index clamped to list
  ON Enter SELECT current row
  ON Escape CLOSE dialog

## CodeLocations

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.search.ts — Search utilities with SSR guards: fuzzy matching, filtering, scoring, SearchHistory class
// FILE: src/app/files/components/FinderDialog.tsx — File finder component with real-time filtering and keyboard nav
// FILE: src/app/files/components/SearchDialog.tsx — Content search component with options (recursive, case, regex, pattern)
// FILE: src/app/api/files/search/route.ts — Content search API endpoint with security and line-by-line search
// FILE: src/app/files/WorkspaceView.tsx — Integration: state, handlers, dialog rendering with copy props
// FUNCTION: SearchHistory.add in src/lib/files.search.ts
// FUNCTION: SearchHistory.getAll in src/lib/files.search.ts
// FUNCTION: SearchHistory.clear in src/lib/files.search.ts

## ErrorHandling

// [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-REACT_SSR_STABILITY]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILE_SEARCH_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
