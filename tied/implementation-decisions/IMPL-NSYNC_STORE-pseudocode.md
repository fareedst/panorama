# IMPL-NSYNC_STORE essence pseudocode

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: StoreMonitor tracks StoreUnavailable error streaks per destination directory; abort sync when threshold reached

## Summary contract

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine consults hasUnavailableStore before each source; recordSuccess/recordError on each destination attempt

CONTRACT Summary
  INPUT: destPath, ErrorClass from classifyError
  OUTPUT: boolean unavailable flag from recordError; hasUnavailableStore for abort decision
  DATA: Map storeKey → { errorStreak, unavailable, lastError? }; threshold default 3
  CONTROL: storeKey = dirname(destPath)

## StoreMonitorConstructor

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine creates monitor with threshold 3

CONTRACT StoreMonitorConstructor
  INPUT: threshold default 3
  OUTPUT: StoreMonitor instance with empty stores map

PROCEDURE IMPL-NSYNC_STORE_StoreMonitorConstructor(threshold)
  SET this.threshold := threshold
  SET this.stores := empty Map

## RecordSuccess

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: reset errorStreak to zero for store on successful copy or skip

CONTRACT RecordSuccess
  INPUT: destPath
  OUTPUT: void; streak reset when store state exists

PROCEDURE IMPL-NSYNC_STORE_RecordSuccess(destPath)
  storeKey := dirname(destPath)
  IF stores has storeKey THEN SET state.errorStreak := 0

## RecordError

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: only ErrorClass.StoreUnavailable increments streak; at threshold mark unavailable

CONTRACT RecordError
  INPUT: destPath, errorClass
  OUTPUT: boolean — current unavailable flag for store

PROCEDURE IMPL-NSYNC_STORE_RecordError(destPath, errorClass)
  storeKey := dirname(destPath)
  ENSURE state exists for storeKey
  IF errorClass === StoreUnavailable THEN
    INCREMENT state.errorStreak
    SET state.lastError := now
    IF errorStreak >= threshold AND NOT state.unavailable THEN
      SET state.unavailable := true
      LOG error store marked unavailable
  ELSE
    LOG trace file-specific error — streak unchanged
  RETURN state.unavailable

## HasUnavailableStore

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine breaks source loop when any store is unavailable

CONTRACT HasUnavailableStore
  OUTPUT: boolean — true if any store state.unavailable

PROCEDURE IMPL-NSYNC_STORE_HasUnavailableStore()
  FOR EACH store IN stores
    IF store.unavailable THEN RETURN true
  RETURN false

## ClassifyError

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: heuristic on error.message — enoent/enotdir/erofs/eio/ebusy/eagain → StoreUnavailable; eacces/eperm → FileSpecific; default FileSpecific

CONTRACT ClassifyError
  INPUT: Error
  OUTPUT: ErrorClass

PROCEDURE IMPL-NSYNC_STORE_ClassifyError(error)
  message := lowercase(error.message)
  IF message contains enoent OR enotdir OR erofs OR eio OR ebusy OR eagain THEN RETURN StoreUnavailable
  IF message contains eacces OR eperm THEN RETURN FileSpecific
  RETURN FileSpecific

## CodeLocations

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/store.ts — StoreMonitor class
// TEST: (integration) src/lib/sync/engine.test.ts — store abort path exercised via syncToDestination error handling

## ErrorHandling

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: unavailable store triggers storeFailureAbort on SyncResult; sync loop stops before remaining sources

PROCEDURE IMPL-NSYNC_STORE_on_error(context, error)
  errorClass := ClassifyError(error)
  recordError(destPath, errorClass)
  IF hasUnavailableStore THEN SyncEngine sets result.storeFailureAbort AND breaks loop
