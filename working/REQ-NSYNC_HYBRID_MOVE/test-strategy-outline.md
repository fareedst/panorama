# Test strategy outline — NSYNC Hybrid Move Optimization

**Request:** `REQ-NSYNC_HYBRID_MOVE`  
**Primary REQ anchors:** `[REQ-NSYNC_HYBRID_MOVE]`, `[REQ-MOVE_SEMANTICS]`, `[REQ-NSYNC_MULTI_TARGET]`  
**CITDP:** `tied/citdp/CITDP-NSYNC_HYBRID_MOVE.yaml`  
**Status:** Tranches 1–4 complete (close-out 2026-09-01); **Tranche 2b next** (refined 2026-09-01)

## Proof boundaries (non-negotiable)

| Evidence source | Proves | Does not prove |
|---|---|---|
| `move-plan.test.ts` | Plan ordering, single-rename invariant, volume classification mocks | Real filesystem `dev` on every mount layout |
| `engine.test.ts` | SyncEngine executes plan; parallel batch concurrency; deferred delete omitted when rename final | UI toolbar behavior; wall-clock speed on large files |
| `move-executor.test.ts` | EXDEV fallback in shared executor | NSYNC multi-dest ordering |
| `copy-file.data.test.ts` / `files.data.test.ts` | EXDEV fallback unchanged | NSYNC multi-dest ordering in isolation |
| `pseudocode_validate` | Layer B contracts on touched IMPL blocks | Runtime performance benchmarks |
| `tied_validate_consistency` | Token/index/detail integrity | Product behavior |
| Scoped Vitest + `bunx tsc -b` | Executable regression of touched paths | Untouched modules |

## Tranche test matrix

### Tranches 1–4 — Complete ✅

See CITDP evidence: 69 tests across move-plan, engine, move-executor, files.data, copy-file.data.

### Tranche 2b — Parallel cross-volume batch **(next)**

| Layer | Action | Command / file | Pass criterion |
|---|---|---|---|
| Spec | Update `EXECUTE_MOVE_PLAN` pseudo-code | `IMPL-NSYNC_ENGINE-pseudocode.md` | Parallel batch + sequential tail documented |
| Validate | Pseudo-code gate | `pseudocode_validate IMPL-NSYNC_ENGINE require_contracts true` | Exit 0 |
| RED | M=2 cross-volume concurrent copies | `engine.test.ts` | Both `copyFile` calls start before either resolves (deferred promise harness) |
| RED | M=1 cross-volume no batch | `engine.test.ts` | Sequential behavior unchanged |
| RED | Parallel batch failure aborts tail | `engine.test.ts` | Failed copy → rename not attempted; source preserved |
| GREEN | `partitionMovePlanLegs` + parallel batch in `executeMovePlan` | `engine.ts` | All RED tests pass |
| Regression | A+A+B mixed plan | `engine.test.ts` | Existing test passes |
| Regression | Verify on copy / skip on rename | `engine.test.ts` | Existing Tranche 4 tests pass |
| Regression | Full proof suite | § Proof commands | 69+ tests pass |
| Vocab | RECORD | `tied/vocab/nsync-multi-target.md` | **Parallel cross-volume batch** term present |

**Fixtures:** `vi.spyOn` on `copyFile` with manually controlled `Promise` resolvers; injectable `getDev` for volume classes (existing pattern).

**Concurrency test pattern (recommended):**

```typescript
// Two deferred promises; assert copyFile called twice before either resolve()
let started = 0;
vi.mocked(copyFile).mockImplementation(() => {
  started++;
  return new Promise((resolve) => { /* resolve in test after assert started === 2 */ });
});
```

## TDD sequence (Tranche 2b)

1. IMPL pseudo-code + token comments (`EXECUTE_MOVE_PLAN` parallel batch)  
2. `gate-pseudocode-validation`  
3. `unit-test-red` → `unit-test-green`  
4. `three-way-alignment-unit`  
5. `composition-integration` — `not_applicable` (no API wiring change)  
6. `verification-gate` with scoped commands below  
7. `sync-tied-stack` + vocabulary RECORD  
8. Update CITDP `evidence.commands`

## Proof commands (verification gate)

```bash
bun run vitest run src/lib/move-executor.test.ts src/lib/sync/move-plan.test.ts src/lib/sync/engine.test.ts src/lib/files.data.test.ts src/lib/copy-file.data.test.ts
bunx tsc -b
bun run validate:vocabulary
# After TIED YAML writes:
# tied_validate_consistency include_pseudocode true
# pseudocode_validate IMPL-NSYNC_ENGINE require_contracts true
```

## Module validation (`[REQ-MODULE_VALIDATION]`)

| Module | Validate independently before integration |
|---|---|
| `buildMovePlan` | Unchanged — no Tranche 2b plan builder changes |
| `executeMovePlan` parallel partition | Engine tests with mocked operations |
| Shared move executor | Regression via existing move-executor + files.data tests |

## E2E policy

E2E **not required** — composition test on `files/route.test.ts` covers `sync-all` API wiring; parallel batch is engine-internal.

## Adversarial falsification questions (minimal depth)

- Does rename or same-volume copy start before all parallel cross-volume copies settle?
- After one parallel cross-volume copy fails, does execution continue to rename?
- Can parallel batch run when only one cross-volume leg exists (M=1)?
- Does cancel abort before starting a parallel batch when signal already aborted?
