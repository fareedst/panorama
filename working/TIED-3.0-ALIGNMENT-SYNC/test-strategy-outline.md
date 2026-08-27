# Test strategy outline — TIED 3.0 alignment sync

**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Primary REQ anchor:** `[REQ-TIED_SETUP]`  
**CITDP target:** `tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml` (persist at close-out)

## Proof boundaries (non-negotiable)

| Evidence source | Proves | Does not prove |
|---|---|---|
| `pseudocode_validate` (strict) | Layer B contract shape on touched Active blocks | Runtime correctness |
| `traceability_gap_report` / scoped analysis | REQ↔IMPL↔test linkage gaps | Test quality or coverage depth |
| `binding_inventory_validate` | Inventory row completeness and E2E justification | Callee behavior or argument semantics |
| `tied_validate_consistency` | Index/detail/pseudo-code token integrity | Product behavior |
| Vitest + `bunx tsc -b` | Executable regression of touched code paths | Untouched modules |
| Verification manifest (E3) | Command exit codes with provenance | Security, performance, privacy |

## Tranche test matrix

### E1 / P0 — Contract precision

| Layer | Action | Command / tool | Pass criterion |
|---|---|---|---|
| Spec | Add PRE/POST/EFFECTS (+ optional FAILURE_MODES/DATA_TRANSITION/TERMINATION) to changed Active blocks | Direct sidecar edit or `impl_detail_set_essence_pseudocode` | Block lead comments unchanged; contract clauses present |
| Validate | Strict pseudo-code gate | `pseudocode_validate` with strict Layer B | No SHAPE-003..006 gaps on in-scope blocks |
| Regression | TypeScript | `bunx tsc -b` | Exit 0 |
| Sync | TIED integrity | `tied_validate_consistency` | `ok: true` |

**Brownfield note:** Legacy untouched blocks may retain N/A `pre-contract-grammar` until edited; tranche scope is **touched** blocks only.

### E1 / P0 — REQ test metadata

| Layer | Action | Command / tool | Pass criterion |
|---|---|---|---|
| Spec | Backfill `tests` / traceability fields on REQ rows | MCP `yaml_detail_update` on affected REQ detail files | Each in-scope REQ names test locus or documented exception |
| Validate | Traceability gap | `tied_scoped_analysis_run` or evidence-chain structural partition | `traceability_gap_report` passes or exceptions recorded in CITDP |
| Regression | Full suite | `bun run test` | Exit 0; no new failures from metadata-only edits |

**Priority order:** REQ rows with existing IMPL sidecars and unit tests first (~29 of 74); defer methodology-only or deferred REQ rows with approved waivers.

### E2 / P1 — Composition inventory

**Status (2026-08-27):** Complete — 33 rows; `binding_inventory_validate` pass. Follow-on tranches 1–3 expanded inventory (+2 pane refresh; e2e_test paths on a11y rows).

| Layer | Action | Command / tool | Pass criterion |
|---|---|---|---|
| Inventory | Author rows in `working/TIED-3.0-ALIGNMENT-SYNC/binding-inventory.yaml` | Manual + `binding_inventory_validate` | Every composition-testable seam has `composition_test` |
| RED | UI-free composition tests | Vitest under `src/**` (pattern: `*.route.test.ts`, `*.composition.test.ts`) | Tests fire trigger programmatically; assert callee/args/effect |
| Validate | Inventory gate | `binding_inventory_validate` | Exit success; no missing required fields |
| E2E | Justified only | Mark `e2e_only: true` + `e2e_only_reason` per `composition-coverage.md` | No E2E replaces composition for programmatically testable bindings |

**Baseline reconciled:** 29 composition rows + 2 e2e_only across Mesh API routes, workspace entry, domain composition, and files API — see `binding-inventory.yaml`.

### E2 / P1 — Risk-triggered QA

| Profile | Trigger in this repo | Minimum evidence |
|---|---|---|
| `baseline-functional` | Every tranche | Unit TDD, composition where applicable, traceability validators |
| `external-input-security` | Mesh API routes, file paths, import/export | Abuse cases from quality-assurance glossary; route-level malformed-input tests |
| `user-facing-accessibility` | Workspace panes, toolbar, linked navigation | UI-free contract tests; E2E only for named platform constraints |
| `data-integrity-migration` | Mesh snapshot save/restore | Invariant tests on domain model; replay/idempotency where applicable |

Matrix lives in CITDP `risk_analysis.quality_evidence_matrix`; update `result` and provenance each tranche.

