# IMPL-NSYNC_ENGINE essence pseudocode

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: SyncEngine orchestrates multi-source multi-destination sync with observer callbacks, compare skip, verify, store monitoring, and deferred move deletion

## Summary contract

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: sync() builds plan, iterates sources, syncItem to all destinations in parallel, deletes sources only after all dests succeed when move=true

```
IMPL-NSYNC_ENGINE_Summary():
  INPUT: sources[], destinations[], SyncOptions { move, compareMethod, hashAlgorithm, verifyDestination, observer, signal, sourceBase? }
  OUTPUT: SyncResult { cancelled, storeFailureAbort, itemsCompleted, itemsFailed, itemsSkipped, bytesCopied, durationMs, errors[] }
  DATA: StoreMonitor, SyncObserver, sourcesToDelete Set, delegates to IMPL-NSYNC_COMPARE, IMPL-NSYNC_HASH, IMPL-NSYNC_VERIFY, IMPL-NSYNC_OPERATIONS, IMPL-NSYNC_STORE; sourceBase maps nested sources via resolveCrossPaneDestPath
  PRE: sources and destinations arrays provided
  POST: SyncResult with counters and errors populated
  EFFECTS: IO, State
  CONTROL: defaults move=false, compareMethod=size-mtime, hashAlgorithm=blake3, verify=false
  TERMINATION: total
```

## SyncMethod

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: build SyncPlan with totalBytes from getFileStat, notify onStart, initialize SyncResult, loop sources

```
IMPL-NSYNC_ENGINE_SyncMethod(sources, destinations, options):
  INPUT: sources[], destinations[], options
  OUTPUT: SyncResult
  PRE: sources and destinations non-empty or empty handled
  POST: SyncResult after full source loop and move semantics
  EFFECTS: IO, State
  TERMINATION: total
  RESOLVE defaults from options; IF observer in options THEN replace instance observer
  plan := { totalItems: sources.length, totalDestinations: destinations.length, sources, destinations, totalBytes: 0 }
  FOR EACH source IN sources
    stat := AWAIT getFileStat(source)
    IF stat THEN plan.totalBytes += normalizeSize(stat.size)
  CALL observer.onStart(plan)
  result := { cancelled: false, storeFailureAbort: false, counters zeroed, errors: [] }
  sourcesToDelete := empty Set
```

## ForEachSource

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: per source check signal.aborted and storeMonitor.hasUnavailableStore before syncItem; merge itemResult into result counters

```
IMPL-NSYNC_ENGINE_ForEachSource():
  INPUT: sources loop state, signal, storeMonitor
  OUTPUT: updated SyncResult counters
  PRE: sync loop initialized
  POST: per-source counters merged; may break on abort or store failure
  EFFECTS: IO, State
  TERMINATION: total when sources exhausted or break
  FOR EACH source IN sources
    IF signal.aborted THEN SET result.cancelled := true AND BREAK
    IF storeMonitor.hasUnavailableStore() THEN SET result.storeFailureAbort := true AND BREAK
    itemResult := AWAIT syncItem(source, destinations, itemOptions, signal)
    IF itemResult.error THEN
      INCREMENT itemsFailed; APPEND dest errors to result.errors
    ELSE
      allSucceeded := every destResult has no error
      allSkipped := every destResult.skipped
      IF allSkipped THEN INCREMENT itemsSkipped
      ELSE IF allSucceeded THEN
        INCREMENT itemsCompleted
        IF move THEN sourcesToDelete.add(source)
        ADD bytesCopied from source size × non-skipped dest count
      ELSE INCREMENT itemsFailed
    CALL observer.onProgress(current stats)
```

## SyncItem

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: resolve source stat; compute sourceHash when verify OR compareMethod hash; Promise.all syncToDestination per dest

```
IMPL-NSYNC_ENGINE_SyncItem(source, destinations, options, signal):
  INPUT: source, destinations[], itemOptions, signal
  OUTPUT: ItemResult { destResults[], error? }
  PRE: source path provided
  POST: ItemResult with per-dest outcomes
  EFFECTS: IO
  FAILURE_MODES: source not found → error ItemResult; hash compute failure logged, sourceHash may remain undefined
  TERMINATION: total
  sourceStat := AWAIT getFileStat(source)
  IF NOT sourceStat THEN
    error := source not found
    CALL observer.onItemComplete with error
    RETURN { error, destResults: [] }
  item := { sourcePath, size: normalizeSize(sourceStat.size), isDirectory: sourceStat.isDirectory() }
  CALL observer.onItemStart(item)
  IF verify OR compareMethod === hash THEN
    TRY sourceHash := AWAIT computeFileHash(source, hashAlgorithm)
    CATCH LOG error — sourceHash may remain undefined
  destResults := AWAIT Promise.all(destinations.map syncToDestination)
  IF any destResult.error THEN itemResult.error := one or more destinations failed
  CALL observer.onItemComplete(item, itemResult)
  RETURN itemResult
```

## MAP_SOURCE_TO_DEST

// [IMPL-NSYNC_ENGINE] [IMPL-BULK_OPS] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_TREE] [REQ-NSYNC_MULTI_TARGET]: how: when sourceBase present map each source to destDir preserving relative path under source base

