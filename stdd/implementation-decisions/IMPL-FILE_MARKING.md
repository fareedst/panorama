# [IMPL-FILE_MARKING] React State Mark Management

**Cross-References**: [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]  
**Status**: Active  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Implementation Approach

See `implementation-decisions.yaml` § IMPL-FILE_MARKING for summary and details.

- State: `marks: Set<string>` per pane in PaneState; name-based so marks survive sort/refresh.
- Operations: toggle (M, Space, checkbox), mark all (Shift+M), invert (Ctrl+M), clear (Escape).
- Visual: checkbox icon + background highlight; footer `[N marked]`.
- Space key: mark and move cursor down (Goful UX pattern).

## Code Locations

See YAML `code_locations` for files and functions.

## Lessons Learned [Phase 1–2 session]

- **Name-based persistence**: Storing marks by filename (not index) keeps selection correct after sort or refresh; no complex index tracking needed.
- **Client-only state**: No server-side mark storage; keeps UI instant and avoids session/API complexity.

## Token Coverage [PROC-TOKEN_AUDIT]

Implementation and tests annotated with [IMPL-FILE_MARKING], [ARCH-MARKING_STATE], [REQ-FILE_MARKING_WEB].

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date       | Result | Notes                    |
|-----------|--------|---------------------------|
| 2026-02-07 | pass   | 24 tests in WorkspaceView.test.tsx, all passing |

## Related Decisions

See YAML `related_decisions`. See also IMPL-BULK_OPS.
