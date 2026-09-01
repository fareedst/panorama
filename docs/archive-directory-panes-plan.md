# Open Archives as Read-Only Panes — Control Plan

**Status:** Complete — pending `traceable-commit` (close-out gate blocked until commit)  
**Methodology:** TIED 3.0.0  
**Request token:** `[REQ-ARCHIVE_DIRECTORY_PANES]`  
**Product vocabulary:** **Workspace**, **Pane**, **Archive-backed pane**, and **Virtual archive path** follow `[tied/vocab/workspace-pane.md](../tied/vocab/workspace-pane.md)` plus `[tied/vocab/archive-pane.md](../tied/vocab/archive-pane.md)` (RECORD complete).  
**Existing traceability:** `[REQ-FILE_LISTING]`, `[REQ-DIRECTORY_NAVIGATION]`, `[REQ-FILE_OPERATIONS]`, `[REQ-COPY_OPERATIONS]`, `[REQ-BULK_FILE_OPS]`, `[REQ-CROSS_PANE_COMPARISON]`, `[REQ-FILE_PREVIEW]`, `[REQ-WORKSPACE_MESH_BRIDGE]`, `[REQ-PANE_VOLUME_CAPACITY]`, `[ARCH-FILESYSTEM_ABSTRACTION]`, `[ARCH-SERVER_CLIENT_BOUNDARY]`, `[ARCH-FILE_OPERATIONS_API]`, `[ARCH-COMPARISON_INDEX]`, `[ARCH-PREVIEW_SYSTEM]`, `[IMPL-FILES_DATA]`, `[IMPL-FILES_API]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-FILE_PANE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[IMPL-COMPARISON_INDEX]`, `[IMPL-FILE_PREVIEW]`, `[IMPL-PANE_VOLUME_CAPACITY]`  
**Tokens registered:** `[REQ-ARCHIVE_DIRECTORY_PANES]`, `[ARCH-ARCHIVE_DIRECTORY_PANES]`, `[IMPL-ARCHIVE_DIRECTORY_PANES]` (TIED MCP, 2026-09-01)  
**Working folder:** `working/REQ-ARCHIVE_DIRECTORY_PANES/`  
**CITDP (draft):** `working/REQ-ARCHIVE_DIRECTORY_PANES/citdp-draft.yaml`  
**Checklist tracker:** `working/REQ-ARCHIVE_DIRECTORY_PANES/checklist-tracker-ARCHIVE_DIRECTORY_PANES.yaml`  
**Test strategy:** `working/REQ-ARCHIVE_DIRECTORY_PANES/test-strategy-outline.md`

---

## Executive summary

Add **read-only archive-backed panes** that participate in normal listing, navigation, comparison, and copy/extract workflows. Opening a supported archive presents a **virtual directory view** of its entries. The server parses archives through a dedicated adapter module, projects entries into the existing `FileStat` listing shape, and supports **bounded single-entry extraction** into ordinary filesystem destinations. The source archive file is never rewritten, renamed, deleted, moved, or modified.

Primary design constraints:

1. **Virtual paths must round-trip** — A canonical **virtual archive locator** must survive `/files` query params, pane state, workspace mesh restore, and pane URL deep links without overloading ordinary absolute paths.
2. **Parser isolation** — Archive parsing stays server-only (`src/lib/archive/`); no parser dependencies in client bundles.
3. **Read-only enforcement is layered** — UI gating plus API rejection of mutating operations for archive sources/destinations; extraction is the only write path from archive content.
4. **Safety by default** — Reject traversal/absolute entry names, bound manifest read and extraction size, sanitize errors; treat untrusted archives as external input.
5. **Shared reader with preview** — Reconcile the existing archive preview stub (`[REQ-FILE_PREVIEW]` / `GET /api/files/preview?type=archive`) with the shared manifest reader so preview and panes do not diverge.

**First-release decisions (resolved):**


| Decision                   | Resolution                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Virtual locator            | `@archive/v1/{base64url(JSON)}` where payload is `{ "a": "<absolute archive path>", "e": "<entry path within archive or empty for root>" }`                  |
| v1 supported formats       | **ZIP** (`yauzl`); **TAR / TAR.GZ** (`tar-stream` + Node `zlib`). Registry lists capabilities explicitly.                                                    |
| v1 deferred formats        | **TAR.BZ2**, **7z**, **RAR**, and nested-archive navigation return stable `FORMAT_UNSUPPORTED` (not crash, not partial open) until a follow-on adapter slice |
| Nested archives            | Out of scope — archive-within-archive entries appear as opaque files; Enter does not open them                                                               |
| Directory extraction       | Out of scope for v1 — only **file** entries extract; directory rows remain navigable                                                                         |
| Symlink / hardlink entries | **List** with metadata flags; **extract rejects** symlinks; hardlinks listed as separate entries when manifest exposes them                                  |
| Duplicate entry names      | Deterministic **first stable entry wins** in projection; log duplicate at `warn`; UI shows one row                                                           |
| Volume capacity            | Reuse host volume of the **archive file path** via existing `getVolumeStats(archivePath)`; never imply archive contents consume independent volume           |
| Comparison index key       | Continue **basename** (`file.name`) participation; archive entries compare on normalized name/size/mtime like ordinary files                                 |
| Copy UX label              | Archive sources use **Extract…** (or equivalent copy label) in context menu; destructive actions hidden/disabled                                             |
| Mesh snapshot              | Persist virtual locator in `pane.path`; do **not** persist ephemeral listing fields; restore degrades with warning if archive missing                        |
| Preview reconciliation     | Shared manifest reader powers preview top-level listing in same release (replace stub message)                                                               |
| Mesh “archive” lifecycle   | Unrelated — soft-archived mesh records per `[REQ-MESH_CRUD]`; do not conflate terminology                                                                    |


