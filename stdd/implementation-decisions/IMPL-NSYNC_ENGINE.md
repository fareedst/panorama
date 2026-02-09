# IMPL-NSYNC_ENGINE

**Token**: `IMPL-NSYNC_ENGINE`  
**Name**: Sync Engine Core Implementation  
**Status**: Active  
**Cross-references**: `[REQ-NSYNC_MULTI_TARGET]`, `[REQ-MOVE_SEMANTICS]`, `[ARCH-NSYNC_INTEGRATION]`

---

## Summary

Implements a multi-destination file synchronization engine that orchestrates parallel syncing of files to multiple destinations with observer pattern for progress tracking, safe move semantics (delete source only after ALL destinations succeed), and store monitoring for failure detection.

---

## Rationale

### Why This Implementation

The nx1 file manager needs to efficiently sync files from a source pane to multiple destination panes simultaneously. Inspired by Goful's use of the Go nsync library, we implemented a JavaScript/TypeScript sync engine tailored for Node.js and integrated into the Next.js application.

### Problems Solved

1. **Sequential sync is slow**: Copying files to multiple destinations one at a time wastes time
2. **No progress tracking**: Long operations provided no feedback to users
3. **Unsafe move semantics**: Risk of data loss if source deleted before all destinations verified
4. **No failure detection**: Continued retrying when external drives detached

### Benefits

1. **Parallel sync**: All destinations synced simultaneously via `Promise.all`
2. **Real-time progress**: Observer pattern provides callbacks for start, progress, completion
3. **Safe move semantics**: Source deleted only after ALL destinations succeed
4. **Store failure detection**: Error streak tracking detects drive failures and aborts early
5. **Cancellation support**: `AbortSignal` integration for user cancellation

---

## Implementation Approach

### Architecture

```
SyncEngine
├── sync(sources, destinations, options)
│   ├── Build SyncPlan (calculate total bytes)
│   ├── Call observer.onStart(plan)
│   ├── For each source:
│   │   ├── syncItem(source, destinations)
│   │   │   ├── Get source stats
│   │   │   ├── Compute source hash (if verify or hash compare)
│   │   │   ├── Promise.all: syncToDestination() for each dest
│   │   │   │   ├── Compare files (skip if unchanged)
│   │   │   │   ├── Copy/move file
│   │   │   │   ├── Verify destination hash (if enabled)
│   │   │   │   └── Record success/error with StoreMonitor
│   │   │   └── Return ItemResult
│   │   ├── Update result counters
│   │   ├── Track sources to delete (for move)
│   │   └── Call observer.onItemComplete()
│   ├── Delete sources (if move and all succeeded)
│   └── Call observer.onFinish(result)
```

### Key Design Decisions

1. **Observer Pattern**: `SyncObserver` interface with 6 callbacks
   - `onStart(plan)` - Called once at start
   - `onItemStart(item)` - Before syncing each item
   - `onItemProgress(item, bytes)` - After each destination succeeds
   - `onItemComplete(item, result)` - After item synced to all destinations
   - `onProgress(stats)` - Cumulative progress update
   - `onFinish(result)` - Final result

2. **Move Semantics**: Track `sourcesToDelete` Set
   - Add source to set only if ALL destinations succeed
   - Delete sources after sync loop completes
   - If any destination fails, source preserved

3. **Store Monitoring**: `StoreMonitor` class
   - Track error streaks per destination path
   - Mark store unavailable after 3+ sequential errors
   - Abort sync if any store becomes unavailable

4. **Cancellation**: Check `signal?.aborted` before each item

