# IMPL-NSYNC_TYPE_SAFETY essence pseudocode

// [IMPL-NSYNC_TYPE_SAFETY]: TypeScript strict-mode fixes for Node.js stat.size bigint, stream chunk string|Buffer, and value imports for ErrorClass and NoopObserver

## Summary contract

// [IMPL-NSYNC_TYPE_SAFETY]: how: normalize bigint sizes to number at three engine sites; coerce stream chunks to Buffer in hash streaming; import ErrorClass and NoopObserver as values not type-only

```
IMPL-NSYNC_TYPE_SAFETY_Summary():
  INPUT: stat.size (number | bigint), stream chunk (string | Buffer), sync.types exports used at runtime
  OUTPUT: number sizes in SyncPlan, SyncResult, ItemInfo; Buffer passed to hasher; compilable imports
  DATA: typeof stat.size === 'bigint' ? Number(stat.size) : stat.size; typeof chunk === 'string' ? Buffer.from(chunk) : chunk
  PRE: TypeScript strict mode enabled; Node fs stat and stream APIs available
  POST: arithmetic uses number sizes; hasher receives Buffer chunks; engine.ts compiles with value imports
  EFFECTS: pure (type coercion only)
  CONTROL: no runtime behavior change beyond type coercion
  TERMINATION: total
```

## ConvertStatSizeBigint

// [IMPL-NSYNC_TYPE_SAFETY]: how: apply bigint-to-number conversion when accumulating plan.totalBytes, result.bytesCopied, and ItemInfo.size

```
IMPL-NSYNC_TYPE_SAFETY_ConvertStatSizeBigint(stat):
  INPUT: stat.size from fs.stat
  OUTPUT: number safe for arithmetic
  PRE: stat object with size field
  POST: returned value is number for bigint or number inputs
  EFFECTS: pure
  TERMINATION: total
  RETURN IF typeof stat.size === bigint THEN Number(stat.size) ELSE stat.size
  APPLY in sync() plan.totalBytes accumulation
  APPLY in sync() bytesCopied after successful item
  APPLY in syncItem() ItemInfo.size assignment
```

## HandleStreamChunkTypes

// [IMPL-NSYNC_TYPE_SAFETY]: how: computeStreamHash data handler normalizes string chunks before hasher.update

```
IMPL-NSYNC_TYPE_SAFETY_HandleStreamChunkTypes(chunk):
  INPUT: chunk from read stream data event
  OUTPUT: Buffer for hasher.update
  PRE: chunk is string or Buffer from stream
  POST: hasher.update receives Buffer
  EFFECTS: pure transform
  TERMINATION: total
  buffer := IF typeof chunk === string THEN Buffer.from(chunk) ELSE chunk
  hasher.update(buffer)
```

## ErrorClassNoopObserverImports

// [IMPL-NSYNC_TYPE_SAFETY]: how: engine.ts imports ErrorClass and NoopObserver as runtime values (not import type) for enum access and default observer

```
IMPL-NSYNC_TYPE_SAFETY_ErrorClassNoopObserverImports():
  INPUT: sync.types module exports
  OUTPUT: compilable value imports in engine.ts
  PRE: sync.types exports ErrorClass enum and NoopObserver class
  POST: engine.ts uses value imports for runtime enum and default observer
  EFFECTS: compile-time module graph
  TERMINATION: total
  IMPORT ErrorClass, NoopObserver from sync.types as values
  USE ErrorClass.FileSpecific, ErrorClass.VerifyFailed in sync result and store monitor calls
  USE NoopObserver as default when constructor observer omitted
```

## CodeLocations

// [IMPL-NSYNC_TYPE_SAFETY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/engine.ts — stat.size conversion (3 sites), ErrorClass and NoopObserver imports
// FILE: src/lib/sync/hash.ts — stream chunk coercion in computeStreamHash
// TEST: src/lib/sync/engine.test.ts — bigint stat.size normalization via sync; build/tsc strict mode

## ErrorHandling

// [IMPL-NSYNC_TYPE_SAFETY]: how: coercion is pure transform — invalid bigint still passes through Number(); no additional error paths

```
IMPL-NSYNC_TYPE_SAFETY_on_error(context, error):
  INPUT: context, error
  OUTPUT: not applicable
  PRE: none
  POST: none
  EFFECTS: none
  TERMINATION: total
  NOT APPLICABLE — type-only normalization
```
