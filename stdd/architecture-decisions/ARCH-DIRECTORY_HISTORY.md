# [ARCH-DIRECTORY_HISTORY] Per-Directory Cursor Position History

**Cross-References**: [REQ-ADVANCED_NAV]  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Decision

Maintain user context when navigating directory trees using per-directory cursor position history with filename-based restoration that survives file changes.

## Rationale

Directory history prevents disorientation during navigation and improves efficiency by restoring context when revisiting directories. Filename-based restoration is more robust than index-based since it survives file additions/removals between visits.

## Alternatives Considered

See `architecture-decisions.yaml` for:
- Index-based history (rejected: breaks on file changes)
- localStorage persistence (rejected: session-only sufficient)

## Implementation Approach

Map-based history in React state with cursor position, scroll position, and LRU recent directories cache per pane.

**Key Components**:
- `DirectoryHistory` class with Map<paneId, Map<path, state>>
- `DirectoryCursorState` interface: filename, cursorIndex, scrollTop, timestamp
- Recent directories LRU cache (max 20 per pane)
- Forward/back navigation through history

## Token Coverage [PROC-TOKEN_AUDIT]

✅ Code annotations: `[IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]` in:
- `src/lib/files.history.ts` - All methods annotated
- `src/app/files/WorkspaceView.tsx` - Integration points annotated

✅ Tests: 19 tests with `[TEST-ADVANCED_NAV]` token references

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-07 | Phase 3 | ✅ Pass | 19 tests passing, production build successful |

## Related Decisions

- **Depends on**: [REQ-ADVANCED_NAV]
- **Informs**: [IMPL-DIR_HISTORY]
- **See also**: [ARCH-MARKING_STATE]

---

**Status**: Implemented and validated  
**Created**: 2026-02-07
