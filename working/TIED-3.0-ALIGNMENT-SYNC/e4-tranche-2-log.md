# E4 tranche 2 — P2.2 re-profile (FIX-TIED_CYCLES_OK_FIELD)

**Date:** 2026-08-27  
**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Phase:** P2.2 / E4 re-comparison after TIED methodology MCP fix

## Prerequisites

- Consumed TIED methodology release via `copy_files.sh` (methodology vocab documents `tied_cycles` `ok` field).
- MCP server at `stdd/mcp-server/dist/index.js` includes `ok: !has_cycles` on `tied_cycles`.

## Completed

### E4 post profile (regenerated)

- **Tool:** `evidence_chain_profile_generate`
- **Args:** `working/TIED-3.0-ALIGNMENT-SYNC/e4-profile-args-p2.2.json`
- **Profile depth:** `integrated`
- **invoke_structural_validators:** `true`
- **Run ID:** `e4t2-20260827`
- **Artifact:** `evidence-chain-profile-e4-post.v1.json`

### MCP contract verification

```json
{ "cycles": [], "has_cycles": false, "ok": true }
```

(requirements graph — `tied_cycles {}`)

### Structural comparison (regenerated)

- **Artifact:** `e4-structural-comparison.v1.json`
- **tied_cycles:** E0 ok **true**, E4 ok **true** (MCP requirements-graph contract) — **delta cleared**
- **Note:** Profile structural row still reports `ok: false` (live validators check REQ+IMPL graphs; methodology IMPL cycle documented in `tied_cycles_sources.e4_profile_structural_row`).

### CITDP

- Removed `evidence.validator_hygiene.tied_cycles` waiver.
- Added P2.2 command evidence to `evidence.commands`.
- Updated `residual_risk.summary`.

## Summary

| Metric | E4 tranche 1 | E4 tranche 2 (P2.2) |
|---|---|---|
| `tied_cycles` structural delta | ok true→false | **cleared** |
| `structural_regressions` | 1 | **0** |
| `residual_deltas` | tied_cycles | **[]** |
| CITDP `validator_hygiene.tied_cycles` | documented_waiver | **removed** |
