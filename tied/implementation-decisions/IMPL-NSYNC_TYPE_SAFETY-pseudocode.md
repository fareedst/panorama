# IMPL-NSYNC_TYPE_SAFETY essence pseudocode

// [IMPL-NSYNC_TYPE_SAFETY]: Top-level TypeScript Type Safety for Node.js Types: Add type guards and conversions to handle Node.js bigint sizes and stream types; fix import statements to allow value usage

## Summary contract

// [IMPL-NSYNC_TYPE_SAFETY]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-NSYNC_TYPE_SAFETY
  DATA: state and configuration per implementation_approach

## ApplyConversionIn3

// [IMPL-NSYNC_TYPE_SAFETY]: plan.totalBytes, result.bytesCopied, ItemInfo.size

CONTRACT ApplyConversionIn3
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_ApplyConversionIn3(context)
  // plan.totalBytes
  CALL plan.totalBytes
  // result.bytesCopied
  CALL result.bytesCopied
  // ItemInfo.size
  CALL ItemInfo.size

## ConvertStatSizeBigint

// [IMPL-NSYNC_TYPE_SAFETY]: typeof stat.size === 'bigint' ? Number(stat.size) : stat.size

CONTRACT ConvertStatSizeBigint
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_ConvertStatSizeBigint(context)
  // typeof stat.size === 'bigint' ? Number(stat.size) : stat.size
  CALL typeof stat.size === 'bigint' ? Number(stat.size) : stat.size
  ON invalid input OR missing data THEN RETURN without mutation

## FixErrorClassImport

// [IMPL-NSYNC_TYPE_SAFETY]: move from 'import type' to regular import

CONTRACT FixErrorClassImport
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_FixErrorClassImport(context)
  // move from 'import type' to regular import
  CALL move from 'import type' to regular import
  ON invalid input OR missing data THEN RETURN without mutation

## FixNoopObserverImport

// [IMPL-NSYNC_TYPE_SAFETY]: move from separate import to regular import

CONTRACT FixNoopObserverImport
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_FixNoopObserverImport(context)
  // move from separate import to regular import
  CALL move from separate import to regular import
  ON invalid input OR missing data THEN RETURN without mutation

## HandleStreamChunkTypes

// [IMPL-NSYNC_TYPE_SAFETY]: typeof chunk === 'string' ? Buffer.from(chunk) : chunk

CONTRACT HandleStreamChunkTypes
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_HandleStreamChunkTypes(context)
  // typeof chunk === 'string' ? Buffer.from(chunk) : chunk
  CALL typeof chunk === 'string' ? Buffer.from(chunk) : chunk
  ON invalid input OR missing data THEN RETURN without mutation

## CodeLocations

// [IMPL-NSYNC_TYPE_SAFETY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/engine.ts — Type conversions for stat.size (3 locations), ErrorClass import fix
// FILE: src/lib/sync/hash.ts — Stream chunk type handling

## ErrorHandling

// [IMPL-NSYNC_TYPE_SAFETY]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