5. **Error Classification**: `StoreMonitor.classifyError()`
   - `StoreUnavailable`: ENOENT, ENOTDIR, EROFS, EIO (count toward streak)
   - `FileSpecific`: EACCES, EPERM (don't count toward streak)

---

## Code Locations

### Primary Files

- **`src/lib/sync/engine.ts`** (~400 lines)
  - `SyncEngine` class
  - `sync()` - Main entry point
  - `syncItem()` - Sync single source to all destinations
  - `syncToDestination()` - Sync to single destination

- **`src/app/api/files/route.ts`**
  - `POST /api/files` with operation `"sync-all"`
  - Accepts: `sources[]`, `destinations[]`, `move`, `verify`, `hashAlgorithm`, `compareMethod`
  - Returns: `SyncResult`
  - **API validation**: sync-all does not use `src`; the route validates per operation so that only `copy`, `move`, `delete`, `rename` require `src`. sync-all requires `sources` and `destinations` arrays (validated in the sync-all case). This prevents 400 "Missing required parameters" when the client sends only sources/destinations for multi-panel copy.

- **`src/app/files/WorkspaceView.tsx`**
  - `handleCopyAll()` - Shift+C handler
  - `handleMoveAll()` - Shift+V handler
  - `getOtherPaneDirs()` - Helper to get destination paths
  - `getOperationFiles()` - Helper to get marked files or cursor file

### Configuration

- **`config/files.yaml`**
  - Keybindings: Shift+C (file.copyAll), Shift+V (file.moveAll)
  - Toolbar: Added copyAll/moveAll to pane toolbar

---

## Example Usage

### From Code

```typescript
import { SyncEngine } from "@/lib/sync";

const engine = new SyncEngine();

const result = await engine.sync(
  ["/path/to/file1.txt", "/path/to/file2.txt"], // sources
  ["/dest1", "/dest2", "/dest3"], // destinations
  {
    move: false,
    compareMethod: "size-mtime",
    verifyDestination: false,
    hashAlgorithm: "blake3",
    signal: abortController.signal,
  }
);

console.log(`✅ ${result.itemsCompleted} completed`);
console.log(`❌ ${result.itemsFailed} failed`);
console.log(`⏭️  ${result.itemsSkipped} skipped`);
```

### From UI

1. Open 3+ panes
2. Mark files in source pane
3. Press `Shift+C` (CopyAll) or `Shift+V` (MoveAll)
4. Confirm in dialog
5. View progress

---

## Testing

### Unit Tests

**File**: `src/lib/sync/engine.test.ts`

```typescript
✓ should sync a file to multiple destinations [REQ-NSYNC_MULTI_TARGET]
✓ should skip unchanged files [REQ-COMPARE_METHODS]
✓ should call observer callbacks [REQ-SDK_OBSERVER]
✓ should handle move semantics [REQ-MOVE_SEMANTICS]
```

**Result**: 4/4 tests passing

### Integration Testing

- Manual testing: CopyAll/MoveAll in UI with 3+ panes
- Verification: Files appear in all destination panes
- Move testing: Source files deleted after successful move

---

## Dependencies

- `@noble/hashes` - BLAKE3, SHA-256 hash computation
- `xxhash-wasm` - XXH3 hash computation
- `fs.promises` - Node.js file system operations

---

## Traceability

### Requirements
- `[REQ-NSYNC_MULTI_TARGET]` - Multi-destination sync
- `[REQ-MOVE_SEMANTICS]` - Safe source deletion

### Architecture
- `[ARCH-NSYNC_INTEGRATION]` - Integration architecture

### Related Implementations
- `[IMPL-NSYNC_HASH]` - Hash computation
- `[IMPL-NSYNC_VERIFY]` - Destination verification
- `[IMPL-NSYNC_COMPARE]` - File comparison
- `[IMPL-NSYNC_OPERATIONS]` - File operations
- `[IMPL-NSYNC_STORE]` - Store monitoring

### Tests
- `src/lib/sync/engine.test.ts` - 4 passing unit tests
- `src/app/api/files/route.test.ts` - POST validation and sync-all acceptance (no `src` required)

---

## API Validation (Operation-Specific)

The file operations API (`POST /api/files`) validates required body fields per operation:

- **Single-item operations** (`copy`, `move`, `delete`, `rename`): require `operation` and `src`; `dest` where applicable.
- **sync-all** [IMPL-NSYNC_ENGINE]: does not require `src`. Requires `sources` (array) and `destinations` (array). Validated inside the `sync-all` case.
- **bulk-copy / bulk-move**: require `sources` and `dest`; no `src`.
- **bulk-delete**: require `sources` only; no `src`.

Path traversal checks (`..`) run only when `src` or `dest` are present, so sync-all requests are not rejected by the generic path check.

---

## Validation

**Date**: 2026-02-09  
**Validator**: AI Agent  
**Result**: ✅ Pass

- 4/4 sync engine unit tests passing
- 6/6 POST /api/files route tests passing (operation validation, sync-all without src)
- Zero linter errors
- Production build succeeds
- Manual UI testing successful (Copy to All Panes)

---

## Metadata

**Created**: 2026-02-09 by AI Agent  
**Last Updated**: 2026-02-09 by AI Agent  
**Reason**: API validation fix (sync-all must not require `src`); added route tests and STDD docs