---

## A. Refine

### A.1 Scope and boundaries

**In scope**

- Server-only archive adapter module with format detector/registry, manifest reader, normalized entry model, virtual-directory projection, bounded single-file extraction
- Canonical virtual archive locator encoding/decoding (URL-safe, round-trip)
- Extended shared types (`FileStat` + archive source metadata) sufficient for sort/filter/comparison
- Listing integration in `GET /api/files` for virtual locators; ordinary paths unchanged
- Dedicated POST operation `extract-archive-entry` (archive file + entry path → ordinary dest)
- Rejection of move/delete/rename/touch/execute/mkdir/archive-to-archive for archive-backed paths
- Pane open/descend/parent navigation for archives; read-only UI and context-menu gating
- Cross-pane comparison participation with existing comparison index semantics
- Volume stats semantics for archive-backed panes (host archive file volume)
- Mesh restore compatibility and degradation for missing/invalid archives
- Shared reader hook for `[IMPL-FILE_PREVIEW]` archive branch
- Unit, API contract, composition, and component tests; TIED REQ/ARCH/IMPL + validated pseudo-code before RED
- Fixture archives under test fixtures (small synthetic zips/tars)

**Out of scope**

- Nested archive navigation (open `.zip` inside `.zip`)
- Directory-level or bulk archive extraction (multi-entry tree extract)
- Archive creation, repacking, or in-place modification
- Archive-to-archive copy/move
- Writable virtual filesystem layers beyond extract-to-ordinary-dest
- Client-side parsing or preview of raw archive bytes
- NSYNC sync from/to archive locators
- Replacing `[REQ-FILE_PREVIEW]` text/image preview behavior
- 7z/RAR adapters in v1 (registry stub + explicit unsupported)
- E2E unless component tests cannot prove a11y affordances

**Unchanged behavior**

- Ordinary directory listing, copy/move/delete/rename, display filters, cross-pane visibility
- NSYNC operations on ordinary paths
- Mesh snapshot schema version and non-path pane fields
- Path validation order (`..` rejection) before IO
- Comparison mode off/name/size/time algorithms for ordinary files

### A.2 Proof labels


| Label                 | Meaning                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| observed (structural) | `pseudocode_validate`, `tied_validate_consistency`, `lint_yaml`                            |
| observed (executable) | Vitest / `bunx tsc -b` with exit status                                                    |
| recommended           | Work defined here but not yet performed                                                    |
| residual risk         | Limitation after available evidence (e.g. zip-bomb edge cases, exotic compression methods) |


### A.3 Baseline and implementation progress


| Layer                 | Extension point                      | Role                                                     | Status                                                             |
| --------------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Archive adapter       | `src/lib/archive/**`                 | Format registry, manifest read, projection, extract      | **Done** (Tranches 1–2) — list/project/extract                     |
| Types                 | `src/lib/files.types.ts`             | `archiveSource` on `FileStat`                            | **Done** — inline type on `FileStat`                               |
| Server listing bridge | `src/lib/directory-listing.ts`       | Shared GET/SSR listing + mutation guards                 | **Done** — Tranches 3–4                                            |
| Server data           | `src/lib/files.data.ts`              | Ordinary FS ops (unchanged)                              | **Unchanged** — extract wired via route → domain, not `files.data` |
| HTTP listing          | `src/app/api/files/route.ts`         | Branch virtual locator vs `listDirectory`                | **Done** — GET branch + route tests                                |
| HTTP extract          | `src/app/api/files/route.ts`         | `extract-archive-entry` POST branch                      | **Done** — POST op + `VIRTUAL_PATH_MUTATION_REJECTED` guards       |
| Client fetch          | `src/lib/pane-display-filter.ts`     | Carry archive metadata through normalization             | **Done** — passthrough + test                                      |
| SSR bootstrap         | `src/app/files/page.tsx`             | Decode virtual locators on initial panes                 | **Done** — `listDirectoryForRequestPath`                           |
| Mesh restore          | `src/lib/workspace-mesh-bridge.ts`   | Virtual path in snapshot `pane.path`; listing via API    | **Done** — Tranche 5 degrade                                       |
| Orchestration         | `src/app/files/WorkspaceView.tsx`    | Open archive, descend, parent, read-only pane flags      | **Done** — Tranche 5                                               |
| Presentation          | `FilePane.tsx`, `ContextMenu.tsx`    | Read-only chrome, Extract action, disabled mutators      | **Done** — Tranche 6                                               |
| Preview               | `src/app/api/files/preview/route.ts` | Shared manifest reader (top-level entries)               | **Done** — Tranche 7                                               |
| Volume capacity       | `src/lib/volume-stats.ts`            | Unchanged provider; archive panes pass archive file path | **Done** — `volumeStatsSourcePath`                                 |


**Observed module layout (Tranches 1–4):**


