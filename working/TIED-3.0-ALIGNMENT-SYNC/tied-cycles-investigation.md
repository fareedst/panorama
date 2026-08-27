# tied_cycles validator investigation — P2.1

**Request:** `TIED-3.0-ALIGNMENT-SYNC`  
**Date:** 2026-08-27  
**Tranche:** follow-on tranche 1 (build-plan)

## Observation

E4 structural comparison documents `tied_cycles` **ok: true → false** while the dependency graph reports **0 cycles**:

| Source | `ok` | Cycles |
|---|---|---|
| E0 pilot baseline | true | (not recorded) |
| E4 post profile | false | 0 (graph partition) |

Reference: [e4-structural-comparison.v1.json](./e4-structural-comparison.v1.json) residual delta.

## Root cause

**Schema mismatch between MCP tool output and evidence-chain profile adapter.**

Live MCP call (`tied_cycles`) returns:

```json
{
  "cycles": [],
  "has_cycles": false
}
```

The tool does **not** emit an `ok` boolean. The evidence-chain profile generator maps structural validator results using an `ok` field; when `ok` is absent, the profile records **`ok: false`** even though `has_cycles` is false and `cycles` is empty.

The graph partition in [evidence-chain-profile-e4-post.v1.json](./evidence-chain-profile-e4-post.v1.json) correctly records `cycles: 0`.

## Impact

- **Not a panorama product defect** — no circular REQ dependencies exist in project YAML.
- **Not a P0/P1 alignment blocker** — close-out allowed at minimal depth with documented delta.
- **Validator parity gap** — E0 baseline assumed `ok: true`; E4 integrated profile reports `ok: false` for the same zero-cycle graph.

## Resolution

| Option | Owner | Status |
|---|---|---|
| Fix TIED MCP `tied_cycles` to return `ok: !has_cycles` (or profile adapter to derive ok from `has_cycles`) | TIED methodology repo | **Recommended** — out of panorama scope |
| Document permanent waiver in CITDP | panorama | **Done** — sponsor-approved residual note |
| Re-run E4 comparison after MCP fix | panorama | **Complete** — P2.2 [e4-tranche-2-log.md](./e4-tranche-2-log.md) |

## Sponsor disposition

Sponsor approved accepting this delta through **2026-09-27** as documented validator hygiene debt, not product risk.