```
IMPL-NSYNC_ENGINE_MapSourceToDest(source, sourceBase, destDir):
  INPUT: sourcePath, sourceBase, destDir
  OUTPUT: destPath absolute under destDir
  DATA: resolveCrossPaneDestPath in cross-pane-path.ts
  PRE: source and destDir provided
  POST: destPath resolved preserving relative structure when sourceBase set
  EFFECTS: pure
  TERMINATION: total
  IF sourceBase THEN RETURN resolveCrossPaneDestPath(source, sourceBase, destDir)
  ELSE RETURN join(destDir, basename(source))
```

## SyncToDestination

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: compareFiles skip, copy or moveFile, optional verifyDestination, recordSuccess or classifyError

```
IMPL-NSYNC_ENGINE_SyncToDestination(source, destDir, item, sourceHash, options, signal):
  INPUT: source, destDir, item, sourceHash?, options, signal
  OUTPUT: DestResult { destPath, skipped?, error? }
  PRE: source and destDir provided
  POST: DestResult with skip, success, or error
  EFFECTS: IO, State (StoreMonitor)
  FAILURE_MODES: cancelled → error; verify failed → error; copy/move error → classified and recorded
  TERMINATION: total
  destPath := IF options.sourceBase THEN MapSourceToDest(source, options.sourceBase, destDir) ELSE join(destDir, basename(source))
  IF signal.aborted THEN RETURN { destPath, error: Cancelled }
  IF AWAIT compareFiles(source, destPath, compareMethod, hashAlgorithm) THEN
    RETURN { destPath, skipped: true }; recordSuccess(destPath)
  IF move THEN AWAIT moveFile(source, destPath) ELSE AWAIT copyFile(source, destPath)
  IF verify AND sourceHash THEN
    IF NOT AWAIT verifyDestination(sourceHash, destPath, hashAlgorithm) THEN
      SET error verification failed; recordError(destPath, VerifyFailed); RETURN
  recordSuccess(destPath); CALL observer.onItemProgress(item, item.size)
  ON catch: SET destResult.error; classifyError AND recordError(destPath, errorClass)
```

## MoveSemantics

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: after source loop, delete each source in sourcesToDelete when move AND NOT cancelled AND NOT storeFailureAbort

```
IMPL-NSYNC_ENGINE_MoveSemantics():
  INPUT: sourcesToDelete Set, result flags, move option
  OUTPUT: sources removed; delete failures appended to result.errors
  PRE: source loop complete
  POST: deferred sources deleted when move succeeded; delete errors collected
  EFFECTS: IO
  FAILURE_MODES: delete failure → appended to result.errors without failing whole sync
  TERMINATION: total
  IF move AND NOT result.cancelled AND NOT result.storeFailureAbort THEN
    FOR EACH source IN sourcesToDelete
      TRY AWAIT deleteFile(source)
      CATCH APPEND delete failure to result.errors
```

## ObserverCallbacks

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: onStart(plan), onItemStart, onItemProgress, onItemComplete, onProgress(stats), onFinish(result)

```
IMPL-NSYNC_ENGINE_ObserverCallbacks():
  INPUT: SyncObserver or NoopObserver default
  OUTPUT: callbacks invoked at lifecycle points
  PRE: observer registered
  POST: lifecycle callbacks fired at documented points
  EFFECTS: none (observer side effects)
  TERMINATION: total
  ON sync start: onStart(plan)
  ON each item start/complete: onItemStart / onItemComplete
  ON successful dest copy: onItemProgress(item, size)
  AFTER each source: onProgress(stats)
  ON sync end: onFinish(result) after durationMs computed
```

## StoreMonitorIntegration

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-STORE_FAILURE_DETECT]: how: SyncEngine owns StoreMonitor(3); sync loop aborts on hasUnavailableStore; syncToDestination records success/error

```
IMPL-NSYNC_ENGINE_StoreMonitorIntegration():
  INPUT: destPath outcomes during sync
  OUTPUT: StoreMonitor state updated; may abort loop
  DATA: StoreMonitor threshold 3
  PRE: StoreMonitor owned by SyncEngine
  POST: success/error recorded; loop may abort on unavailable store
  EFFECTS: State
  TERMINATION: total
  ON skip or successful dest: recordSuccess(destPath)
  ON dest failure: classifyError(error) AND recordError(destPath, errorClass)
  BEFORE each source: IF hasUnavailableStore() THEN abort with storeFailureAbort
```

## CodeLocations

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/engine.ts — SyncEngine sync, syncItem, syncToDestination
// FILE: src/lib/sync/index.ts — re-exports
// FILE: src/app/api/files/route.ts — sync-all POST case
// FILE: src/app/files/WorkspaceView.tsx — handleCopyAll, handleMoveAll
// TEST: src/lib/sync/engine.test.ts — multi-target sync, skip unchanged, observer, move semantics
// TEST: src/app/api/files/route.test.ts — sync-all validation and delegation

## ErrorHandling

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: per-dest errors collected in ItemResult; store failure aborts loop; move delete errors appended without failing whole sync

```
IMPL-NSYNC_ENGINE_on_error(context, error):
  INPUT: destPath error context, error
  OUTPUT: destResult.error set; StoreMonitor updated
  PRE: error during syncToDestination
  POST: error logged, classified, and recorded
  EFFECTS: State
  TERMINATION: total
  LOG error with destPath and errorClass
  destResult.error := error
  recordError with StoreMonitor.classifyError
```