| File                                                   | Responsibility                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `src/lib/archive/virtual-path.ts`                      | `encodeVirtualArchivePath`, `decodeVirtualArchivePath`, `isVirtualArchivePath`           |
| `src/lib/archive/format-registry.ts`                   | `detectArchiveFormat` — ZIP/TAR/TAR.GZ supported; 7z/RAR/TAR.BZ2 stub                    |
| `src/lib/archive/entry-path.ts`                        | Traversal/absolute/NUL rejection                                                         |
| `src/lib/archive/zip-adapter.ts` / `tar-adapter.ts`    | Manifest readers + entry extract streams                                                 |
| `src/lib/archive/manifest.ts`                          | `readArchiveManifest` orchestration                                                      |
| `src/lib/archive/project.ts`                           | `projectArchiveDirectory` → `FileStat[]` with `archiveSource`                            |
| `src/lib/archive/extract.ts`                           | `extractArchiveEntry` — temp write + rename; immutability assert                         |
| `src/lib/archive/types.ts`                             | Error codes, limits, manifest entry model                                                |
| `src/lib/directory-listing.ts`                         | `listDirectoryForRequestPath`, `volumeStatsSourcePath`, `virtualMutationRejectIfPresent` |
| `src/lib/archive/archive.test.ts`                      | 18 domain tests                                                                          |
| `src/app/api/files/archive-listing.route.test.ts`      | 5 GET branch tests                                                                       |
| `src/app/api/files/archive-extract-post.route.test.ts` | 10 POST extract + mutation-guard tests                                                   |
| `src/app/files/page.archive-bootstrap.test.tsx`        | SSR virtual locator bootstrap                                                            |


**Remaining gaps (post–Tranche 4):**

- `[IMPL-FILE_PREVIEW]` archive branch still returns stub `{ message: not yet implemented }`
- No **read-only archive source** flag or navigation hooks in `WorkspaceView` / `FilePane` (open archive, archive parent, Enter on archive rows)
- `navigateToParent` uses naive `split("/")` — breaks **Virtual archive path** locators (Tranche 5 must implement `[ARCHIVE_PARENT_NAVIGATION]`)
- Client bundle cannot import `src/lib/archive/**` parsers — Tranche 5 needs **client-safe locator codec** (`archive-path-client.ts` or equivalent) for `OPEN_ARCHIVE_IN_PANE`
- **Linked navigation** assumes filesystem path prefixes — must skip or degrade when pane path is virtual
- Mesh restore via `buildWorkspaceRestoreBundle` does not yet degrade on missing archive / listing failure (Tranche 5)
- Integrated adversarial inquiry **verification** pass pending close-out (structural `phase-pre_implementation` complete)

### A.4 Desired behavior

```mermaid
flowchart TD
  open[User opens archive file in pane]
  encode[Encode virtual locator @archive/v1/...]
  list[GET /api/files?path=locator]
  project[Archive adapter projects entries to FileStat[]]
  ui[FilePane read-only listing]
  extract[User Extract to ordinary folder]
  post[POST extract-archive-entry]
  write[Write bytes + best-effort mode/mtime]
  immutable[Archive file unchanged]

  open --> encode --> list --> project --> ui
  ui --> extract --> post --> write --> immutable
```



1. User opens a supported archive (Enter/double-click on archive file in ordinary pane).
2. Workspace sets pane path to virtual locator pointing at archive root (`e: ""`).
3. Server decodes locator, validates archive file exists, reads manifest, returns sorted `FileStat[]` with archive metadata.
4. User navigates into archive subdirectories by descending entry paths (still virtual locators).
5. **Parent** from archive root returns pane to containing directory of the archive file (ordinary path).
6. User selects a file entry and **Extract…** to an ordinary destination; server writes file bytes; archive file hash/mtime unchanged.
7. Mutating actions (delete, rename, move, touch, execute, mkdir) are unavailable for archive-backed sources.
8. Comparison index treats archive entry basenames like ordinary files when names match across panes.

### A.5 Hydration paths (must all support virtual locators)


| Path                                        | Before Tranche 3                  | After Tranche 4 (observed)                              | Tranche 5+ target                      |
| ------------------------------------------- | --------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Default SSR startup (`page.tsx`)            | `listDirectory` only              | `listDirectoryForRequestPath` + `volumeStatsSourcePath` | Listing error state in pane            |
| Mesh server restore                         | `listDirectory` per snapshot path | Same bridge on server (`page.tsx`)                      | Degrade + warning on missing archive   |
| Client navigation (`fetchDirectoryListing`) | Ordinary paths only               | Virtual locators via GET; `archiveSource` preserved     | Open/descend/parent in `WorkspaceView` |
| Pane URL deep link (`pane0=…`)              | Ordinary absolute paths           | Virtual locators accepted at SSR                        | Client re-nav parity                   |
| Mesh client rehydrate                       | `listDirectoryViaFilesApi`        | GET virtual branch at API level                         | Restore degrade in mesh client path    |
| Post-extract refresh                        | `handleNavigate` on dest pane     | POST extract API ready; UI Extract pending (Tranche 6)  | Dest pane refresh after Extract        |


### A.6 Module tranches and dependency order


| Order | Tranche         | Module                                     | Exit evidence                                                                                                            |
| ----- | --------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 0     | Planning + TIED | REQ/ARCH/IMPL + pseudo-code + vocab RECORD | `pre_implementation` gate; pseudo-code catalog                                                                           |
| 1     | Archive domain  | A — `src/lib/archive/**`                   | Format detect, manifest, projection, safety limits                                                                       |
| 2     | Extraction      | B — extract API in archive module          | Fixture extract, immutability, attribute best-effort                                                                     |
| 3     | Listing/API     | C — GET branch + types                     | Route tests; ordinary listing regression                                                                                 |
| 4     | Extract POST    | D — POST `extract-archive-entry`           | Extract + rejected mutations                                                                                             |
| 5     | Pane state/nav  | E — WorkspaceView composition              | Open, descend, parent, read-only, mesh degrade                                                                           |
| 6     | Presentation    | F — FilePane/ContextMenu                   | Affordances, disabled actions, a11y                                                                                      |
| 7     | Preview share   | G — preview route reader                   | Preview returns top-level entries via shared reader; malformed/unsupported archives use the same sanitized error mapping |
| 8     | Close-out       | Verification + CITDP persist               | Gates, consistency, vocabulary validate                                                                                  |


