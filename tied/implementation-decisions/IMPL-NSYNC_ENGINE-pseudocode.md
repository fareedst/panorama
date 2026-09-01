# IMPL-NSYNC_ENGINE essence pseudocode

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: SyncEngine orchestrates multi-source multi-destination sync with observer callbacks, compare skip, verify, store monitoring, and deferred move deletion

## Summary contract

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-NSYNC_HYBRID_MOVE]: how: sync() builds plan, iterates sources, hybrid move plan when move=true else parallel syncToDestination, deletes sources only when move succeeded and not omitDeferredDelete

```
IMPL-NSYNC_ENGINE_Summary():
  INPUT: sources[], destinations[], SyncOptions { move, compareMethod, hashAlgorithm, verifyDestination, observer, signal, sourceBase? }
  OUTPUT: SyncResult { cancelled, storeFailureAbort, itemsCompleted, itemsFailed, itemsSkipped, bytesCopied, durationMs, errors[] }
  DATA: StoreMonitor, SyncObserver, sourcesToDelete Set, buildMovePlan when move=true, delegates to IMPL-NSYNC_COMPARE, IMPL-NSYNC_HASH, IMPL-NSYNC_VERIFY, IMPL-NSYNC_OPERATIONS, IMPL-NSYNC_STORE, IMPL-NSYNC_MOVE_PLAN; sourceBase maps nested sources via resolveCrossPaneDestPath
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
        IF move AND NOT itemResult.omitDeferredDelete THEN sourcesToDelete.add(source)
        ADD bytesCopied from source size × non-skipped dest count
      ELSE INCREMENT itemsFailed
    CALL observer.onProgress(current stats)
```

## SyncItem

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-NSYNC_HYBRID_MOVE]: how: when move=true build MovePlan and execute sequentially; when move=false Promise.all syncToDestination per dest

```
IMPL-NSYNC_ENGINE_SyncItem(source, destinations, options, signal):
  INPUT: source, destinations[], itemOptions, signal
  OUTPUT: ItemResult { destResults[], error?, omitDeferredDelete? }
  PRE: source path provided
  POST: ItemResult with per-dest outcomes; omitDeferredDelete set when hybrid plan ended in rename
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
  IF move THEN
    destPaths := destinations.map dest → MapSourceToDest(source, sourceBase, dest)
    plan := AWAIT buildMovePlan(source, destPaths)
    itemResult := AWAIT ExecuteMovePlan(source, plan, destPaths, item, sourceHash, options, signal)
  ELSE
    destResults := AWAIT Promise.all(destinations.map syncToDestination)
    itemResult := { destResults }
  IF any destResult.error THEN itemResult.error := one or more destinations failed
  CALL observer.onItemComplete(item, itemResult)
  RETURN itemResult
```

## EXECUTE_MOVE_PLAN

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: how: partition initial cross-volume copy prefix for parallel batch when M>=2; same-volume copies and rename sequential; fail-fast on batch failure; set omitDeferredDelete from plan

```
IMPL-NSYNC_ENGINE_EXECUTE_MOVE_PLAN(source, plan, destPaths, item, sourceHash, options, signal):
  INPUT: source, MovePlan, destPaths[], item, sourceHash?, options, signal
  OUTPUT: ItemResult { destResults[], omitDeferredDelete }
  PRE: plan.legs ordered per IMPL-NSYNC_MOVE_PLAN; count(rename) <= 1
  POST: one DestResult per destPath; omitDeferredDelete := plan.omitDeferredDelete when all legs succeed
  EFFECTS: IO
  FAILURE_MODES: leg failure → remaining legs not executed; parallel batch failure aborts sequential tail; source preserved per REQ-MOVE_SEMANTICS when rename not yet run
  TERMINATION: total when legs exhausted or first failure
  destResults := empty map destPath → DestResult
  { parallelBatch, sequentialTail } := partitionMovePlanLegs(plan)
  executeLeg(leg) := compare skip OR copy/rename OR verify per leg; recordSuccess/onItemProgress; return success boolean
  IF signal.aborted THEN SET error Cancelled AND RETURN early
  IF parallelBatch.length > 1 THEN
    batchResults := AWAIT Promise.all(parallelBatch.map executeLeg)
    IF any batchResults failed THEN allLegsSucceeded := false
    ELSE FOR EACH leg IN sequentialTail
      IF signal.aborted THEN BREAK
      IF NOT AWAIT executeLeg(leg) THEN BREAK
  ELSE
    FOR EACH leg IN plan.legs
      IF signal.aborted THEN BREAK
      IF NOT AWAIT executeLeg(leg) THEN BREAK
  RETURN { destResults: destPaths.map p → destResults[p], omitDeferredDelete: plan.omitDeferredDelete IF all succeeded ELSE false }
```

## PARTITION_MOVE_PLAN_LEGS

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: how: split initial contiguous cross-volume copy prefix from sequential tail (same-volume copies + rename)

```
IMPL-NSYNC_ENGINE_PARTITION_MOVE_PLAN_LEGS(plan):
  INPUT: MovePlan
  OUTPUT: { parallelBatch: MoveLeg[], sequentialTail: MoveLeg[] }
  PRE: plan.legs ordered per BUILD_MOVE_PLAN
  POST: parallelBatch is maximal prefix where op=copy AND volumeClass=cross-volume; sequentialTail is remainder
  EFFECTS: pure
  TERMINATION: total
  parallelBatch := []
  WHILE next leg is copy AND cross-volume THEN append to parallelBatch
  sequentialTail := remaining legs after prefix
  RETURN { parallelBatch, sequentialTail }
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

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-NSYNC_HYBRID_MOVE]: how: add source to sourcesToDelete only when move succeeded AND NOT omitDeferredDelete; delete phase unchanged for copy-only plans

```
IMPL-NSYNC_ENGINE_MoveSemantics():
  INPUT: sourcesToDelete Set, result flags, move option, per-item omitDeferredDelete
  OUTPUT: sources removed; delete failures appended to result.errors
  PRE: source loop complete
  POST: deferred sources deleted when move succeeded and plan did not end in rename; delete errors collected
  EFFECTS: IO
  FAILURE_MODES: delete failure → appended to result.errors without failing whole sync
  TERMINATION: total
  ON item success IF move AND NOT itemResult.omitDeferredDelete THEN sourcesToDelete.add(source)
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
