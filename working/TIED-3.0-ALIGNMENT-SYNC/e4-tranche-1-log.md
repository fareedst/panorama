# E4 tranche 1 — execution log

**Date:** 2026-08-27  
**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Phase:** E4 (fixed-commit re-profile vs E0 baseline)

## Pinned commits

| Label | Commit |
|---|---|
| E0 pilot baseline | `595d323e24e56642d83ed631124a0e14e70ace56` |
| E4 post (E3 completion) | `29224e949c3f1612c4ddad8b8024004f5d91a777` |

## Completed

### E4 post profile

- **Tool:** `evidence_chain_profile_generate`
- **Profile depth:** `integrated`
- **Manifest:** attached (`verification-evidence-manifest.v1.json`)
- **invoke_structural_validators:** true
- **Run ID:** `e4t1-20260827`
- **Artifact:** `evidence-chain-profile-e4-post.v1.json`

### E0 baseline reference

- **Artifact:** `e0-pilot-baseline-reference.v1.json`
- **Source:** plan § A.3 pilot observations (no machine profile existed at E0)

### Structural comparison

- **Artifact:** `e4-structural-comparison.v1.json`
- **Compatibility key:** `evidence-chain-profile.v1|integrated`

| Validator | E0 | E4 | Notes |
|---|---|---|---|
| `traceability_gap_report` | ok **false** | ok **true** | Improvement — CITDP exceptions; suggested_exit_code 0 |
| `tied_cycles` | ok **true** | ok **false** | Residual delta — graph still 0 cycles |
| Others (4) | ok true | ok true | Maintained |

**Quality delta:** `command_results` **not_measured → observed** (manifest attach at E3/E4).

## Verification (observed)

| Gate / tool | Result |
|---|---|
| `tied_checklist_gate_validate` pre_implementation | allowed true, minimal |
| `tied_checklist_gate_validate` verification | allowed true, minimal |

Artifacts: `gate-pre_implementation-e4t1.json`, `gate-verification-e4t1.json`

## Remaining

- Close-out: persist CITDP, `close_out` gate, vocabulary VALIDATE, sponsor DRI
- Optional: P1 `IMPL-PANE_REFRESH` expansion
