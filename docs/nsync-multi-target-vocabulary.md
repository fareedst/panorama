# NSYNC multi-target sync vocabulary (canonical)

## Scope

**Multi-destination file synchronization** from one **source pane** to all **other visible panes** (Copy to All / Move to All), including the `SyncEngine`, API `sync-all` operation, skip/verify/compare options, and safe **move semantics**. Excludes single-destination copy/move between two panes (`file.copy` / `file.move`) and Mesh orchestration ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-NSYNC_MULTI_TARGET](../tied/requirements/REQ-NSYNC_MULTI_TARGET.yaml), [REQ-MOVE_SEMANTICS](../tied/requirements/REQ-MOVE_SEMANTICS.yaml), [REQ-COMPARE_METHODS](../tied/requirements/REQ-COMPARE_METHODS.yaml), [REQ-HASH_COMPUTATION](../tied/requirements/REQ-HASH_COMPUTATION.yaml), [REQ-VERIFY_DEST](../tied/requirements/REQ-VERIFY_DEST.yaml), [REQ-STORE_FAILURE_DETECT](../tied/requirements/REQ-STORE_FAILURE_DETECT.yaml) |
| ARCH | [ARCH-NSYNC_INTEGRATION](../tied/architecture-decisions/ARCH-NSYNC_INTEGRATION.yaml) |
| IMPL | [IMPL-NSYNC_ENGINE](../tied/implementation-decisions/IMPL-NSYNC_ENGINE.yaml), [IMPL-NSYNC_OPERATIONS](../tied/implementation-decisions/IMPL-NSYNC_OPERATIONS.yaml), [IMPL-NSYNC_COMPARE](../tied/implementation-decisions/IMPL-NSYNC_COMPARE.yaml), [IMPL-NSYNC_HASH](../tied/implementation-decisions/IMPL-NSYNC_HASH.yaml), [IMPL-NSYNC_VERIFY](../tied/implementation-decisions/IMPL-NSYNC_VERIFY.yaml), [IMPL-NSYNC_STORE](../tied/implementation-decisions/IMPL-NSYNC_STORE.yaml) |
| Pseudo-code | [IMPL-NSYNC_ENGINE-pseudocode.md](../tied/implementation-decisions/IMPL-NSYNC_ENGINE-pseudocode.md) |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Multi-target sync** | “multi-destination sync”, “sync to all panes”, “CopyAll” (product name only in UI copy) |
| **Source** (sync) | “source pane”, `sources[]` — paths marked or under cursor in **focused pane** |
| **Destination** | “target pane”, “target directory”, `destinations[]` — directory paths of non-focused panes |
| **Sync operation** | `sync-all` (API), `SyncEngine.sync()` (code) — not “bulk copy” (that is `bulk-copy`) |
| **Compare method** | “skip policy”, `compareMethod` — how to detect unchanged files before copy |
| **Skip unchanged** | “smart skip”, `destResult.skipped` |
| **Move semantics** | “safe move” — delete source only after **all** destinations succeed for that item |
| **Store monitor** | “store failure detection”, `StoreMonitor`, `storeFailureAbort` |
| **Sync observer** | “progress callbacks”, `SyncObserver` (`onStart`, `onItemComplete`, `onFinish`, …) |
| **Sync plan** | `SyncPlan` — `totalItems`, `totalBytes`, `totalDestinations` at start |

## Naming bridge

| Canonical concept | UI label | Icon name | Config / API | Keybind action | Code symbol |
| --- | --- | --- | --- | --- | --- |
| Copy to all panes | toolbar “Copy to All” | `copy-all` | POST `operation: "sync-all"`, `move: false` | `file.copyAll` (Shift+C) | `handleCopyAll` |
| Move to all panes | toolbar “Move to All” | `move-all` | POST `sync-all`, `move: true` | `file.moveAll` (Shift+V) | `handleMoveAll` |
| Default compare | — | `compareMethod: "size-mtime"` (body default) | — | `CompareMethod` |
| Verify destination | — | `verifyDestination` / `verify` | — | post-copy hash check |
| Hash algorithm | — | `hashAlgorithm`: `blake3`, `sha256`, `xxh3` | — | `HashAlgorithm` |
| Cancellation | — | `AbortSignal` | — | `signal.aborted`, `cancelled` |

