# Test strategy outline — Open Archives as Read-Only Panes

**Request:** `REQ-ARCHIVE_DIRECTORY_PANES`  
**Primary REQ anchors:** `[REQ-ARCHIVE_DIRECTORY_PANES]`, `[REQ-FILE_LISTING]`, `[REQ-DIRECTORY_NAVIGATION]`, `[REQ-FILE_OPERATIONS]`, `[REQ-COPY_OPERATIONS]`, `[REQ-CROSS_PANE_COMPARISON]`, `[REQ-FILE_PREVIEW]`, `[REQ-WORKSPACE_MESH_BRIDGE]`  
**CITDP (draft):** `working/REQ-ARCHIVE_DIRECTORY_PANES/citdp-draft.yaml`  
**Status:** Tranches 0–4 complete (2026-09-01); Tranches 5–7 pending

## Proof boundaries (non-negotiable)

| Evidence source | Proves | Does not prove |
|---|---|---|
| Archive domain unit tests (`src/lib/archive/**/*.test.ts`) | Locator encode/decode, format detect, manifest projection, safety limits, unsupported formats | Every real-world archive variant in the wild |
| Extraction unit tests | Byte fidelity, immutability, attribute best-effort, symlink/dir rejection, cleanup on failure | Performance on multi-GB entries within cap |
| API route contract tests | GET virtual vs ordinary; POST extract; rejected mutations; error code mapping | Browser drag/drop |
| Client normalization tests | Archive metadata on fetch; malformed locator handling | Server parser internals |
| Workspace composition tests | Open, descend, parent, read-only, mesh degrade, comparison index | Full Next.js RSC without mocks |
| FilePane/ContextMenu component tests | Read-only chrome, Extract enabled, destructive disabled, a11y | Playwright visual regression |
| Preview route tests | Shared reader top-level listing | Inline archive binary preview |
| Adversarial inquiry artifacts | Structured abuse-case review at integrated depth | Pen-test sign-off |
| `pseudocode_validate` | Layer B contracts on touched IMPL blocks | Runtime zip-bomb timing attacks |
| `tied_validate_consistency` | Token/index/detail integrity | Product behavior |
| Scoped Vitest + `bunx tsc -b` | Executable regression of touched paths | Untouched modules |

## Module tranche matrix

| Tranche | Module | RED focus | Pass criterion |
|---|---|---|---|
| 0 | TIED + pseudo-code + vocab | N/A (planning) | **Pass** — pre_implementation gate; pseudo-code validated |
| 1 | A — `src/lib/archive/**` | Locator, registry, manifest, projection, limits | **Pass** — 12 tests in `archive.test.ts`; no client import |
| 2 | B — extraction | Fixture extract, immutability, symlink reject, cleanup | **Pass** — 18 tests in `archive.test.ts`; `extract.ts` |
| 3 | C — GET listing | Virtual vs ordinary; errors; regression on enriched listing | **Pass** — `archive-listing.route.test.ts` |
| 4 | D — POST extract | extract-archive-entry; reject copy/move on virtual src | **Pass** — `archive-extract-post.route.test.ts` |
| 5 | E — WorkspaceView | Navigation, read-only, mesh restore degrade, comparison | `WorkspaceView.archive.test.tsx` green |
| 6 | F — FilePane/ContextMenu | Affordances, disabled actions, Extract | Component tests green |
| 7 | G — preview share | Shared reader replaces stub | Preview route tests green |

**E2E:** `not_applicable` unless component tests cannot prove keyboard/context-menu extract affordances — justify in tracker if added.

## TDD sequence (per tranche)

1. Update IMPL pseudo-code + token comments for tranche blocks  
2. `gate-pseudocode-validation`  
3. Run structural/pre-RED adversarial inquiry when depth is integrated  
4. `unit-test-red` → `unit-test-green` (or composition for Modules E/F)  
5. `three-way-alignment-unit`  
6. `verification-gate` with scoped commands  
7. `sync-tied-stack` + vocabulary RECORD  
8. LEAP if code diverges from pseudo-code  

## RED case inventory

### Module A — Archive domain

- Encode/decode round-trip for root and nested entry paths  
- Reject malformed prefix, invalid base64url, missing `a`, path with `..`  
- ZIP fixture lists expected entries with normalized mtimes/sizes  
- TAR.GZ fixture lists directories and files  
- Reject traversal entry names (`../outside`, absolute paths)  
- Duplicate entry names → deterministic single row + logged duplicate (assert via mock logger if needed)  
- Manifest entry count over limit → `MANIFEST_TOO_LARGE`  
- Entry size over limit → `ENTRY_TOO_LARGE`  
- `.tar.bz2`, `.7z`, and `.rar` → `FORMAT_UNSUPPORTED` without throw  
- Nested `.zip` entry listed as opaque file, not openable as archive in v1  