**Session budget:** One module tranche per session; validate each module before integrating downstream.

### A.7 Adversarial inquiry depth


| Field                          | Refine-plan (planning)                    | After Tranche 4 (current)                                                                | Before Tranche 5 RED                            |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `depth_tier`                   | `minimal`                                 | `integrated` (`prior_depth_tier: minimal`)                                               | `integrated` (unchanged)                        |
| `gate_policy`                  | `advisory`                                | `advisory`                                                                               | `advisory`                                      |
| `assurance_profile`            | `baseline-functional`                     | `baseline-functional` + `external-input-security`                                        | unchanged                                       |
| `eligibility_triggers_matched` | `[]`                                      | `external-input`                                                                         | unchanged                                       |
| `integrated_waiver`            | omitted                                   | omitted                                                                                  | omitted                                         |
| `sub-adversarial-inquiry-pass` | `not_applicable` at minimal planning gate | **completed** at `phase-pre_implementation` (run `archive-tranche2-structural-20260901`) | Re-run at `phase-verification` before close-out |


**Process note:** Tranches 3–4 (GET listing + POST extract) completed under integrated `pre_implementation` gate without depth upgrade. Tranche 5 composition RED may proceed; verification gate requires a matching `phase-verification` inquiry pass.

**MCP note:** `tied_adversarial_inquiry_run` Mode B accepts Ruby/Go test paths only; TypeScript projects use graph+fidelity Mode A via `runChecklistInquiry` (same four bounded artifacts).

### A.8 Vocabulary RECORD (at `sub-vocabulary-sync`)

Add `[tied/vocab/archive-pane.md](../tied/vocab/archive-pane.md)` (**RECORD complete**) and cross-links from `workspace-pane.md`:


| Preferred term               | Definition                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **Archive-backed pane**      | Pane whose `path` is a virtual archive locator; listing shows archive entries |
| **Virtual archive path**     | Canonical `@archive/v1/…` locator encoding archive file + optional entry path |
| **Archive file path**        | Ordinary absolute path to the `.zip`/`.tar.gz` file on the host filesystem    |
| **Archive entry**            | One node in the archive manifest (file or directory)                          |
| **Archive entry path**       | Normalized relative path within the archive using `/` separators              |
| **Archive root**             | Virtual view when entry path is empty — top-level archive listing             |
| **Read-only archive source** | Archive file and all virtual locators derived from it — no mutating ops       |
| **Extraction**               | Copy-out of one archive file entry to an ordinary filesystem destination      |
| **Archive format registry**  | Server map of extension/MIME → adapter with explicit capability flags         |


Do not use **Archived mesh** ([mesh-platform.md](../tied/vocab/mesh-platform.md)) interchangeably with archive-backed panes.

---

## B. Plan — CITDP

Draft: `working/REQ-ARCHIVE_DIRECTORY_PANES/citdp-draft.yaml`. Persist to `tied/citdp/CITDP-ARCHIVE_DIRECTORY_PANES.yaml` after implementation.

### B.1 Change definition


| Field                  | Value                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Current**            | Server stack complete through Tranche 4: domain module (18 tests), `directory-listing.ts` bridge, GET virtual listing, POST `extract-archive-entry`, mutation guards (`VIRTUAL_PATH_MUTATION_REJECTED`), SSR/client fetch with `archiveSource`. **Pending:** `WorkspaceView` open/descend/parent, read-only flags, mesh degrade, FilePane/ContextMenu affordances, preview stub replacement. |
| **Desired**            | Supported archives open as read-only virtual directories; entries list/navigate/compare; file entries extract to ordinary folders; shared manifest reader for preview                                                                                                                                                                                                                        |
| **Non-goals**          | See § A.1 out of scope                                                                                                                                                                                                                                                                                                                                                                       |
| **Success criteria**   | See § 15 acceptance checklist                                                                                                                                                                                                                                                                                                                                                                |
| **Unchanged behavior** | Ordinary listing/ops; mesh snapshot field set; comparison algorithms; volume stats for ordinary panes                                                                                                                                                                                                                                                                                        |


### B.2 Impact analysis

**Modules / boundaries:** `src/lib/archive/`**; `src/lib/files.types.ts`; `src/lib/files.data.ts`; `src/app/api/files/route.ts`; `src/lib/pane-display-filter.ts`; `src/app/files/page.tsx`; `src/lib/workspace-mesh-bridge.ts`; `WorkspaceView.tsx`; `FilePane.tsx`; `ContextMenu.tsx`; `src/app/api/files/preview/route.ts`; `tied/vocab/archive-pane.md`; project TIED YAML.

**TIED tokens affected (existing):** `[REQ-FILE_LISTING]`, `[REQ-DIRECTORY_NAVIGATION]`, `[REQ-FILE_OPERATIONS]`, `[REQ-COPY_OPERATIONS]`, `[REQ-BULK_FILE_OPS]`, `[REQ-CROSS_PANE_COMPARISON]`, `[REQ-FILE_PREVIEW]`, `[REQ-WORKSPACE_MESH_BRIDGE]`, `[REQ-PANE_VOLUME_CAPACITY]`, `[ARCH-FILESYSTEM_ABSTRACTION]`, `[ARCH-SERVER_CLIENT_BOUNDARY]`, `[ARCH-FILE_OPERATIONS_API]`, `[ARCH-COMPARISON_INDEX]`, `[ARCH-PREVIEW_SYSTEM]`, `[IMPL-FILES_DATA]`, `[IMPL-FILES_API]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-FILE_PANE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[IMPL-COMPARISON_INDEX]`, `[IMPL-FILE_PREVIEW]`, `[IMPL-PANE_VOLUME_CAPACITY]`