### Compare method values (`CompareMethod`)

| Value | Preferred description |
| --- | --- |
| `none` | Always copy (no skip) |
| `size` | Skip when destination size matches source |
| `mtime` | Skip when modification time matches |
| `size-mtime` | Skip when **both** size and mtime match (default) |
| `hash` | Skip when content hash matches (slowest; may run with verify) |

## Named concepts

- **SyncEngine** — Orchestrates per-source iteration, parallel per-destination copies, observer callbacks, and deferred source deletes for move (`src/lib/sync/engine.ts`).
- **Item** — One source path synced to every destination; yields `ItemResult` with `destResults[]`.
- **Destination result** — Per-destination outcome: `destPath`, optional `error`, `skipped` flag.
- **Sync result** — Aggregate `SyncResult`: counts, `errors[]`, `cancelled`, `storeFailureAbort`.
- **Error class** — `ErrorClass` enum: `file_specific`, `store_unavailable`, `verify_failed`, `cancelled`, `unknown`.
- **Other pane directories** — Helper concept: paths of all panes except `focusIndex`; becomes `destinations` for sync-all.

Algorithms: see [IMPL-NSYNC_ENGINE-pseudocode.md](../tied/implementation-decisions/IMPL-NSYNC_ENGINE-pseudocode.md) blocks below — vocabulary only here.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Sync entry / plan | `SyncMethod` → `IMPL-NSYNC_ENGINE_SyncMethod` | IMPL-NSYNC_ENGINE |
| Per-source loop | `ForEachSource` → `IMPL-NSYNC_ENGINE_ForEachSource` | IMPL-NSYNC_ENGINE |
| One source → all destinations | `SyncItem` → `IMPL-NSYNC_ENGINE_SyncItem` | IMPL-NSYNC_ENGINE |
| Compare / skip unchanged | `SkipUnchanged` → `IMPL-NSYNC_ENGINE_SkipUnchanged` | IMPL-NSYNC_ENGINE |
| Safe move delete phase | `MoveSemantics` → `IMPL-NSYNC_ENGINE_MoveSemantics` | IMPL-NSYNC_ENGINE |
| Progress callbacks | `ObserverCallbacks` → `IMPL-NSYNC_ENGINE_ObserverCallbacks` | IMPL-NSYNC_ENGINE |
| Store failure abort | `StoreMonitor` → `IMPL-NSYNC_ENGINE_StoreMonitor` | IMPL-NSYNC_ENGINE |
| Copy/move/delete primitives | `CopyFile`, `MoveFile`, `DeleteFile` | IMPL-NSYNC_OPERATIONS |

## Alphabetical index

- **Compare method** — `none`, `size`, `mtime`, `size-mtime`, `hash`
- **Destination** — target directory path
- **Move semantics** — deferred delete after all destinations succeed
- **Multi-target sync** — sync-all to all other panes
- **Skip unchanged** — skip copy when compare says equal
- **Source** — focused-pane selected paths
- **Store monitor** — abort after repeated store errors
- **Sync observer** — progress callback surface
- **Sync plan** — upfront totals for UI
- **Sync-all** — API operation name

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [file-marking-vocabulary.md](file-marking-vocabulary.md) — how sources are chosen
- [workspace-pane-vocabulary.md](workspace-pane-vocabulary.md) — pane / focus
- [docs/NSYNC_IMPLEMENTATION_COMPLETE.md](NSYNC_IMPLEMENTATION_COMPLETE.md) — implementation history (non-canonical)
