# Test strategy outline — NSYNC Hybrid Move Optimization

**Request:** `REQ-NSYNC_HYBRID_MOVE`  
**Primary REQ anchors:** `[REQ-NSYNC_HYBRID_MOVE]`, `[REQ-MOVE_SEMANTICS]`, `[REQ-NSYNC_MULTI_TARGET]`  
**CITDP:** `tied/citdp/CITDP-NSYNC_HYBRID_MOVE.yaml`  
**Status:** Tranches 1–2 complete; Tranche 3 next (refined 2026-09-01)

## Proof boundaries (non-negotiable)

| Evidence source | Proves | Does not prove |
|---|---|---|
| `move-plan.test.ts` | Plan ordering, single-rename invariant, volume classification mocks | Real filesystem `dev` on every mount layout |
| `engine.test.ts` | SyncEngine executes plan; deferred delete omitted when rename final | UI toolbar behavior |
| `copy-file.data.test.ts` / `files.data.test.ts` | EXDEV fallback unchanged; shared executor if extracted | NSYNC multi-dest ordering in isolation |
| `pseudocode_validate` | Layer B contracts on touched IMPL blocks | Runtime performance on large files |
| `tied_validate_consistency` | Token/index/detail integrity | Product behavior |
| Scoped Vitest + `bunx tsc -b` | Executable regression of touched paths | Untouched modules |

## Tranche test matrix

### Tranche 1 — MovePlan module (pure, no engine wire)

| Layer | Action | Command / file | Pass criterion |
|---|---|---|---|
| Spec | Author REQ/ARCH/IMPL + pseudo-code | TIED MCP + sidecar | Token comments on every block |
| Validate | Pseudo-code gate | `pseudocode_validate IMPL-NSYNC_MOVE_PLAN require_contracts true` | Exit 0 |
| RED | Plan builder tests | `src/lib/sync/move-plan.test.ts` | Fails before implementation |
| GREEN | `buildMovePlan()` | same | All § B.3.4 matrix rows; K≥2 same-volume → `count(rename) === 1` |
| Edge | Unknown `dev` | mocked stat failure | Conservative cross-volume copy legs |
| Edge | No same-volume dests | 0 same / N cross | Plan matches current copy+deferred-delete semantics |
| Sync | TIED integrity | `tied_validate_consistency include_pseudocode true` | `ok: true` |

**Fixtures:** `vi.spyOn(fs, 'stat')` or injected `statFn` returning configurable `dev` values.

### Tranche 2 — Engine integration ✅

| Layer | Action | Command / file | Pass criterion | Status |
|---|---|---|---|---|
| RED | Mixed A+A+B scenario | `src/lib/sync/engine.test.ts` | 1 cross-volume copy, 1 rename, 0 `deleteFile(source)` | **Pass** |
| RED | Partial failure before rename | same | Source path still exists | **Pass** |
| RED | All cross-volume (0 same-volume) | same | Deferred delete still runs | **Pass** |
| GREEN | `EXECUTE_MOVE_PLAN` in engine | same | Tests pass | **Pass** |
| Validate | Engine pseudo-code | `pseudocode_validate IMPL-NSYNC_ENGINE` | `MoveSemantics`, `SyncItem`, `EXECUTE_MOVE_PLAN` updated | **Pass** |
| Regression | TypeScript | `bunx tsc -b` | Exit 0 | **Pass** |
| Composition | API contract unchanged | `src/app/api/files/route.test.ts` | 35/35 pass | **Pass** |

### Tranche 3 — Shared executor + EXDEV **(next)**

| Layer | Action | Command / file | Pass criterion |
|---|---|---|---|
| Spec | Update `IMPL-NSYNC_OPERATIONS` pseudo-code | sidecar + validate | EXDEV fallback + shared delegate blocks |
| RED | EXDEV on rename despite dev match | `engine.test.ts` or `operations.test.ts` | Fallback to copy; REQ-MOVE_SEMANTICS preserved |
| RED | Shared module extraction | new `move-executor.ts` or delegate | Single implementation for NSYNC + files.data |
| Unit | EXDEV path unchanged | `src/lib/files.data.test.ts` | Existing tests pass |
| Integration | Real FS + simulated EXDEV | `src/lib/copy-file.data.test.ts` | volA/volB layout; rename spy forces EXDEV |
| Regression | Full sync suite | `move-plan.test.ts` + `engine.test.ts` | No ordering regression |

### Tranche 4 — Verify optimization

| Layer | Action | Pass criterion |
|---|---|---|
| Unit | Rename leg with `verify: true` | No post-rename `verifyDestination` call |
| Unit | Cross-volume copy with `verify: true` | Post-copy verify still runs |
| Trace | REQ-VERIFY_DEST metadata | Traceability notes hybrid skip rule |

## TDD sequence (default per tranche)

1. IMPL pseudo-code + token comments  
2. `gate-pseudocode-validation`  
3. `unit-test-red` → `unit-test-green`  
4. `three-way-alignment-unit`  
5. `composition-integration` (if API/engine binding changed)  
6. `verification-gate` with scoped commands below  
7. `sync-tied-stack` + vocabulary RECORD  
8. Update CITDP `evidence.commands`

## Proof commands (verification gate)

```bash
bun run vitest run src/lib/sync/move-plan.test.ts src/lib/sync/engine.test.ts src/lib/files.data.test.ts src/lib/copy-file.data.test.ts
bunx tsc -b
bun run validate:vocabulary
# After TIED YAML writes:
# tied_validate_consistency include_pseudocode true
# pseudocode_validate IMPL-NSYNC_MOVE_PLAN IMPL-NSYNC_ENGINE require_contracts true
```

## Module validation (`[REQ-MODULE_VALIDATION]`)

| Module | Validate independently before integration |
|---|---|
| `buildMovePlan` | Unit tests with mocked `stat.dev`; no engine import |
| `SyncEngine` move path | Engine tests with mocked operations layer |
| Shared move executor | `files.data.test.ts` + copy-file integration |

## E2E policy

E2E **not required** — composition test on `files/route.test.ts` covers `sync-all` API wiring; move plan logic is unit/composition testable without Playwright.

## Adversarial falsification questions (minimal depth)

- Does rename ever run before all required copy legs complete?
- Can a plan with two same-volume destinations emit two rename legs?
- After cross-volume copy succeeds but rename fails, does source still exist?
- When verify is enabled, is post-rename verify incorrectly skipped for a copy leg misclassified as rename?
