# CROSS_VOLUME_MOVE_EXDEV close-out

## Verification

- Scoped Vitest: 42 tests passed across `files.data.test.ts` and `copy-file.data.test.ts`.
- TypeScript: `bunx tsc -b` passed.
- IMPL pseudo-code: `IMPL-FILES_DATA` structural validation passed with zero diagnostics.
- TIED consistency: `ok: true`.
- TIED index validation: requirements, architecture, implementation, and semantic-token indexes valid.
- Vocabulary validation: 10 client glossaries passed.
- Linter diagnostics: none for the changed source and test files.

The repository does not contain the legacy `scripts/validate_tokens.sh` or a
project-local `.cursor/skills/tied-yaml/scripts/tied-cli.sh`; the equivalent
MCP validation path was used and recorded in the CITDP evidence.

## Gate

`tied_checklist_gate_validate` allowed `close_out` at `minimal` depth with no
diagnostics.

| Run | Receipt |
| --- | --- |
| Initial close-out | `working/REQ-FILE_OPERATIONS/close_out-2026-09-01T16-30-46-411Z.json` |
| `@plan-close-out` re-validation | `working/REQ-FILE_OPERATIONS/close_out-2026-09-01T16-33-58-820Z.json` |

Profile: `depth_tier: minimal`, `gate_policy: advisory`, `assurance_profile: baseline-functional`.
Integrated activation evidence not required at this depth.

## Scope

`moveFile` preserves the same-volume `fs.rename` fast path and falls back to
`copyFile` followed by `deleteFile` when rename returns `EXDEV`. No API/UI
composition or E2E changes were required.
