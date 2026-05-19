# IMPL-NSYNC_COMPARE essence pseudocode

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: Top-level File Comparison Implementation: File comparison using size, mtime, hash methods to skip unchanged files

## Summary contract

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-NSYNC_COMPARE
  DATA: state and configuration per implementation_approach

## SizeMtimeCompare

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: compareFiles uses size and mtime for equality decision

CONTRACT SizeMtimeCompare
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_COMPARE_SizeMtimeCompare(context)
  // INPUT sourceStat destStat
  IF size differs THEN RETURN not equal
  IF mtime differs THEN RETURN not equal
  ELSE RETURN equal

## HashCompare

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: hash compare method uses computed digests

CONTRACT HashCompare
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_COMPARE_HashCompare(context)
  AWAIT hash for source and destination
  IF digests equal THEN RETURN equal ELSE RETURN not equal

## CodeLocations

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/compare.ts — IMPL-NSYNC_COMPARE

## ErrorHandling

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-NSYNC_COMPARE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