**TIED tokens new:** `[REQ-ARCHIVE_DIRECTORY_PANES]`, `[ARCH-ARCHIVE_DIRECTORY_PANES]`, `[IMPL-ARCHIVE_DIRECTORY_PANES]`

**Pseudo-code blocks (new / changed):**


| Block                               | IMPL                         | Action                                    |
| ----------------------------------- | ---------------------------- | ----------------------------------------- |
| `ENCODE_VIRTUAL_ARCHIVE_PATH`       | IMPL-ARCHIVE_DIRECTORY_PANES | **New** — ordinary paths ↔ locator        |
| `DECODE_VIRTUAL_ARCHIVE_PATH`       | IMPL-ARCHIVE_DIRECTORY_PANES | **New** — validate prefix + payload       |
| `DETECT_ARCHIVE_FORMAT`             | IMPL-ARCHIVE_DIRECTORY_PANES | **New** — registry lookup                 |
| `READ_ARCHIVE_MANIFEST`             | IMPL-ARCHIVE_DIRECTORY_PANES | **New** — bounded manifest read           |
| `PROJECT_ARCHIVE_DIRECTORY`         | IMPL-ARCHIVE_DIRECTORY_PANES | **New** — manifest → `FileStat[]`         |
| `EXTRACT_ARCHIVE_ENTRY`             | IMPL-ARCHIVE_DIRECTORY_PANES | **Done** — domain + POST wire             |
| `GET_LIST_DIRECTORY_ARCHIVE_BRANCH` | IMPL-FILES_API               | **Done** — `directory-listing.ts` + route |
| `POST_EXTRACT_ARCHIVE_ENTRY`        | IMPL-FILES_API               | **Done** — route + mutation guards        |
| `NORMALIZE_ARCHIVE_LISTING`         | IMPL-PANE_DISPLAY_FILTER     | **Done** — passthrough + test             |
| `OPEN_ARCHIVE_IN_PANE`              | IMPL-WORKSPACE_VIEW          | **New** — navigation + read-only flag     |
| `ARCHIVE_PARENT_NAVIGATION`         | IMPL-WORKSPACE_VIEW          | **New** — root → parent dir               |
| `MESH_RESTORE_ARCHIVE_PATH`         | IMPL-WORKSPACE_MESH_BRIDGE   | **Change** — virtual path listing         |
| `RENDER_ARCHIVE_READ_ONLY`          | IMPL-FILE_PANE               | **New** — chrome + action gating          |
| `PREVIEW_ARCHIVE_MANIFEST`          | IMPL-FILE_PREVIEW            | **Change** — shared reader                |


### B.3 Architecture — virtual path contract

#### B.3.1 Locator encoding

**Prefix:** `@archive/v1/`  
**Payload:** `base64url(JSON.stringify({ a: archiveAbsPath, e: entryPath }))`

- `a` — absolute host path to archive file; must pass existing path validation (no `..`).
- `e` — normalized relative entry path within archive (`""` = archive root). Uses `/` only internally.
- `FileStat.path` for archive rows — virtual locator pointing at that entry (re-navigation).
- `FileStat.name` — entry basename for display/sort/comparison.

**Decode failures:** Return `400` with `{ errorCode: "INVALID_ARCHIVE_LOCATOR" }` — no raw payload in client message.

#### B.3.2 Extended FileStat metadata

```text
ArchiveSourceMeta:
  archivePath: string          # host archive file (absolute)
  entryPath: string            # relative path within archive
  isArchiveRoot: boolean
  isVirtual: true
  format: string               # e.g. zip, tar, tar.gz
  readOnly: true

FileStat (extended):
  ...existing fields...
  archiveSource?: ArchiveSourceMeta   # present when row is archive-backed
```

Ordinary rows omit `archiveSource`. Sort/filter/comparison continue to use `name`, `size`, `mtime`, `isDirectory`.

#### B.3.3 Format registry (v1)


| Format key | Extensions          | Library               | List | Extract file | Notes                                                                         |
| ---------- | ------------------- | --------------------- | ---- | ------------ | ----------------------------------------------------------------------------- |
| `zip`      | `.zip`              | `yauzl`               | yes  | yes          | Streaming central directory                                                   |
| `tar`      | `.tar`              | `tar-stream`          | yes  | yes          |                                                                               |
| `tar.gz`   | `.tar.gz`, `.tgz`   | `tar-stream` + `zlib` | yes  | yes          |                                                                               |
| `tar.bz2`  | `.tar.bz2`, `.tbz2` | —                     | stub | stub         | Return `FORMAT_UNSUPPORTED` in v1; evaluate a dependency in a follow-on slice |
| `7z`       | `.7z`               | —                     | stub | stub         | `FORMAT_UNSUPPORTED`                                                          |
| `rar`      | `.rar`              | —                     | stub | stub         | `FORMAT_UNSUPPORTED`                                                          |


Registry is explicit in code and documented in IMPL; tests assert stub behavior for deferred keys.

#### B.3.4 Safety limits (v1 defaults — tune in IMPL)


| Limit                              | Default                                                  | On exceed            |
| ---------------------------------- | -------------------------------------------------------- | -------------------- |
| Max manifest entries               | 50_000                                                   | `MANIFEST_TOO_LARGE` |
| Max single entry uncompressed size | 512 MiB                                                  | `ENTRY_TOO_LARGE`    |
| Max total manifest read bytes      | 64 MiB                                                   | `MANIFEST_TOO_LARGE` |
| Max path component length          | 255                                                      | reject entry         |
| Entry path validation              | Reject `..`, absolute paths, Windows drive prefixes, NUL | `UNSAFE_ENTRY_PATH`  |


