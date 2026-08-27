# IMPL-NSYNC_STORE essence pseudocode

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: StoreMonitor tracks StoreUnavailable error streaks per destination directory; abort sync when threshold reached

## Summary contract

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine consults hasUnavailableStore before each source; recordSuccess/recordError on each destination attempt

```
IMPL-NSYNC_STORE_Summary():
  INPUT: destPath, ErrorClass from classifyError
  OUTPUT: boolean unavailable flag from recordError; hasUnavailableStore for abort decision
  DATA: Map storeKey → { errorStreak, unavailable, lastError? }; threshold default 3
  PRE: StoreMonitor instance initialized
  POST: per-store streak and unavailable state updated
  EFFECTS: State
  CONTROL: storeKey = dirname(destPath)
  TERMINATION: total
```

## StoreMonitorConstructor

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine creates monitor with threshold 3

```
IMPL-NSYNC_STORE_StoreMonitorConstructor(threshold):
  INPUT: threshold default 3
  OUTPUT: StoreMonitor instance with empty stores map
  PRE: threshold positive integer
  POST: monitor with empty stores map and configured threshold
  EFFECTS: State
  TERMINATION: total
  SET this.threshold := threshold
  SET this.stores := empty Map
```

## RecordSuccess

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: reset errorStreak to zero for store on successful copy or skip

```
IMPL-NSYNC_STORE_RecordSuccess(destPath):
  INPUT: destPath
  OUTPUT: void; streak reset when store state exists
  PRE: destPath provided
  POST: errorStreak zeroed for store when state exists
  EFFECTS: State
  TERMINATION: total
  storeKey := dirname(destPath)
  IF stores has storeKey THEN SET state.errorStreak := 0
```

## RecordError

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: only ErrorClass.StoreUnavailable increments streak; at threshold mark unavailable

```
IMPL-NSYNC_STORE_RecordError(destPath, errorClass):
  INPUT: destPath, errorClass
  OUTPUT: boolean — current unavailable flag for store
  PRE: destPath and errorClass provided
  POST: streak updated for StoreUnavailable; unavailable set at threshold
  EFFECTS: State
  TERMINATION: total
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
```

## HasUnavailableStore

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine breaks source loop when any store is unavailable

```
IMPL-NSYNC_STORE_HasUnavailableStore():
  INPUT: none
  OUTPUT: boolean — true if any store state.unavailable
  PRE: stores map populated
  POST: aggregate unavailable flag
  EFFECTS: pure read
  TERMINATION: total
  FOR EACH store IN stores
    IF store.unavailable THEN RETURN true
  RETURN false
```

## ClassifyError

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: heuristic on error.message — enoent/enotdir/erofs/eio/ebusy/eagain → StoreUnavailable; eacces/eperm → FileSpecific; default FileSpecific

```
IMPL-NSYNC_STORE_ClassifyError(error):
  INPUT: Error
  OUTPUT: ErrorClass
  PRE: error with message
  POST: ErrorClass assigned
  EFFECTS: pure
  TERMINATION: total
  message := lowercase(error.message)
  IF message contains enoent OR enotdir OR erofs OR eio OR ebusy OR eagain THEN RETURN StoreUnavailable
  IF message contains eacces OR eperm THEN RETURN FileSpecific
  RETURN FileSpecific
```

## CodeLocations

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/store.ts — StoreMonitor class
// TEST: (integration) src/lib/sync/engine.test.ts — store abort path exercised via syncToDestination error handling

## ErrorHandling

// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: unavailable store triggers storeFailureAbort on SyncResult; sync loop stops before remaining sources

```
IMPL-NSYNC_STORE_on_error(context, error):
  INPUT: dest failure error, destPath context
  OUTPUT: error classified and recorded; may trigger storeFailureAbort
  PRE: error during syncToDestination
  POST: recordError invoked; SyncEngine may set storeFailureAbort and break loop
  EFFECTS: State
  TERMINATION: total
  errorClass := ClassifyError(error)
  recordError(destPath, errorClass)
  IF hasUnavailableStore THEN SyncEngine sets result.storeFailureAbort AND breaks loop
```
