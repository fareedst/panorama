# Maintenance log — TIED 3.0 alignment sync

**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Run ID:** `maint1-20260827`  
**Date:** 2026-08-27  
**Trigger:** Post follow-on tranches 1–5; refresh manifest/profile after material test changes (1271 → 1278 Vitest tests)

## Commands

| Step | Tool | Result |
|---|---|---|
| Collect manifest | `quality_evidence_collect_manifest` | 6/6 passed |
| Regenerate profile | `evidence_chain_profile_generate` (integrated, structural validators) | ok |

## Artifacts updated

| Artifact | Path |
|---|---|
| Verification manifest | `verification-evidence-manifest.v1.json` |
| Evidence-chain profile | `evidence-chain-profile.v1.json` |
| Collect args (replay) | `maint1-collect-args.json` |
| Command stdout/stderr | `maint1-artifacts/` |

## Observed baseline

| Metric | E3 tranche 1 (`e3t1`) | Maintenance (`maint1`) |
|---|---|---|
| Vitest | 1271 passed | **1278 passed** (145 files) |
| Commit | `29224e94…` | `29224e94…` (unchanged) |
| Binding inventory | 31 rows (validate at E3) | 33 rows (validate pass) |

## Notes

- E4 post profile (`evidence-chain-profile-e4-post.v1.json`) and structural comparison remain pinned to P2.2 run `e4t2-20260827` for E0 delta evidence.
- Next calendar action: exception renewal review **2026-11-27**.