Errors map to stable `errorCode` values; log details server-side only. Domain layer also exposes `UNSUPPORTED_ENTRY_TYPE`, `ENTRY_NOT_FOUND` for extraction guards.

#### B.3.5 POST extract contract

```text
POST /api/files
{
  operation: "extract-archive-entry",
  archivePath: string,      # absolute host path to archive file
  entryPath: string,        # relative file entry (not directory)
  dest: string              # ordinary absolute destination, using the existing copy file/parent-dir convention
}
```

**PRE:** `archivePath` and `dest` are ordinary validated paths; `entryPath` is a safe relative file; directory and symlink entries are rejected; the archive is opened read-only.  
**POST:** Extracted bytes are written according to the existing copy destination convention; `{ success: true }` or `OperationResult` reports the outcome; failure does not leave a truncated destination.  
**Reject:** `copy`/`move`/etc. when `src` or `dest` is virtual locator (`VIRTUAL_PATH_MUTATION_REJECTED`); archive entry copy-out uses `extract-archive-entry` only.

#### B.3.6 Client-safe locator codec (Tranche 5 prerequisite)

`WorkspaceView` is a client component and must **not** import `src/lib/archive/`** (Node parsers, `Buffer`-coupled server module). Tranche 5 introduces a **client-safe codec** (recommended: `src/lib/archive-path-client.ts`) mirroring `@archive/v1/` encode/decode/isVirtual checks using browser-safe base64url only. Server module remains authoritative for validation at GET/POST boundaries.

#### B.3.7 Linked navigation with virtual paths

`[IMPL-LINKED_NAV]` downward/upward sync assumes ordinary filesystem prefixes (`oldPath + '/' + relative`). When either pane path is a **Virtual archive path**, linked sync must **skip** (log at debug) rather than construct invalid hybrid paths. Archive-backed panes remain independently navigable.

### B.4 Risk analysis


| ID       | Risk                                            | Severity | Mitigation                                                                       |
| -------- | ----------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| RISK-001 | Zip bomb / decompression bomb                   | high     | Entry size limits; stream with byte counter; abort over limit                    |
| RISK-002 | Path traversal via entry names                  | high     | Normalize/reject `..`, absolute paths, drive prefixes                            |
| RISK-003 | Symlink escape on extract                       | high     | Reject symlink entries for extraction; list only                                 |
| RISK-004 | Parser differential / malformed archive crash   | medium   | Fuzz fixtures; catch adapter errors → sanitized 400/500                          |
| RISK-005 | Virtual path injection confusing ordinary paths | medium   | Strict prefix + base64url schema; reject decode ambiguity                        |
| RISK-006 | Mesh restore broken archive path                | medium   | Degrade with `workspace-restore-warning`; empty listing                          |
| RISK-007 | Comparison basename collision inside archive    | low      | Document: comparison uses basename; duplicate names within pane are pre-deduped  |
| RISK-008 | Volume stats mislead for archive contents       | low      | Stats from archive host path; footer unchanged semantics                         |
| RISK-009 | Preview/pane parser drift                       | medium   | Single shared manifest module                                                    |
| RISK-010 | Partial extract leaves dirty dest               | medium   | Write to temp + rename or truncate-on-failure cleanup per existing copy patterns |


**Quality profile:** `data-integrity-security` — falsification: malicious archive cannot write outside dest; archive file mtime/size unchanged after failed/successful extract; listing never executes archive code.

### B.5 Test strategy

Full matrix: `working/REQ-ARCHIVE_DIRECTORY_PANES/test-strategy-outline.md`.

**E2E policy:** `not_applicable` unless component tests cannot prove keyboard/context-menu extract affordances — justify in tracker if added.

**Adversarial inquiry:** Structural `phase-pre_implementation` pass complete (integrated depth); verification pass required before close-out.

**Gate payload note:** `tied_checklist_gate_validate` expects the **inner CITDP record** (fields under `change_definition`, `risk_analysis`, etc.) — not the `CITDP-ARCHIVE_DIRECTORY_PANES` wrapper key used in the draft YAML file.

---

## C. Implement — technical specification

### C.1 Prioritized work (tranches)

#### Tranche 0 — Documentation and CITDP

- [x] Control plan (this document)
- [x] CITDP draft + checklist tracker + test strategy outline
- [x] `pre_implementation` gate (refine-plan + build-plan kickoff)
- [x] Author REQ/ARCH/IMPL via TIED MCP
- [x] IMPL pseudo-code + `gate-pseudocode-validation`
- [x] Vocabulary RECORD in `archive-pane.md`
- [x] Structural `sub-adversarial-inquiry-pass` (`phase-pre_implementation`, integrated)

#### Tranche 1 — Archive domain module (TDD)

- [x] RED/GREEN: format detection, manifest normalization, projection, safe paths, duplicates, limits, unsupported formats — `src/lib/archive/archive.test.ts` (12 tests)
- [x] Locator encode/decode unit tests

#### Tranche 2 — Extraction module (TDD)

- [x] RED/GREEN: fixture extract, directory rejection, symlink rejection, mode/mtime best-effort, archive immutability, failure cleanup

#### Tranche 3 — Listing/API (TDD)

- [x] RED/GREEN: GET virtual vs ordinary paths; malformed locator; unsupported format; enriched response shape unchanged for ordinary dirs

#### Tranche 4 — Extract POST (TDD)

- [x] RED/GREEN: extract success; reject copy/move/delete with virtual src; overwrite behavior

#### Tranche 5 — Pane/navigation state (TDD)

- [x] RED/GREEN: open, descend, parent, read-only flags, refresh, mesh restore degradation, comparison participation

#### Tranche 6 — Presentation (TDD)

