# [IMPL-COMPARISON_COLORS] CSS Class-Based Comparison Coloring

**Cross-References**: [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Implementation Approach

Implemented enhanced visual comparison system with size/time analysis and theme-configurable CSS classes for cross-pane file comparison.

See `implementation-decisions.yaml` for full details.

## Code Locations

### Comparison Logic Module (Client-Safe)
- **File**: `src/lib/files.comparison.ts` (154 lines)
- **Key functions**:
  - `buildEnhancedComparisonIndex()` - Build comparison index with size/time analysis
  - `analyzeSizes()` - Classify file sizes (equal/smallest/largest)
  - `analyzeTimes()` - Classify modification times (equal/earliest/latest)

### Type Definitions
- **File**: `src/lib/files.types.ts` (enhanced)
- **New types**:
  - `SizeComparison = "equal" | "smallest" | "largest" | null`
  - `TimeComparison = "equal" | "earliest" | "latest" | null`
  - `ComparisonMode = "off" | "name" | "size" | "time"`
  - `EnhancedCompareState extends CompareState`

### UI Integration
- **File**: `src/app/files/WorkspaceView.tsx` (modified)
  - Comparison mode state management
  - Backtick (`) key toggle handler
  - Enhanced comparison index building with useMemo
  - Pass comparison data to FilePane components

- **File**: `src/app/files/components/FilePane.tsx` (modified)
  - `getComparisonClass()` helper function
  - Apply CSS classes based on comparison mode and state
  - Border-left indicators for size/time comparisons

### Configuration
- **File**: `config/theme.yaml` (enhanced)
  - Added size comparison colors (sizeEqual, sizeSmallest, sizeLargest)
  - Added time comparison colors (timeEqual, timeEarliest, timeLatest)
  - Border-left styling for visual differentiation

## Key Components

### 1. Comparison Index Building

**Algorithm**:
1. Build basic index (filename → panes/sizes/mtimes)
2. Filter to shared files only (2+ panes)
3. Analyze sizes: compare all sizes, mark equal/smallest/largest
4. Analyze times: compare timestamps (±1s precision), mark equal/earliest/latest
5. Return Map<filename, Map<paneIndex, EnhancedCompareState>>

**Performance**:
- Runs in O(n × m) where n = number of files, m = number of panes
- Optimized with useMemo to rebuild only when panes change
- Client-side computation for instant feedback

### 2. Comparison Modes

**Toggle Sequence** (backtick key):
- `off` → `name` → `size` → `time` → `off`

**Behavior**:
- `off`: No comparison colors (normal file coloring)
- `name`: Highlight shared filenames (gray background)
- `size`: Color-code by size relationship (green=equal, blue=smallest, red=largest)
- `time`: Color-code by time relationship (green=equal, blue=earliest, red=latest)

**Requirements**:
- Only active with 2+ panes
- Footer shows current mode when active
- Comparison index auto-rebuilds on pane changes

### 3. CSS Class Application

**Size Comparison**:
```
equal: bg-green-50 dark:bg-green-950 border-l-2 border-green-500
smallest: bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500
largest: bg-red-50 dark:bg-red-950 border-l-2 border-red-500
```

**Time Comparison**:
```
equal: bg-green-50 dark:bg-green-950 border-l-2 border-green-500
earliest: bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500
latest: bg-red-50 dark:bg-red-950 border-l-2 border-red-500
```

**Priority**:
1. Comparison colors (when mode active + file shared)
2. Cursor highlight (blue)
3. Mark highlight (yellow)
4. Hover (gray)

## Token Coverage [PROC-TOKEN_AUDIT]

✅ All code annotated with semantic tokens  
✅ Tests reference requirement tokens  
✅ Documentation updated

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-07 | Phase 4 | ✅ Pass | 13 tests passing, production build successful |

**Test File**:
- `src/lib/files.comparison.test.ts` - 13 tests ✅

**Coverage**:
- buildEnhancedComparisonIndex: single pane, no shared files, shared files
- Size comparison: equal, smallest/largest, 3+ panes
- Time comparison: equal, within 1s, earliest/latest, string mtimes, 3+ panes
- Multiple shared files: independent analysis
- Comparison state structure: data integrity

**Production Build**: ✅ Successful  
**Lint**: ✅ 0 errors, 0 warnings

## Architecture Decisions

### Client-Safe Module Separation

**Decision**: Created separate `files.comparison.ts` module without Node.js imports

**Rationale**: `WorkspaceView` is a client component and cannot import server-only modules like `files.data.ts` (which has `fs/promises`). The comparison logic is pure TypeScript and doesn't need Node.js APIs.

**Benefit**: Enables client-side comparison index building for instant visual feedback without server round-trips.

### useMemo for Index Building

**Decision**: Wrap `buildEnhancedComparisonIndex` in `useMemo` with `[panes, comparisonMode]` dependencies

**Rationale**: Comparison index only needs rebuilding when:
- Pane contents change (navigation, file ops)
- Comparison mode changes (off → no computation needed)

**Benefit**: Avoids expensive recomputation on every render.

### Border-Left Indicators

**Decision**: Use colored left border instead of full background for size/time comparison

**Rationale**: 
- Distinguishes comparison from cursor/mark highlighting
- More subtle visual indicator
- Works well with dark mode
- Doesn't obscure text

**Benefit**: Clear visual differentiation without overwhelming the UI.

## Related Decisions

- **Depends on**: [ARCH-COMPARISON_COLORING]
- **See also**: [IMPL-FILES_DATA] (basic comparison index), [IMPL-FILE_PANE]

---

**Status**: Implemented and validated  
**Created**: 2026-02-07
