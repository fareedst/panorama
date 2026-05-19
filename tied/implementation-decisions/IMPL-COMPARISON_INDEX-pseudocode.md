# IMPL-COMPARISON_INDEX essence pseudocode

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: Top-level Comparison Index Implementation: Build Map-based index from pane contents, provide query interface

## Summary contract

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-COMPARISON_INDEX
  DATA: state and configuration per implementation_approach

## BuildEnhancedIndex

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: map filename to per-pane FileStat for comparison mode

CONTRACT BuildEnhancedIndex
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-COMPARISON_INDEX_BuildEnhancedIndex(context)
  // INPUT array of pane file lists
  FOR EACH name appearing in two or more panes STORE stats array
  RETURN Map used by FilePane row styling

## CodeLocations

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — Comparison index implementation
// FILE: src/lib/files.types.ts — CompareState and ComparisonIndex types
// FUNCTION: buildComparisonIndex in src/lib/files.data.ts

## ErrorHandling

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-COMPARISON_INDEX_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
