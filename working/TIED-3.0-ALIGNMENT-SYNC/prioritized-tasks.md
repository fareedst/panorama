# TIED 3.0 Alignment Sync — Prioritized Tasks (refined)

**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Refined:** 2026-08-27 (`@refine-plan`)  
**Sponsor DRI:** sponsor (approved 2026-08-27)  
**Depth / gate policy:** `minimal` / advisory (unchanged)  
**Authoritative plan:** [docs/tied-3.0-alignment-sync-plan.md](../../docs/tied-3.0-alignment-sync-plan.md)  
**CITDP:** [tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml](../../tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml)  
**Test strategy:** [test-strategy-outline.md](./test-strategy-outline.md)

---

## Executive summary

| Milestone | Status |
|---|---|
| E0–E4 + close-out | **Complete** |
| Sponsor approval | **Complete** |
| Follow-on tranche 1 (P2.1 + P1.1) | **Complete** |
| Follow-on tranche 2 (P1.2 + P1.3) | **Complete** |
| **P1 traceability closure** | **Complete** — all actionable gaps closed |
| **P3.1 accessibility evidence** | **Complete** — QA profile **observed** |
| **P4 exception expiry review** | **Complete** — renewed to **2026-11-27** |
| **P2.2 E4 re-profile** | **Complete** — [e4-tranche-2-log.md](./e4-tranche-2-log.md) |
| **Build-plan tranches** | **All complete** (1–5) |

**Current test baseline:** 145 files, **1278 passed**, 3 skipped (`bun run test`).

---

## Results — alignment sync (E0–E4)

| Phase | Exit evidence | Status |
|---|---|---|
| E1 / P0 | 85/85 sidecars; strict `pseudocode_validate` | Complete |
| E2 / P1 | 33-row binding inventory; 4-profile QA matrix | Complete (expanded +2 rows in tranche 1) |
| E3 / P2 | Manifest 6/6; `command_results` observed | Complete |
| E4 | Post profile + E0 structural comparison | Complete |
| Close-out | CITDP persisted; `close_out` gate allowed | Complete |

---

## Results — follow-on tranches

### Tranche 1 ([follow-on-tranche-1-log.md](./follow-on-tranche-1-log.md))

| Deliverable | Outcome |
|---|---|
| P2.1 `tied_cycles` investigation | Root cause: MCP omits `ok` field — [tied-cycles-investigation.md](./tied-cycles-investigation.md) |
| P1.1 `IMPL-PANE_REFRESH` | `WorkspaceView.pane-refresh.test.tsx`; inventory +2 rows |
| Traceability | `impl_without_test` 8 → 7 |
| Gate | verification **allowed: true** |

### Tranche 2 ([follow-on-tranche-2-log.md](./follow-on-tranche-2-log.md))

| Deliverable | Outcome |
|---|---|
| P1.2 `IMPL-FLEX_LAYOUT` | `WorkspaceView.flex-layout.test.tsx` (2 tests) |
| P1.3 `IMPL-RESPONSIVE_CLASSES` | `HelpOverlay.test.tsx` + SortDialog/FilePane responsive tests |
| Traceability | `impl_without_test` 7 → **5** |
| Gate | pre_implementation + verification **allowed: true** |

### Traceability snapshot (live)

| Dimension | Count | Notes |
|---|---|---|
| `impl_without_test` (gap report) | **5** | All approved deferrals — no honest product test loci |
| `req_without_test` | **3** | Methodology/process — CITDP exceptions |
| Closed via follow-on | **3** | `IMPL-PANE_REFRESH`, `IMPL-FLEX_LAYOUT`, `IMPL-RESPONSIVE_CLASSES` |

**Approved deferrals (no further P1 work):**

| Token | Rationale |
|---|---|
| `IMPL-MCP_FEEDBACK_TOOLS`, `IMPL-MODULE_VALIDATION`, `IMPL-TIED_FILES` | Methodology |
| `IMPL-PERFORMANCE_OPT`, `IMPL-TEST_CONFIG` | Planned / infrastructure |
| `REQ-FEEDBACK_TO_TIED`, `REQ-TIED_SETUP`, `REQ-MODULE_VALIDATION` | Process / meta-setup |

