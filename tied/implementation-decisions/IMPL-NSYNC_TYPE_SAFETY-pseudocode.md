# IMPL-NSYNC_TYPE_SAFETY essence pseudocode

// [IMPL-NSYNC_TYPE_SAFETY]: TypeScript strict-mode fixes for Node.js stat.size bigint, stream chunk string|Buffer, and value imports for ErrorClass and NoopObserver

## Summary contract

// [IMPL-NSYNC_TYPE_SAFETY]: how: normalize bigint sizes to number at three engine sites; coerce stream chunks to Buffer in hash streaming; import ErrorClass and NoopObserver as values not type-only

CONTRACT Summary
  INPUT: stat.size (number | bigint), stream chunk (string | Buffer), sync.types exports used at runtime
  OUTPUT: number sizes in SyncPlan, SyncResult, ItemInfo; Buffer passed to hasher; compilable imports
  DATA: typeof stat.size === 'bigint' ? Number(stat.size) : stat.size; typeof chunk === 'string' ? Buffer.from(chunk) : chunk
  CONTROL: no runtime behavior change beyond type coercion

## ConvertStatSizeBigint

// [IMPL-NSYNC_TYPE_SAFETY]: how: apply bigint-to-number conversion when accumulating plan.totalBytes, result.bytesCopied, and ItemInfo.size

CONTRACT ConvertStatSizeBigint
  INPUT: stat.size from fs.stat
  OUTPUT: number safe for arithmetic

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_ConvertStatSizeBigint(stat)
  RETURN IF typeof stat.size === bigint THEN Number(stat.size) ELSE stat.size
  APPLY in sync() plan.totalBytes accumulation
  APPLY in sync() bytesCopied after successful item
  APPLY in syncItem() ItemInfo.size assignment

## HandleStreamChunkTypes

// [IMPL-NSYNC_TYPE_SAFETY]: how: computeStreamHash data handler normalizes string chunks before hasher.update

CONTRACT HandleStreamChunkTypes
  INPUT: chunk from read stream data event
  OUTPUT: Buffer for hasher.update

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_HandleStreamChunkTypes(chunk)
  buffer := IF typeof chunk === string THEN Buffer.from(chunk) ELSE chunk
  hasher.update(buffer)

## ErrorClassNoopObserverImports

// [IMPL-NSYNC_TYPE_SAFETY]: how: engine.ts imports ErrorClass and NoopObserver as runtime values (not import type) for enum access and default observer

CONTRACT ErrorClassNoopObserverImports
  INPUT: sync.types module exports
  OUTPUT: compilable value imports in engine.ts

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_ErrorClassNoopObserverImports()
  IMPORT ErrorClass, NoopObserver from sync.types as values
  USE ErrorClass.FileSpecific, ErrorClass.VerifyFailed in sync result and store monitor calls
  USE NoopObserver as default when constructor observer omitted

## CodeLocations

// [IMPL-NSYNC_TYPE_SAFETY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/engine.ts — stat.size conversion (3 sites), ErrorClass and NoopObserver imports
// FILE: src/lib/sync/hash.ts — stream chunk coercion in computeStreamHash
// TEST: (build) npm run build / tsc — zero TypeScript errors with strict mode

## ErrorHandling

// [IMPL-NSYNC_TYPE_SAFETY]: how: coercion is pure transform — invalid bigint still passes through Number(); no additional error paths

PROCEDURE IMPL-NSYNC_TYPE_SAFETY_on_error(context, error)
  NOT APPLICABLE — type-only normalization
