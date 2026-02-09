# IMPL-NSYNC_TYPE_SAFETY

**Token**: `IMPL-NSYNC_TYPE_SAFETY`  
**Name**: TypeScript Type Safety for Node.js Types  
**Status**: Active  
**Cross-references**: `[IMPL-NSYNC_ENGINE]`, `[IMPL-NSYNC_HASH]`

---

## Summary

Implements type guards and conversions to handle Node.js type incompatibilities (bigint file sizes, stream types, import type restrictions) ensuring TypeScript strict mode compilation succeeds.

---

## Rationale

### Why This Implementation

During the nsync implementation, TypeScript's strict type checking caught several incompatibilities with Node.js built-in types that prevented production builds. These needed to be fixed to deploy the application.

### Problems Solved

1. **`stat.size` bigint incompatibility**: `fs.stat()` returns `size` as `number | bigint` (bigint for very large files > 2GB), but our code expected only `number`
2. **Stream chunk type incompatibility**: Stream `data` event can emit `string | Buffer`, but our hash code expected only `Buffer`
3. **Import type restriction**: `ErrorClass` was imported as `import type` but used as a value (accessing enum members)

### Benefits

1. **Production-ready build**: TypeScript compilation succeeds with zero errors
2. **Large file support**: Correctly handles files > 2GB with bigint conversion
3. **Stream robustness**: Handles both string and Buffer stream chunks
4. **Type correctness**: Proper import statements for enums used as values

---

## Implementation Approach

### Issue 1: `stat.size` Bigint Handling

**Problem**:
```typescript
// Error: Operator '+=' cannot be applied to types 'number' and 'number | bigint'
plan.totalBytes += stat.size;
```

**Root Cause**: Node.js `fs.Stats.size` is typed as `number | bigint` to handle files larger than 2GB (2^31-1 bytes). TypeScript strict mode won't allow implicit conversion.

**Solution**: Type guard with explicit conversion
```typescript
plan.totalBytes += typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;
```

**Applied in 3 locations**:
1. Line 89 (`src/lib/sync/engine.ts`): `plan.totalBytes` calculation
2. Line 169 (`src/lib/sync/engine.ts`): `result.bytesCopied` calculation
3. Line 261 (`src/lib/sync/engine.ts`): `ItemInfo.size` assignment

**Trade-off**: Converting bigint to number loses precision for files > 9 PB (9,007,199,254,740,992 bytes). This is acceptable because:
- Modern file systems don't support single files that large
- Even if they did, progress tracking precision at that scale is not critical
- Alternative would be changing all `number` types to `number | bigint` throughout the codebase, which is complex and unnecessary

### Issue 2: Stream Chunk Type Handling

**Problem**:
```typescript
// Error: Type 'string | Buffer' is not assignable to type 'Buffer'
stream.on("data", (chunk: Buffer) => {
  hasher.update(chunk);
});
```

**Root Cause**: Node.js `ReadStream` can emit chunks as either `string` (if encoding set) or `Buffer` (binary mode, default). TypeScript requires handling both.

**Solution**: Type union with conditional conversion
```typescript
stream.on("data", (chunk: string | Buffer) => {
  const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
  hasher.update(buffer);
});
```

**Applied in**: Line 111-114 (`src/lib/sync/hash.ts`)

**Why this works**: Even though we create stream without encoding (so chunks should always be Buffer), TypeScript's type system requires we handle both cases for type safety.

### Issue 3: ErrorClass Import Fix

**Problem**:
```typescript
// Error: 'ErrorClass' cannot be used as a value because it was imported using 'import type'
import type { ErrorClass } from "../sync.types";
// ...later...
errorClass: ErrorClass.FileSpecific  // ❌ Can't access enum member
```

**Root Cause**: TypeScript's `import type` is for type-only imports (erased at runtime). Enums need value imports because they exist at runtime.

**Solution**: Move to regular import
```typescript
import { ErrorClass, NoopObserver } from "../sync.types";
import type { SyncOptions, SyncResult, ... } from "../sync.types";
```

**Applied in**: Line 7 (`src/lib/sync/engine.ts`)

**Why separate imports**: 
- `ErrorClass` and `NoopObserver` need runtime existence (value imports)
- Other types like `SyncOptions`, `SyncResult` are pure types (type imports)
- Keeping type imports separate allows TypeScript to optimize bundle size

---

## Code Changes

### File: `src/lib/sync/engine.ts`