### Tranche 3 ([follow-on-tranche-3-log.md](./follow-on-tranche-3-log.md))

| Deliverable | Outcome |
|---|---|
| P3.1 Playwright a11y E2E | `e2e/workspace-a11y-evidence.spec.ts` (4 tests, 4/4 pass) |
| QA matrix | `user-facing-accessibility` **partial → observed**; waiver removed |
| Binding inventory | `e2e_test` paths on 2 `e2e_only` rows |
| Gate | pre_implementation + verification **allowed: true** |

---

### Tranche 4 ([follow-on-tranche-4-log.md](./follow-on-tranche-4-log.md))

| Deliverable | Outcome |
|---|---|
| P4.1 traceability exceptions (8) | **Renewed** to 2026-11-27 — no escalations |
| P4.2 a11y waiver review | **Closed** — observed in tranche 3 |
| P4.3 CITDP residual_risk | Updated summary + expiry |
| `tied_cycles` waiver (P4) | Renewed pending P2.2 — **closed** in P2.2 |
| Gate | verification **allowed: true** |

---

### Tranche 5 / P2.2 ([e4-tranche-2-log.md](./e4-tranche-2-log.md))

| Deliverable | Outcome |
|---|---|
| Methodology consume | `copy_files.sh`; MCP `tied_cycles` emits `ok` |
| E4 profile regenerate | `evidence-chain-profile-e4-post.v1.json`; run_id `e4t2-20260827` |
| Structural comparison | `e4-structural-comparison.v1.json` — `tied_cycles` delta **cleared** |
| CITDP | `validator_hygiene.tied_cycles` **removed** |

---

### P2.2 E4 re-comparison

**Complete** (2026-08-27) — see [e4-tranche-2-log.md](./e4-tranche-2-log.md).

---

### Priority 4 — P5 Out of scope (hold)

| Item | Trigger |
|---|---|
| `human_research` depth | New CITDP |
| Methodology YAML edits | TIED source repo |
| New product features | Separate REQ/CITDP |

---

## Recommended build-plan sequence

| Tranche | Focus | Prerequisite |
|---|---|---|
| ~~1~~ | P2.1 + P1.1 | Done |
| ~~2~~ | P1.2 + P1.3 | Done |
| ~~3~~ | **P3.1 a11y E2E evidence** | Done |
| ~~4~~ | **P4 expiry review** | Done |
| ~~5~~ | **P2.2 E4 re-profile** | Done — [e4-tranche-2-log.md](./e4-tranche-2-log.md) |

**Next:** Maintenance only — see [pending-work.md](./pending-work.md) (calendar **2026-11-27**).

---

## Artifact index

| Artifact | Path |
|---|---|
| Prioritized tasks (this doc) | `working/TIED-3.0-ALIGNMENT-SYNC/prioritized-tasks.md` |
| Test strategy (incl. tranche 3) | `working/TIED-3.0-ALIGNMENT-SYNC/test-strategy-outline.md` |
| Follow-on tranche 1 | `working/TIED-3.0-ALIGNMENT-SYNC/follow-on-tranche-1-log.md` |
| Follow-on tranche 2 | `working/TIED-3.0-ALIGNMENT-SYNC/follow-on-tranche-2-log.md` |
| tied_cycles investigation | `working/TIED-3.0-ALIGNMENT-SYNC/tied-cycles-investigation.md` |
| E4 re-profile (P2.2) | `working/TIED-3.0-ALIGNMENT-SYNC/e4-tranche-2-log.md` |
| Structural comparison | `working/TIED-3.0-ALIGNMENT-SYNC/e4-structural-comparison.v1.json` |
| Follow-on tranche 3 | `working/TIED-3.0-ALIGNMENT-SYNC/follow-on-tranche-3-log.md` |
| Follow-on tranche 4 | `working/TIED-3.0-ALIGNMENT-SYNC/follow-on-tranche-4-log.md` |
| P4 gap report | `working/TIED-3.0-ALIGNMENT-SYNC/traceability-gap-report-p4-review.json` |
| Gate receipts | `gate-verification-followon-tranche-{1,2,3,4}.json` |
| CITDP | `tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml` |