- [x] RED/GREEN: FilePane/ContextMenu affordances, disabled destructive actions, Extract enabled, a11y labels

#### Tranche 7 — Preview share (TDD)

- [x] RED/GREEN: preview route uses shared reader; stub removed

#### Close-out

- [x] Full scoped Vitest + `bunx tsc -b` + `validate:vocabulary`
- [x] `pseudocode_validate` + `tied_validate_consistency`
- [x] Persist `tied/citdp/CITDP-ARCHIVE_DIRECTORY_PANES.yaml`
- [x] Verification gate + integrated adversarial inquiry artifacts (`phase-verification`)
- [ ] `traceable-commit` (user action; close_out gate pending)

### C.2 Data contract summary

See § B.3 for locator, `ArchiveSourceMeta`, registry, limits, and POST extract body.

**Volume stats for archive panes:** Call `getVolumeStats(decoded.archivePath)`; if archive missing, listing fails before stats matter; stats failure still non-fatal per `[REQ-PANE_VOLUME_CAPACITY]`. The archive host file is the only volume subject represented; entry sizes do not alter capacity values.

**Immutability invariant:** After any extract attempt, host archive file size and mtime (and optional hash fixture assert) unchanged.

### C.3 UI/UX

- **Open archive:** Enter/double-click on archive file row in ordinary pane → navigate pane to archive root locator.
- **Archive affordance:** Pane header or status segment indicates read-only archive (e.g. `Archive: filename.zip`).
- **Parent navigation:** From archive root, parent goes to `dirname(archivePath)` ordinary listing.
- **Context menu:** Extract enabled for file entries; delete/rename/move/touch/execute/mkdir disabled; **Set as Base directory** disabled for virtual paths.
- **Drag/drop:** Disable move-into/out-of archive sources; extract uses explicit action only in v1.
- **Empty archive directory:** Show empty listing with read-only chrome (footer visibility follows `[REQ-PANE_VOLUME_CAPACITY]` predicate).
- **Test IDs:** `pane-archive-readonly`, `archive-extract-menu-item`, `archive-locator-invalid-warning`

### C.4 IMPL pseudo-code blocks (catalog)

Sidecar: `tied/implementation-decisions/IMPL-ARCHIVE_DIRECTORY_PANES-pseudocode.md`

Each active procedure block: token comments naming REQ/ARCH/IMPL; `INPUT`, `OUTPUT`, `PRE`, `POST`, `EFFECTS`, `FAILURE_MODES`, `DATA_TRANSITION`, `TERMINATION` as applicable.

### C.5 Tranche 5 — Pane/navigation state (next build-plan target)

**Goal:** Wire archive UX into `WorkspaceView` composition; mesh restore degradation; comparison index participation unchanged (basename key).

**New / changed surfaces:**


