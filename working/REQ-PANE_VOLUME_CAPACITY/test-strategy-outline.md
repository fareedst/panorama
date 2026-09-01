# Test strategy outline — Per-Pane Volume Capacity Display

**Request:** `REQ-PANE_VOLUME_CAPACITY`  
**Primary REQ anchors:** `[REQ-PANE_VOLUME_CAPACITY]`, `[REQ-FILE_LISTING]`, `[REQ-MULTI_PANE_LAYOUT]`, `[REQ-DIRECTORY_NAVIGATION]`, `[REQ-FILE_MANAGER_PAGE]`  
**CITDP (draft):** `working/REQ-PANE_VOLUME_CAPACITY/citdp-draft.yaml`  
**Status:** Refined after Tranche 2 (API enrichment + mesh bridge migration); Tranches 3–5 pending

## Proof boundaries (non-negotiable)

| Evidence source | Proves | Does not prove |
|---|---|---|
| Provider unit tests (`src/lib/volume-stats.test.ts`) | Block→byte math, `bavail`, clamping, status variants | Real statfs on every mount type |
| API route contract tests | Enriched response always object-shaped; listing success on capacity failure; path validation order | Browser layout at every viewport |
| Client normalization tests | Unified response handling; malformed → unavailable | Server statfs behavior |
| Workspace composition tests | Per-pane state updates; navigation isolation; mount backfill; stale-request guard | Playwright visual regression |
| FilePane component tests | Footer states, aria-label, test IDs, empty-directory footer | Host-specific mount free space |
| SSR bootstrap tests (if added) | Initial pane payload includes stats when provider succeeds | Full Next.js RSC integration without mocks |
| `pseudocode_validate` | Layer B contracts on touched IMPL blocks | Runtime performance on network mounts |
| `tied_validate_consistency` | Token/index/detail integrity | Product behavior |
| Scoped Vitest + `bunx tsc -b` | Executable regression of touched paths | Untouched modules |

## Module tranche matrix

| Tranche | Module | RED focus | Pass criterion |
|---|---|---|---|
| 0 | TIED + pseudo-code | N/A (planning) | `pre_implementation` gate allowed; pseudo-code blocks cataloged |
| 1 | A — `volume-stats.ts` | statfs mock matrix | Provider tests green; no client import path |
| 2 | B — Listing API + GET migration | Always `{ files, volumeStats }`; listing on capacity fail; migrate `listDirectoryViaFilesApi` | Route + mesh-bridge tests green |
| 3 | C — Client normalization | Unified object; remove array branch | Normalization unit tests green |
| 4 | D — Pane state + hydration | Initial/nav/refresh/mount backfill/stale guard | Workspace composition tests green |
| 5 | E — Pane capacity presentation | Footer states, empty dir, a11y | FilePane component tests green |

**E2E:** `not_applicable` unless component tests cannot prove responsive truncation or browser a11y semantics — justify in tracker if added.

## TDD sequence (per tranche)

1. Update IMPL pseudo-code + token comments for tranche blocks  
2. `gate-pseudocode-validation`  
3. `unit-test-red` → `unit-test-green` (or composition for Modules D/E)  
4. `three-way-alignment-unit`  
5. `verification-gate` with scoped commands  
6. `sync-tied-stack` + vocabulary RECORD  
7. LEAP if code diverges from pseudo-code  

## RED case inventory

### Module A — Provider (`volume-stats.test.ts`)

- Valid statfs → `status: available` with correct bytes and percent  
- `bavail` used over raw free blocks when both exist  
- Zero total blocks → `unavailable` (not fabricated zeros)  
- Available > total → clamp or `unavailable` per contract  
- statfs rejection / missing API → `unavailable` or `unsupported`  
- Permission error → `unavailable`  
- Large counters within documented safe `number` range  

### Module B — API route + GET migration

- Valid path without `displaySpecId` → `{ files, volumeStats }` (not bare array)  
- Valid path with `displaySpecId` → `{ files, hiddenCount, totalCount, volumeStats }`  
- Capacity provider throws → listing still 200 with `unavailable` stats  
- Rejected traversal path → no statfs call  
- `listDirectoryViaFilesApi` extracts `body.files` from enriched response  
- Remaining direct `WorkspaceView.tsx` GET consumers migrate before all array assumptions are removed

### Module C — Normalization (`pane-display-filter.test.ts`)

- Enriched object → internal `DirectoryListingResponse` with `volumeStats`  
- Malformed numeric fields → `unavailable`, no throw  
- Missing `volumeStats` → explicit unavailable default  

### Module D — WorkspaceView

- Initial pane receives stats from listing or SSR props  
- Navigate pane 0 does not mutate pane 1 stats  
- Refresh replaces stats  
- Mount backfill fetches stats when `volumeStats === null`  
- Stale async response cannot overwrite newer navigation (if applicable)  

### Module E — FilePane

- Available: compact + full `aria-label`  
- Unavailable / unsupported: no zero placeholders  
- Empty directory still shows capacity when footer renders  
- Footer visibility includes capacity segment (RISK-005)  
- Existing cursor/sort/mark footer segments unchanged  
- `data-testid="pane-volume-stats"` / `pane-volume-stats-unavailable`  

## Proof commands (verification gate — populate per tranche)

```bash
# Tranche 1
bun run vitest run src/lib/volume-stats.test.ts
bunx tsc -b

# Tranche 2
bun run vitest run src/app/api/files/display-filter.route.test.ts src/lib/workspace-mesh-bridge.test.ts
bunx tsc -b

# Tranche 3
bun run vitest run src/lib/pane-display-filter.test.ts
bunx tsc -b

# Tranche 4
bun run vitest run src/app/files/WorkspaceView.test.tsx
bunx tsc -b

# Tranche 5
bun run vitest run src/app/files/components/FilePane.test.tsx
bunx tsc -b

# Full feature close-out (target)
bun run vitest run src/lib/volume-stats.test.ts src/app/api/files/display-filter.route.test.ts src/lib/pane-display-filter.test.ts src/lib/workspace-mesh-bridge.test.ts src/app/files/WorkspaceView.test.tsx src/app/files/components/FilePane.test.tsx
bunx tsc -b
bun run validate:vocabulary
# After TIED YAML writes:
# tied_validate_consistency include_pseudocode true
# pseudocode_validate IMPL-PANE_VOLUME_CAPACITY require_contracts true
```

## Module validation (`[REQ-MODULE_VALIDATION]`)

| Module | Validate independently before integration |
|---|---|
| `volume-stats.ts` | Mock statfs; all status paths before route wire |
| Listing API enrichment | Route tests with mocked provider before client changes |
| `listDirectoryViaFilesApi` migration | Unit test before mesh rehydrate integration |
| Client normalization | Unit tests before WorkspaceView integration |
| Pane state integration | Composition tests before FilePane render |
| Pane capacity presentation | Component tests with mocked pane state |
