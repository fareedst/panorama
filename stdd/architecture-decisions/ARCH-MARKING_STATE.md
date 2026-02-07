# [ARCH-MARKING_STATE] Client-Side Mark State Management

**Cross-References**: [REQ-FILE_MARKING_WEB]  
**Status**: Active  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Decision

Store file marking state in client-side React state using Set<string> for marked filenames per pane. Marks persist across sorting and filtering via name-based matching, with no server-side storage.

## Rationale

**Why this decision was made:**
- Instant feedback requires client-side state (no network latency)
- Name-based persistence survives sort/filter operations
- Simple Set<string> storage is efficient and idiomatic
- Each pane maintains independent mark set

**Problems it solves:**
- Server-side storage adds 50-200ms latency per mark toggle
- Index-based marking breaks when file order changes
- Complex server synchronization not needed

**Benefits:**
- Instant mark toggle feedback (no network delay)
- Survives re-sort, re-filter, directory refresh
- Simple React state management
- Memory efficient (Set of strings)

## Alternatives Considered

**Alternative 1: Server-side mark storage in session**
- **Pros**: Persists across page refresh
- **Cons**: Network latency on every operation, complex session management
- **Rejected reason**: Latency unacceptable for interactive marking

**Alternative 2: Index-based marking (Set<number>)**
- **Pros**: Simpler storage (integers)
- **Cons**: Breaks when files re-sorted
- **Rejected reason**: Name-based more robust

## Implementation Approach

**High-level approach:**
1. Extend PaneState interface: `marks: Set<string>`
2. Mark operations: `toggleMark(filename)`, `markAll()`, `invertMarks()`, `clearMarks()`
3. Visual feedback: Checkbox icon + background color from theme.yaml
4. Footer display: `[${marks.size}/${files.length}]`
5. Batch operations: Check `marks.size > 0` to determine source files

**Key components:**
- PaneState.marks: Set<string>
- handleToggleMark(paneIndex, filename)
- handleMarkAll(paneIndex)
- handleInvertMarks(paneIndex)
- handleClearMarks(paneIndex)

**Integration points:**
- WorkspaceView.tsx: Mark state and handlers
- FilePane.tsx: Checkbox rendering and click handlers
- Batch operations: getOperationSources(paneState) helper

## Token Coverage [PROC-TOKEN_AUDIT]

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `src/app/files/WorkspaceView.tsx` - Mark state management
- [ ] `src/app/files/components/FilePane.tsx` - Checkbox UI

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `testMarkingState_ARCH_MARKING_STATE` in component tests

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-07 | Planning | 📋 Planned | Awaiting implementation |

## Related Decisions

- **Depends on**: [REQ-FILE_MARKING_WEB]
- **Informs**: [IMPL-FILE_MARKING]
- **See also**: [ARCH-BATCH_OPERATIONS]

---

*Adapted from*: Goful ARCH-FILE_DATA_BRIDGE (marking state portion)  
*Translation date*: 2026-02-07  
*Last validated*: 2026-02-07 by AI agent
