# IMPL-SORT_FILTER essence pseudocode

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: Top-level Client-Side Sort and Filter Functions: Sort functions in files.utils.ts with comparator dispatch

## Summary contract

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-SORT_FILTER
  DATA: state and configuration per implementation_approach

## SortFiles

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: sortFiles applies criterion direction dirsFirst client or server

CONTRACT SortFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-SORT_FILTER_SortFiles(context)
  // INPUT files sortBy sortDirection sortDirsFirst
  // PARTITION directories and files if dirsFirst
  CALL PARTITION directories and files if dirsFirst
  // SORT each partition per criterion
  CALL SORT each partition per criterion
  // CONCATENATE and RETURN ordered list
  CALL CONCATENATE and RETURN ordered list

## LinkedSortApply

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: when linked apply same sort fields to every pane

CONTRACT LinkedSortApply
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-SORT_FILTER_LinkedSortApply(context)
  IF linkedMode THEN FOR EACH pane index CALL internal sort update
  // PRESERVE cursor by matching filename after sort
  CALL PRESERVE cursor by matching filename after sort

## CodeLocations

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — Sort and filter utilities
// FUNCTION: sortFiles in src/lib/files.utils.ts

## ErrorHandling

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-SORT_FILTER_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
