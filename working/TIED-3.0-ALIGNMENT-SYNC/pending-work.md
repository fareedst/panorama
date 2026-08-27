# TIED 3.0 Alignment Sync — Pending Work

**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**As of:** 2026-08-27 (after follow-on tranches 1–5 / P2.2 + maintenance `maint1`)  
**Authoritative plan:** [docs/tied-3.0-alignment-sync-plan.md](../../docs/tied-3.0-alignment-sync-plan.md)  
**CITDP:** [tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml](../../tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml)  
**Prioritized follow-ons:** [prioritized-tasks.md](./prioritized-tasks.md)

---

## Status

**Complete.** Alignment sync and all follow-on build-plan tranches delivered.

| Item | Resolution |
|---|---|
| E0–E4 + close-out | **Complete** |
| Follow-on tranches 1–4 (P1, P3.1, P4) | **Complete** |
| P2.2 E4 re-profile | **Complete** — [e4-tranche-2-log.md](./e4-tranche-2-log.md) |
| Maintenance manifest/profile (`maint1`) | **Complete** — [maintenance-log.md](./maintenance-log.md) |
| Sponsor approval | **Approved** — sponsor (2026-08-27) |
| P1 traceability (3 tokens) | **Closed** — tranches 1–2 |
| P3.1 a11y evidence | **Observed** — tranche 3 |
| P4 exception review | **Complete** — renewed to **2026-11-27** |
| `impl_without_test` (live) | **5** approved deferrals (CITDP) |
| `tied_cycles` waiver | **Closed** — FIX-TIED_CYCLES_OK_FIELD |

---

## Next action

**Maintenance only** — no open build-plan tranches for this CITDP.

| When | Action |
|---|---|
| **2026-11-27** | Calendar exception renewal review (8 traceability deferrals + `residual_risk`) |
| After material test/TIED changes | Re-run [maintenance runbook](#maintenance-runbook) below |
| Each TIED-touching commit | `bun run validate:vocabulary`; `tied_validate_consistency` |

Out of scope unless new CITDP: `human_research` depth, methodology YAML edits, new product features.

---

## Maintenance runbook

**Trigger when any of:** new/changed Vitest or Playwright tests; binding inventory rows added; TIED YAML or sidecar edits affecting traceability; sponsor requests fresh executable evidence.

### 1. Pin context

```bash
git rev-parse HEAD   # record commit in collect args
```

Use a new `run_id` (e.g. `maint2-YYYYMMDD`).

### 2. Collect verification manifest

Copy [maint1-collect-args.json](./maint1-collect-args.json); update `run_id`, `commit`, and `artifact_dir` prefixes.

```bash
TIED_BASE_PATH=/Users/fareed/Documents/dev/node/panorama/tied \
  .cursor/skills/tied-yaml/scripts/tied-cli.sh \
  quality_evidence_collect_manifest @working/TIED-3.0-ALIGNMENT-SYNC/maint1-collect-args.json \
  > working/TIED-3.0-ALIGNMENT-SYNC/verification-evidence-manifest.v1.json
```

**Pass criterion:** 6/6 commands `result: passed` (tsc, vitest, vocabulary, tied_validate_consistency, binding_inventory_validate, traceability_gap_report).

### 3. Regenerate integrated profile

```bash
TIED_BASE_PATH=/Users/fareed/Documents/dev/node/panorama/tied \
  .cursor/skills/tied-yaml/scripts/tied-cli.sh \
  evidence_chain_profile_generate @working/TIED-3.0-ALIGNMENT-SYNC/maint1-profile-args.json
```

Update `run_id` / `commit` in [maint1-profile-args.json](./maint1-profile-args.json) to match step 2.

**Pass criterion:** `quality.command_results` **observed**; structural rows **observed** when `invoke_structural_validators: true`.

### 4. Record evidence

- Append results to [maintenance-log.md](./maintenance-log.md)
- Add `evidence.commands` row to CITDP (via `citdp_record_write` or sponsor-approved edit)
- Re-run `tied_checklist_gate_validate` `phase: verification` if sponsor requires a fresh gate receipt

**Do not** regenerate `evidence-chain-profile-e4-post.v1.json` or `e4-structural-comparison.v1.json` unless repeating an E4/P2.2-style fixed-commit comparison.

### 5. Exception renewal (calendar **2026-11-27**)

1. Run `tied_scoped_analysis_run` `traceability_gap_report`
2. Compare gap rows to CITDP `traceability_exceptions`
3. For each deferral: renew (owner + expiry), close with new test loci, or escalate
4. Update CITDP `residual_risk.summary` and gate if policy requires

---

## Artifact index

| Artifact | Path |
|---|---|
| Maintenance log | `working/TIED-3.0-ALIGNMENT-SYNC/maintenance-log.md` |
| Prioritized tasks (refined) | `working/TIED-3.0-ALIGNMENT-SYNC/prioritized-tasks.md` |
| E4 re-profile (P2.2) | `working/TIED-3.0-ALIGNMENT-SYNC/e4-tranche-2-log.md` |
| Structural comparison | `working/TIED-3.0-ALIGNMENT-SYNC/e4-structural-comparison.v1.json` |
| Verification manifest | `working/TIED-3.0-ALIGNMENT-SYNC/verification-evidence-manifest.v1.json` |
| Evidence-chain profile | `working/TIED-3.0-ALIGNMENT-SYNC/evidence-chain-profile.v1.json` |
| CITDP (canonical) | `tied/citdp/CITDP-TIED-3.0-ALIGNMENT-SYNC.yaml` |
