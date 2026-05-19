# IMPL-NSYNC_ENGINE essence pseudocode

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: Top-level Sync Engine Core Implementation: SyncEngine class orchestrates sync loop iterating over sources, syncing each to all destinations in parallel, tracking results, and handling move deletion

## Summary contract

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-NSYNC_ENGINE
  DATA: state and configuration per implementation_approach

## SyncMethod

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: orchestrate multi-source multi-destination sync with plan and observer

CONTRACT SyncMethod
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_SyncMethod(context)
  // DATA sources, destinations, SyncOptions, move, compareMethod, verify, signal
  // BUILD SyncPlan with totalItems totalBytes
  CALL BUILD SyncPlan with totalItems totalBytes
  FOR EACH source AWAIT getFileStat AND accumulate totalBytes
  CALL observer.onStart with plan
  // INITIALIZE SyncResult counters cancelled false
  CALL INITIALIZE SyncResult counters cancelled false

## ForEachSource

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: iterate sources with cancel and store-failure guards

CONTRACT ForEachSource
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_ForEachSource(context)
  FOR EACH source IN sources
  IF signal.aborted THEN SET cancelled true AND BREAK
  IF storeMonitor.hasUnavailableStore THEN SET storeFailureAbort true AND BREAK
  CALL syncItem for source to all destinations
  // MERGE itemResult into result counters
  CALL MERGE itemResult into result counters
  CALL observer.onProgress with updated stats

## SyncItem

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: sync one source to all destinations in parallel

CONTRACT SyncItem
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_SyncItem(context)
  IF sourceStat missing THEN RETURN error ItemResult
  CALL observer.onItemStart
  IF verify OR compareMethod hash THEN AWAIT computeFileHash for source
  AWAIT Promise.all destinations.map syncToDestination
  IF any dest error THEN SET item error
  CALL observer.onItemComplete

## SkipUnchanged

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: compare size-mtime skips copy when destination matches

CONTRACT SkipUnchanged
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_SkipUnchanged(context)
  CALL compareFiles with compareMethod
  IF files equal THEN SET destResult.skipped true
  // INCREMENT itemsSkipped on sync result
  CALL INCREMENT itemsSkipped on sync result

## MoveSemantics

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: delete source only after all destinations succeed for that item

CONTRACT MoveSemantics
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_MoveSemantics(context)
  IF move AND all destResults succeeded THEN ADD source to sourcesToDelete
  // AFTER all sources IF move AND not cancelled THEN
  CALL AFTER all sources IF move AND not cancelled THEN
  FOR EACH source IN sourcesToDelete AWAIT deleteFile
  ON delete failure APPEND to result.errors

## ObserverCallbacks

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: onStart onItemStart onItemProgress onItemComplete onProgress onFinish

CONTRACT ObserverCallbacks
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_ObserverCallbacks(context)
  ON sync start CALL onStart plan
  ON each item CALL onItemStart onItemComplete
  // DURING loop CALL onProgress stats
  CALL DURING loop CALL onProgress stats
  ON completion CALL onFinish result

## StoreMonitor

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: abort sync when store error streak exceeds threshold

CONTRACT StoreMonitor
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_ENGINE_StoreMonitor(context)
  DATA StoreMonitor threshold default 3
  ON repeated store errors CALL markUnavailable
  IF hasUnavailableStore THEN abort sync loop

## CodeLocations

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/engine.ts — SyncEngine class with sync(), syncItem(), syncToDestination() methods
// FILE: src/app/api/files/route.ts — API route handler for sync-all operation
// FILE: src/app/files/WorkspaceView.tsx — handleCopyAll(), handleMoveAll() React handlers
// FUNCTION: sync in src/lib/sync/engine.ts
// FUNCTION: syncItem in src/lib/sync/engine.ts
// FUNCTION: syncToDestination in src/lib/sync/engine.ts

## ErrorHandling

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-NSYNC_ENGINE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