### E3 / P2 — Evidence chain

**Status:** Complete — E3 tranche 1 + P2.2 profile refresh (`e4-tranche-2-log.md`).

| Step | Command | Artifact |
|---|---|---|
| Collect | `quality_evidence_collect_manifest` (argv-only bundle below) | `working/TIED-3.0-ALIGNMENT-SYNC/verification-evidence-manifest.v1.json` |
| Profile | `evidence_chain_profile_generate` (`profile_depth: integrated`, `manifest_reference`, `invoke_structural_validators: true`) | `working/TIED-3.0-ALIGNMENT-SYNC/evidence-chain-profile.v1.json` |
| Gate | `tied_checklist_gate_validate` `phase: verification` | `gate-verification-e3t1.json` |
| Compare | Fixed-commit re-profile after E3 (E4) | Compatible structural fields only vs E0 pilot baseline |

**Manifest minimum commands:** `bunx tsc -b`; `bun run test`; `bun run validate:vocabulary`; tied-cli `tied_validate_consistency` (include_pseudocode true); `binding_inventory_validate`; `tied_scoped_analysis_run` traceability_gap_report.

**Depth note:** `profile_depth: integrated` on the evidence-chain profile is independent of checklist `depth_tier: minimal` (adversarial inquiry stays `not_applicable`).

## TDD sequence (default per tranche)

1. IMPL pseudo-code + token comments (`[PROC-IMPL_PSEUDOCODE_TOKENS]`)
2. `gate-pseudocode-validation` (strict when P0 contract work)
3. `unit-test-red` → `unit-test-green` for behavior touched by metadata or sidecar edits
4. `composition-integration` when binding inventory rows added
5. `verification-gate` → `tied_validate_consistency` → `lint_yaml` on changed YAML
6. Update CITDP evidence.commands with exit codes and artifact paths

## Commands bundle (verification gate)

```bash
bunx tsc -b
bun run test
bun run validate:vocabulary
# via tied-cli.sh with TIED_BASE_PATH confirmed:
pseudocode_validate
binding_inventory_validate   # P1+
tied_validate_consistency
tied_checklist_gate_validate # phase verification / close_out
```

## Deferred / out of scope for test strategy

- Methodology YAML under `tied/methodology/` (read-only)
- `human_research` profile depth (fidelity/binding adapters) unless sponsor expands scope
- New product features beyond alignment evidence

---

## Follow-on tranche 3 — P3.1 accessibility evidence (refined 2026-08-27)

**Status:** Complete — follow-on tranche 3 (2026-08-27).

**Goal:** Promote CITDP `user-facing-accessibility` from **partial** → **observed** — **achieved** tranche 3.

| Layer | Action | Command / tool | Pass criterion |
|---|---|---|---|
| Inventory | Map `e2e_only` rows to Playwright specs | `binding-inventory.yaml` rows `workspace.ui.linked_navigation`, `workspace.ui.toolbar_display_cycle` | Each row has named E2E test path or documented renewal |
| RED | Playwright specs for browser-only seams | `e2e/workspace-a11y-evidence.spec.ts` (new) or extend `e2e/readme-workspace-motion.spec.ts` | Keyboard linked sync; toolbar display cycle asserted in browser |
| Validate | Inventory + QA matrix | `binding_inventory_validate`; CITDP `quality_evidence_matrix` update | a11y profile `result: observed` or waiver renewed |
| Gate | Verification | `tied_checklist_gate_validate` `phase: verification` | **allowed: true** |

**Prerequisite:** Playwright project configured (`playwright.config.ts`); dev server or static fixture per existing `e2e/helpers/readme-demo.ts`.

**Out of scope:** Full axe-core audit, screen-reader certification, visual regression expansion beyond inventory rows.

---

## Follow-on tranche 5 / P2.2 — E4 re-profile (2026-08-27)

**Status:** Complete — [e4-tranche-2-log.md](./e4-tranche-2-log.md).

| Layer | Action | Pass criterion |
|---|---|---|
| Consume | TIED methodology release (`copy_files.sh`; MCP `tied_cycles ok`) | CLI + in-editor MCP return `ok: true` on requirements graph |
| Profile | `evidence_chain_profile_generate` integrated + `invoke_structural_validators: true` | `evidence-chain-profile-e4-post.v1.json` run_id `e4t2-20260827` |
| Compare | Regenerate `e4-structural-comparison.v1.json` | `tied_cycles` structural delta cleared |
| CITDP | Remove `validator_hygiene.tied_cycles` | Waiver closed |