### Module B — Extraction

- Extract file entry to ordinary dest — bytes match golden hash  
- Archive file mtime/size unchanged before/after extract  
- Reject directory entry extract  
- Reject symlink entry extract  
- Mode/mtime applied when platform supports; extract still succeeds when attribute apply fails  
- Failed mid-write cleanup does not leave truncated dest (or reports partial per contract)  
- Oversized entry aborts without writing dest  

### Module C — GET listing API

- Ordinary path → unchanged enriched `{ files, volumeStats, … }`  
- Valid virtual locator → projected files with `archiveSource` metadata  
- Invalid locator → 400 stable error code  
- Missing archive file → 404 sanitized  
- Corrupt archive → 400/500 sanitized without raw parser stack  
- volumeStats uses archive host path for virtual locator requests  

### Module D — POST extract API

- `extract-archive-entry` success → `{ success: true }`  
- `copy` with virtual `src` → 400 rejected  
- `move`/`delete`/`rename` with archive paths → 400 rejected  
- `dest` virtual locator → 400 rejected  
- Overwrite dest behavior matches ordinary copy conventions  
- Display-spec guard still applies to dest visibility when configured  

### Module E — WorkspaceView

- Open archive file → pane path becomes virtual root locator  
- Descend into archive subdirectory updates locator `e` component  
- Parent from archive root → ordinary parent directory of archive file  
- `isArchiveReadOnly` (or equivalent) set on archive-backed panes  
- Refresh re-lists archive entries  
- Mesh restore with valid virtual path → listing loads  
- Mesh restore with missing archive → warning + degraded empty listing  
- Comparison index includes archive entry basenames vs ordinary pane  

### Module F — FilePane / ContextMenu

- Read-only badge/label visible on archive pane  
- Extract menu item enabled for file entries  
- Delete/rename/move/touch/execute/mkdir disabled  
- Drag/drop move disabled for archive sources  
- Empty archive directory shows read-only chrome  
- `data-testid` hooks present per control plan  

### Module G — Preview route

- Archive preview returns top-level manifest entries via shared reader  
- Stub message removed  
- Unsupported format returns sanitized preview error  

## Adversarial fixtures (integrated inquiry)

- Traversal names: `../../etc/passwd`, `C:\Windows\`, absolute `/etc/passwd`  
- Zip with inflated size metadata vs small payload (within test limits)  
- Archive with duplicate paths differing only by case (platform-dependent note)  
- Corrupt central directory / truncated tar  

## Proof commands (verification gate — populate per tranche)

```bash
# Tranche 1
bun run vitest run src/lib/archive/
bunx tsc -b

# Tranche 2
bun run vitest run src/lib/archive/
bunx tsc -b

# Tranche 3-4 (observed 2026-09-01)
bun run vitest run src/lib/archive/ src/app/api/files/archive-listing.route.test.ts src/app/api/files/archive-extract-post.route.test.ts src/app/api/files/display-filter.route.test.ts
bunx tsc -b

# Tranche 5
bun run vitest run src/app/files/WorkspaceView.archive.test.tsx
bunx tsc -b

# Tranche 6
bun run vitest run src/app/files/components/FilePane.test.tsx src/app/files/components/ContextMenu.test.tsx
bunx tsc -b

# Tranche 7
bun run vitest run src/app/api/files/preview/route.test.ts
bunx tsc -b

# Full feature close-out (target)
bun run vitest run src/lib/archive/ src/app/api/files/ src/app/files/WorkspaceView.archive.test.tsx src/app/files/components/FilePane.test.tsx src/app/api/files/preview/route.test.ts
bunx tsc -b
bun run validate:vocabulary
# After TIED YAML writes:
# tied_validate_consistency include_pseudocode true
# pseudocode_validate IMPL-ARCHIVE_DIRECTORY_PANES require_contracts true
```

## Module validation (`[REQ-MODULE_VALIDATION]`)

| Module | Validate independently before integration |
|---|---|
| Locator + registry + manifest | Unit tests before route wire |
| Extraction | Fixture tests before POST wire |
| GET archive branch | Route tests before WorkspaceView integration | **Done** |
| POST extract | Route tests before UI Extract action | **Done** |
| Pane navigation/state | Composition tests before FilePane polish | Pending Tranche 5 |
| Presentation | Component tests with mocked archive pane state |
| Preview reader | Route tests before declaring preview slice complete |