| Surface                                        | Change                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/lib/archive-path-client.ts` (recommended) | Client-safe `isVirtualArchivePath`, `encodeVirtualArchivePath`, `decodeVirtualArchivePath` — no parser imports   |
| `WorkspaceView.tsx`                            | `[OPEN_ARCHIVE_IN_PANE]`, `[ARCHIVE_PARENT_NAVIGATION]`, read-only derivation, linked-nav skip for virtual paths |
| `workspace-mesh-bridge.ts`                     | `[MESH_RESTORE_ARCHIVE_PATH]` — try/catch per pane; missing archive → empty listing + warning fragment           |
| `WorkspaceView.archive.test.tsx` (new)         | Composition tests per test-strategy Module E                                                                     |


**Behavior contract:**

1. **Open archive (ordinary pane):** When user activates a host **archive file** row (Enter on file, or double-click if wired), detect via theme `fileTypes` archive match or extension heuristic (`.zip`, `.tar`, `.tar.gz`, `.tgz` — not nested `.zip` inside archive pane). Call `encodeVirtualArchivePath(file.path, "")` then `handleNavigate(paneIndex, locator)`. Do **not** open nested `.zip` entries inside an archive-backed pane (opaque file per v1).
2. **Descend (archive pane):** When pane path is virtual and user Enter/double-clicks a **directory** row, `handleNavigate(paneIndex, file.path)` — row paths are already virtual locators from GET listing.
3. **Parent (archive pane):** Replace naive `navigateToParent` split logic when `isVirtualArchivePath(pane.path)`:
  - Decode locator; if `entryPath` non-empty → parent entry directory encoded as new locator.
  - If at archive root (`entryPath === ""`) → `handleNavigate(paneIndex, dirname(archivePath))` ordinary path.
4. **Read-only flag:** Derive `isArchiveReadOnly := isVirtualArchivePath(pane.path)` (or equivalent helper); pass to `FilePane` for Tranche 6 chrome (Tranche 5 sets state/props only if needed for tests).
5. **Mesh restore degrade:** In `buildWorkspaceRestoreBundle` or caller wrapper, catch listing failures for virtual paths; push empty `files`, append `restoreWarning` with archive basename; do not throw.
6. **Comparison:** No index change — archive rows already expose `name`/`size`/`mtime`; ensure `handleNavigate` refresh preserves rows for cross-pane basename match tests.
7. **Listing errors:** When `fetchDirectoryListing` returns non-OK for virtual path, set pane error/warning state (reuse existing error patterns if present; else minimal empty listing + toast/warning string).

**RED test inventory (`WorkspaceView.archive.test.tsx`):**

- Open host `.zip` → pane path starts with `@archive/v1/`; listing fetch called with locator
- Enter on archive directory row → navigate to nested virtual locator
- Parent at archive root → ordinary parent directory of archive file
- Parent inside archive → virtual locator with shortened entry path
- `navigate.parent` keybind uses archive-aware parent (not `split("/")` on locator)
- Mesh restore with valid virtual path in snapshot → listing loads
- Mesh restore with missing archive path → warning + empty files, no throw
- Linked mode: opening archive in one pane does not corrupt linked pane paths
- Comparison index includes archive entry basename alongside ordinary pane (smoke)

**Tranche 6 handoff:** `FilePane` / `ContextMenu` consume `isArchiveReadOnly` + `archiveSource` on selected row for Extract label, disabled mutators, `data-testid` hooks — no presentation work in Tranche 5 beyond props needed for composition tests.

---

## 15. Acceptance checklist

### Product behavior

- [x] Operator can open a supported archive as a directory in a pane and browse root/subdirectories
- [x] Archive entries participate in cross-pane comparison where basenames match
- [x] Archive pane is enforceably read-only at API — mutating ops reject virtual locators; extract uses dedicated POST *(UI gating Tranche 6)*
- [x] Selected archive **file** entry extracts via POST with best-effort mode/mtime; archive unchanged *(domain + route tested; UI Extract Tranche 6)*
- [x] Unsupported, malformed, unsafe, or oversized archives fail safely without raw parser errors *(domain + GET/POST routes)*
- [x] Missing archive on mesh restore shows warning and recoverable empty/degraded pane
- [x] Preview archive type shows top-level entries via shared reader (stub removed)
- [x] Ordinary listing, copy/move/delete, filters, comparison, refresh, and mesh behavior regression-covered

### Engineering

- [x] Archive domain module has no client import path (server-only `src/lib/archive/**`)
- [x] Virtual locator round-trips through API, pane state, mesh snapshot, and URL deep links
- [x] Archive domain + API layers independently tested; pane state and presentation covered
- [x] Safety limits enforced with stable error codes in domain layer (`MANIFEST_TOO_LARGE`, `ENTRY_TOO_LARGE`, `UNSAFE_ENTRY_PATH`, `FORMAT_UNSUPPORTED`, `UNSUPPORTED_ENTRY_TYPE`, `ENTRY_NOT_FOUND`)
- [x] Domain extraction tested independently (Tranche 2); immutability, symlink/dir rejection, byte limits
- [x] E2E coverage not added — component/composition tests cover affordances (policy: not_applicable)

### TIED

- [x] `[REQ-ARCHIVE_DIRECTORY_PANES]`, `[ARCH-ARCHIVE_DIRECTORY_PANES]`, `[IMPL-ARCHIVE_DIRECTORY_PANES]` registered via TIED tool surface
- [x] Indexes cross-referenced; pseudo-code complete with block token comments
- [x] Pseudo-code validation passes before RED tests (Tranche 1)
- [x] Vocabulary recorded in `archive-pane.md` + `workspace-pane.md` cross-links
- [x] Changed YAML passes `tied_validate_consistency`
- [x] Structural integrated inquiry artifacts at `phase-pre_implementation`
- [x] Verification-phase integrated inquiry artifacts for close-out gates

---

## Residual risks (post-v1)

- 7z/RAR demand may require native binaries — deferred adapters remain explicit unsupported until evaluated.
- Tar.bz2 and exotic compression may need additional native deps.
- Very large archives may be slow to list even within entry caps — no progressive/paged manifest in v1.
- Basename-level comparison may confuse distinct same-named entries across different archive internal paths when comparing within one pane (mitigated by duplicate dedupe policy).
- Extract-to-open-file-locked destinations remains subject to ordinary filesystem error behavior.

---

## Gate evidence


| Phase                                                   | Receipt                                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pre_implementation` (refine-plan)                      | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T21-04-29-141Z.json` (`allowed: true`, depth `minimal`)    |
| `pre_implementation` (build-plan Tranche 0 kickoff)     | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T21-09-53-391Z.json` (`allowed: true`, depth `minimal`)    |
| `pre_implementation` (refine-plan sync)                 | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T21-14-58-782Z.json` (`allowed: true`, depth `minimal`)    |
| Tranche 1 executable                                    | `src/lib/archive/archive.test.ts` — 12 passed (observed 2026-09-01)                                                          |
| Tranche 2 executable                                    | `src/lib/archive/archive.test.ts` — 18 passed; `bunx tsc -b` passed (observed 2026-09-01)                                    |
| `pre_implementation` (Tranche 2 integrated)             | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T21-19-55-770Z.json` (`allowed: true`, depth `integrated`) |
| Tranche 3 executable                                    | `src/app/api/files/archive-listing.route.test.ts` — 5 passed; `bunx tsc -b` passed (observed 2026-09-01)                     |
| Tranche 4 executable                                    | `src/app/api/files/archive-extract-post.route.test.ts` — 10 passed (observed 2026-09-01)                                     |
| `pre_implementation` (Tranche 4 build-plan)             | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T21-26-30-083Z.json` (`allowed: true`, depth `integrated`) |
| `pre_implementation` (refine-plan sync, post–Tranche 4) | `working/REQ-ARCHIVE_DIRECTORY_PANES/pre_implementation-2026-09-01T22-26-08-870Z.json` (`allowed: true`, depth `integrated`) |
| `verification` (plan-close-out) | `working/REQ-ARCHIVE_DIRECTORY_PANES/verification-2026-09-01T22-49-14-317Z.json` (`allowed: true`, depth `integrated`, run `archive-close-out-verification-20260901`) |
| Close-out executable | 195 scoped Vitest tests; `bunx tsc -b`; `validate:vocabulary`; `pseudocode_validate`; `tied_validate_consistency`; `tied_verify` updated REQ/IMPL status |
| `close_out` (plan-close-out) | Blocked on `pending_required_step:traceable-commit` until user commit (expected) |


