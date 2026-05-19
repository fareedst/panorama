# IMPL-COMPARISON_COLORS essence pseudocode

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: Top-level CSS Class-Based Comparison Coloring: Enhance ComparisonIndex, apply CSS classes from theme

## Summary contract

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-COMPARISON_COLORS
  DATA: state and configuration per implementation_approach

## SizeComparison

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: classify file size delta between panes for background color

CONTRACT SizeComparison
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-COMPARISON_COLORS_SizeComparison(context)
  FOR EACH filename in shared comparison index
  IF size equal THEN no size color class
  IF source larger THEN apply positive size class ELSE negative

## TimeComparison

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: classify mtime delta for time-based coloring

CONTRACT TimeComparison
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-COMPARISON_COLORS_TimeComparison(context)
  // COMPARE mtime between pane files with same name
  CALL COMPARE mtime between pane files with same name
  IF newer in pane A THEN apply time highlight for pane A row

## CodeLocations

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — Enhanced comparison index builder
// FILE: src/app/files/components/FilePane.tsx — CSS class application
// FUNCTION: buildEnhancedComparisonIndex in src/lib/files.data.ts

## ErrorHandling

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-COMPARISON_COLORS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
