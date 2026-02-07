# [ARCH-COMPARISON_COLORING] Enhanced Cross-Pane Comparison Coloring

**Cross-References**: [REQ-FILE_COMPARISON_VISUAL]  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Decision

Enhance the existing comparison index with size and time comparison logic, applying theme-configurable CSS classes for visual differentiation of files across panes.

## Rationale

The existing comparison system only identifies shared filenames. Users need instant visual feedback about size and timestamp differences to:
- Identify newest versions for backup verification
- Find largest versions for disk usage analysis  
- Detect equal files for deduplication
- Eliminate manual file-by-file comparison

## Alternatives Considered

See `architecture-decisions.yaml` for full alternatives:
- **Server-side comparison**: Rejected due to network latency
- **On-demand comparison**: Rejected because automatic comparison is a core feature

## Implementation Approach

### 1. Enhanced Comparison Types

```typescript
export type SizeComparison = "equal" | "smallest" | "largest" | null;
export type TimeComparison = "equal" | "earliest" | "latest" | null;

export interface EnhancedCompareState extends CompareState {
  sizeComparison: SizeComparison[];  // One per pane
  timeComparison: TimeComparison[];  // One per pane
}
```

### 2. Comparison Logic

**Size Comparison**:
- `equal`: All sizes are the same
- `smallest`: This file is the smallest across all panes
- `largest`: This file is the largest across all panes
- `null`: Only one instance (no comparison)

**Time Comparison**:
- `equal`: All mtimes are within 1 second (filesystem precision)
- `earliest`: This file is the oldest across all panes
- `latest`: This file is the newest across all panes
- `null`: Only one instance (no comparison)

### 3. CSS Class Application

Apply classes from theme.yaml:

```yaml
files:
  compareColors:
    # Filename appearance (existing)
    same: "bg-zinc-100 dark:bg-zinc-800"
    
    # Size comparison (new)
    sizeEqual: "bg-green-100 dark:bg-green-900"
    sizeSmallest: "bg-blue-100 dark:bg-blue-900"
    sizeLargest: "bg-red-100 dark:bg-red-900"
    
    # Time comparison (new)
    timeEqual: "bg-green-100 dark:bg-green-900"
    timeEarliest: "bg-blue-100 dark:bg-blue-900"
    timeLatest: "bg-red-100 dark:bg-red-900"
```

### 4. Toggle Mode

- **Backtick (`)** key toggles comparison mode
- State: `"off" | "name" | "size" | "time"`
- Cycles: off → name → size → time → off
- Only active when 2+ panes exist

### 5. Automatic Rebuild

Comparison index rebuilds automatically:
- When pane content changes (navigation, file ops)
- When panes are added/removed
- Debounced to avoid excessive computation

## Token Coverage [PROC-TOKEN_AUDIT]

Will be annotated with:
- `[IMPL-COMPARISON_COLORS]` in implementation code
- `[ARCH-COMPARISON_COLORING]` in architecture decisions
- `[REQ-FILE_COMPARISON_VISUAL]` in requirements and tests

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-07 | Phase 4 | ✅ Pass | 13 tests passing, production build successful |

## Related Decisions

- **Depends on**: [REQ-CROSS_PANE_COMPARISON], [REQ-MULTI_PANE_LAYOUT]
- **Informs**: [IMPL-COMPARISON_COLORS]
- **See also**: [IMPL-FILES_DATA] (existing comparison index)

---

**Status**: Implemented and validated  
**Created**: 2026-02-07