**Change 1** (Line 7): Import statement fix
```diff
- import type {
+ import { ErrorClass, NoopObserver } from "../sync.types";
+ import type {
    SyncOptions,
    SyncResult,
    ...
-   ErrorClass,
    SyncObserver,
  } from "../sync.types";
- import { NoopObserver } from "../sync.types";
```

**Change 2** (Line 89): Plan totalBytes calculation
```diff
  for (const source of sources) {
    const stat = await getFileStat(source);
    if (stat) {
-     plan.totalBytes += stat.size;
+     plan.totalBytes += typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;
    }
  }
```

**Change 3** (Line 169): Result bytesCopied calculation
```diff
  const stat = await getFileStat(source);
  if (stat) {
    const copiedCount = itemResult.destResults.filter((dr) => !dr.skipped && !dr.error).length;
-   result.bytesCopied += stat.size * copiedCount;
+   const size = typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;
+   result.bytesCopied += size * copiedCount;
  }
```

**Change 4** (Line 261): ItemInfo size assignment
```diff
  const item: ItemInfo = {
    sourcePath: source,
-   size: sourceStat.size,
+   size: typeof sourceStat.size === 'bigint' ? Number(sourceStat.size) : sourceStat.size,
    isDirectory: sourceStat.isDirectory(),
  };
```

### File: `src/lib/sync/hash.ts`

**Change 5** (Line 111-114): Stream chunk handling
```diff
- stream.on("data", (chunk: Buffer) => {
-   hasher.update(chunk);
+ stream.on("data", (chunk: string | Buffer) => {
+   const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
+   hasher.update(buffer);
  });
```

---

## Build Verification

### Before Fixes

```bash
$ npm run build

Failed to compile.

./src/lib/sync/engine.ts:87:9
Type error: Operator '+=' cannot be applied to types 'number' and 'number | bigint'.

./src/lib/sync/engine.ts:147:25
Type error: 'ErrorClass' cannot be used as a value because it was imported using 'import type'.

./src/lib/sync/engine.ts:167:35
Type error: Operator '*' cannot be applied to types 'number | bigint' and 'number'.

./src/lib/sync/engine.ts:259:7
Type error: Type 'number | bigint' is not assignable to type 'number'.

./src/lib/sync/hash.ts:111:23
Type error: Argument of type '(chunk: Buffer) => void' is not assignable to parameter of type '(chunk: string | Buffer<ArrayBufferLike>) => void'.
```

### After Fixes

```bash
$ npm run build

✓ Compiled successfully in 2.1s
  Running TypeScript ...
  Collecting page data using 9 workers ...
✓ Generating static pages using 9 workers (13/13) in 197.3ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/files
...

Build completed successfully!
```

---

## Testing

### Type Checking

```bash
$ npm run build
# Result: ✅ Zero TypeScript errors
```

### Runtime Testing

- Unit tests still pass: `npm test -- sync/engine.test.ts` ✅
- No linter errors: `ReadLints` tool ✅
- Manual UI testing: CopyAll/MoveAll work correctly ✅

---

## Best Practices

### When to Use Type Guards

Use type guards for Node.js union types:

```typescript
// ✅ Good: Handle both cases
const size = typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;

// ❌ Bad: Assume one type
const size = stat.size; // Type error if stat.size is bigint
```

### When to Use Type vs Value Imports

```typescript
// ✅ Good: Separate value and type imports
import { ErrorClass } from "./types";        // Runtime value (enum)
import type { SyncOptions } from "./types";  // Type-only (erased)

// ❌ Bad: Type-only import for enum
import type { ErrorClass } from "./types";   // Can't access .FileSpecific
```

### Stream Type Handling

```typescript
// ✅ Good: Handle both string and Buffer
stream.on("data", (chunk: string | Buffer) => {
  const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
  // Use buffer...
});

// ❌ Bad: Assume Buffer
stream.on("data", (chunk: Buffer) => {  // Type error
  // ...
});
```

---

## Traceability

### Related Implementations
- `[IMPL-NSYNC_ENGINE]` - Sync engine using these type fixes
- `[IMPL-NSYNC_HASH]` - Hash computation with stream type handling

### Build Verification
- `npm run build` - Passes with zero TypeScript errors
- `npm test -- sync/engine.test.ts` - 4/4 tests passing

---

## Validation

**Date**: 2026-02-09  
**Validator**: AI Agent  
**Result**: ✅ Pass

- Production build succeeds
- Zero TypeScript compilation errors
- All unit tests passing
- No runtime errors
- No linter errors

---

## Metadata

**Created**: 2026-02-09 by AI Agent  
**Last Updated**: 2026-02-09 by AI Agent  
**Reason**: Initial creation after TypeScript build fixes
