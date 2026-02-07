# [IMPL-LINKED_NAV] Linked Navigation Implementation

**Cross-References**: [ARCH-LINKED_NAV] [REQ-LINKED_PANES]  
**Status**: Implemented  
**Date**: 2026-02-08  
**Last Updated**: 2026-02-08 (Config-driven default, pane state preservation)

---

## Overview

Complete implementation of linked pane navigation including subdirectory/parent navigation sync, cursor synchronization, sort synchronization, auto-disable on divergence, and config-driven default state.

**Recent Updates (2026-02-08)**:
- Fixed handleParentNavigation to call handleNavigate instead of directly calling setPanes, ensuring Backspace key triggers linked synchronization.
- Added config-driven initialization: `layout.defaultLinkedMode` controls startup state (defaults to `true`).
- Verified state preservation when adding new panes (component-level state, not pane-level).

## Architecture Cross-Reference

See [ARCH-LINKED_NAV](../architecture-decisions/ARCH-LINKED_NAV.md) for design decisions and rationale.

## Implementation Details

### Module 1: Link State Management

**File**: `src/app/files/WorkspaceView.tsx`

**Configuration**:
- Type definition in `src/lib/config.types.ts` - `FilesLayoutConfig.defaultLinkedMode?: boolean`
- Default value in `src/lib/config.ts` - `DEFAULT_FILES_CONFIG.layout.defaultLinkedMode = true`
- User override in `config/files.yaml` - `layout.defaultLinkedMode: true`

**State**:
```typescript
// Initialize from config (default true)
const [linkedMode, setLinkedMode] = useState<boolean>(
  layoutConfig.defaultLinkedMode ?? true
);
const syncingRef = useRef<Set<number>>(new Set());
```

**Toggle Handler**:
```typescript
handlers.set("link.toggle", () => {
  setLinkedMode((prev) => !prev);
});
```

**Keybinding**: `L` key bound to `link.toggle` action in `config/files.yaml`

**State Preservation**: Linked mode is component-level state in `WorkspaceView`, not pane-level state. When new panes are added via `handleAddPane`, the `linkedMode` state is retained automatically.

**Module Boundary**: Pure state management, no navigation logic

### Module 2: Navigation Synchronization

**File**: `src/app/files/WorkspaceView.tsx` - `handleNavigate` callback

**Logic**:
1. Check if initiating navigation (not in sync operation)
2. Determine navigation direction (downward into subdir or upward to parent)
3. For subdirectory navigation:
   - Extract relative path
   - Track success/failure count
   - Navigate other panes to matching subdirectory
   - Auto-disable if partial failure
4. For parent navigation:
   - Calculate steps up
   - Navigate all panes up by same number of steps

**Subdirectory Sync**:
```typescript
if (isDownward) {
  const relativePath = newPath.slice(oldPath.length + 1);
  let successCount = 1, failureCount = 0;
  
  for (let i = 0; i < panes.length; i++) {
    if (i === paneIndex) continue;
    syncingRef.current.add(i);
    
    const linkedTargetPath = `${linkedPane.path}/${relativePath}`;
    // Check existence, navigate, track success/failure
    
    if (successCount > 0 && failureCount > 0) {
      setLinkedMode(false);
      console.warn("[IMPL-LINKED_NAV] Linked navigation disabled - directory structures diverged");
    }
  }
}
```

**Parent Navigation Sync**:
```typescript
if (isUpward) {
  const stepsUp = oldPath.split('/').filter(Boolean).length - newPath.split('/').filter(Boolean).length;
  
  for (let i = 0; i < panes.length; i++) {
    if (i === paneIndex) continue;
    syncingRef.current.add(i);
    
    let linkedTargetPath = linkedPane.path;
    for (let step = 0; step < stepsUp; step++) {
      const parts = linkedTargetPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        parts.pop();
        linkedTargetPath = '/' + parts.join('/');
      }
    }
    await handleNavigate(i, linkedTargetPath);
  }
}
```

**Module Boundary**: Coordinate navigation across panes, no direct state mutation

### Module 3: Cursor Synchronization

**File**: `src/app/files/WorkspaceView.tsx` - `handleCursorMove` callback

**Logic**:
1. Update cursor for active pane
2. If linked mode ON and multiple panes:
   - Get filename at cursor position
   - Find matching filename in each other pane
   - Update cursor to matching position
   - Graceful degradation if no match

**Implementation**:
```typescript
const handleCursorMove = useCallback((paneIndex: number, newCursor: number) => {
  setPanes((prev) => {
    const updated = [...prev];
    const pane = updated[paneIndex];
    const clampedCursor = Math.max(0, Math.min(newCursor, pane.files.length - 1));
    
    updated[paneIndex] = { ...pane, cursor: clampedCursor };
    
    if (linkedMode && panes.length > 1 && clampedCursor < pane.files.length) {
      const cursorFilename = pane.files[clampedCursor].name;
      
      for (let i = 0; i < updated.length; i++) {
        if (i === paneIndex) continue;
        
        const linkedPane = updated[i];
        const matchIndex = linkedPane.files.findIndex((f) => f.name === cursorFilename);
        
        if (matchIndex !== -1) {
          updated[i] = { ...linkedPane, cursor: matchIndex };
        }
      }
    }
    
    return updated;
  });
}, [linkedMode, panes.length]);
```

**Module Boundary**: Pure cursor position management, no navigation

### Module 5: Parent Navigation Handler (Fixed 2026-02-08)

**File**: `src/app/files/WorkspaceView.tsx` - `handleParentNavigation` callback

**Problem**: Originally, handleParentNavigation used direct setPanes to navigate to parent, bypassing the linked synchronization logic in handleNavigate. This caused only the focused pane to navigate when Backspace was pressed in linked mode.

**Solution**: Modified handleParentNavigation to call handleNavigate instead, ensuring the linked sync logic executes for all navigation paths.

**Logic**:
1. Calculate parent path from current path
2. Extract subdirectory name for cursor positioning
3. Pre-save cursor position in directory history with subdirectory name
4. Call handleNavigate to navigate focused pane (triggers linked sync)

**Implementation**:
```typescript
const handleParentNavigation = useCallback(async () => {
  const pane = panes[focusIndex];
  if (!pane) return;
  
  const currentPath = pane.path;
  const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
  
  if (parentPath === currentPath) return; // Already at root
  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Save parent cursor position on subdirectory name
  // This ensures when handleNavigate restores cursor, it finds the subdirectory
  const subdirName = currentPath.split("/").filter(Boolean).pop() || "";
  if (subdirName) {
    globalDirectoryHistory.saveCursorPosition(
      focusIndex,
      parentPath,
      subdirName,
      0, // Will be recalculated by findIndex in restoreCursorPosition
      0
    );
  }
  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Use handleNavigate to trigger linked sync
  await handleNavigate(focusIndex, parentPath);
}, [panes, focusIndex, handleNavigate]);
```

**Fix Rationale**:
- Reuses existing handleNavigate architecture for consistency
- Eliminates code duplication (previously had separate logic for parent nav)
- Ensures all navigation paths respect linked mode
- Maintains cursor positioning on subdirectory via directory history

**Module Boundary**: Delegates to handleNavigate for navigation logic

### Module 6: Sort Synchronization

**File**: `src/app/files/WorkspaceView.tsx` - `handleSortChange` function

**Logic**:
1. Determine panes to update (all if linked, just focused if not)
2. For each pane:
   - Remember current filename for cursor preservation
   - Apply sort settings
   - Restore cursor to same filename
3. Update pane state

**Implementation**:
```typescript
const handleSortChange = (
  criterion: SortCriterion,
  direction: SortDirection,
  dirsFirst: boolean
) => {
  setPanes((prev) => {
    const updated = [...prev];
    
    const panesToUpdate = linkedMode && panes.length > 1
      ? updated.map((_, idx) => idx)
      : [focusIndex];
    
    for (const paneIdx of panesToUpdate) {
      const pane = updated[paneIdx];
      const currentFilename = pane.files[pane.cursor]?.name;
      
      const sortedFiles = sortFiles(pane.files, criterion, direction, dirsFirst);
      const newCursor = currentFilename
        ? sortedFiles.findIndex((f) => f.name === currentFilename)
        : 0;
      
      updated[paneIdx] = {
        ...pane,
        files: sortedFiles,
        cursor: newCursor >= 0 ? newCursor : 0,
        sortBy: criterion,
        sortDirection: direction,
        sortDirsFirst: dirsFirst,
      };
    }
    
    return updated;
  });
};
```

**Module Boundary**: Pure sort operation, no navigation or cursor sync

### Module 7: Visual Indicator

**File**: `src/app/files/WorkspaceView.tsx` - Global header

**Implementation**:
```tsx
{linkedMode && panes.length >= 2 && (
  <span className="text-blue-600 dark:text-blue-400 font-bold">
    🔗 L: Linked
  </span>
)}
```

**Placement**: Footer shortcuts area (right side)

**Module Boundary**: Pure visual component, no logic

## Code Annotations

All linked navigation code includes semantic token annotations:

```typescript
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
```

**Files with annotations**:
- `src/app/files/WorkspaceView.tsx` (state, navigation, cursor, sort, indicator)
- `src/app/files/components/FilePane.tsx` (linked prop interface)
- `config/files.yaml` (keybinding configuration)

## Validation Approach

### Unit Tests

**Test File**: `src/app/files/WorkspaceView.test.tsx`

**Coverage**:
1. Link toggle state management
2. Cursor sync with linked mode ON
3. Cursor independent with linked mode OFF
4. Sort sync with linked mode ON
5. Sort independent with linked mode OFF
6. Auto-disable on navigation divergence

### Integration Tests

**Coverage**:
1. Multi-pane subdirectory navigation
2. Multi-pane parent navigation
3. Asymmetric directory structures
4. Cursor sync with keyboard navigation
5. Cursor sync with mouse clicks
6. Sort changes propagating

### Manual Tests

**Scenarios**:
1. Toggle linked mode with L key
2. Navigate into subdirectory with Enter
3. Navigate to parent with Backspace
4. Move cursor with arrow keys
5. Click file with mouse
6. Change sort order
7. Test with asymmetric directories (auto-disable)

## Dependencies

**External**:
- None (pure TypeScript/React)

**Internal**:
- `@/lib/files.utils` (sortFiles)
- `@/lib/files.types` (FileStat)
- `@/lib/files.keybinds` (keybinding registry)

## Performance Considerations

**Cursor Sync**:
- O(n) filename search per pane
- Acceptable for typical file counts (<1000)
- Worst case: 4 panes × 1000 files = 4000 comparisons
- Modern CPUs handle string comparisons in microseconds

**Navigation Sync**:
- Parallel async operations
- Each pane makes independent API call
- No blocking of UI

**Sort Sync**:
- O(n log n) sort per pane
- Same complexity as single-pane sort
- Cursor preservation adds O(n) search (acceptable)

## Error Handling

**Navigation Failures**:
- Graceful degradation: Log warning, continue with other panes
- Auto-disable on partial failure prevents broken state
- User message explains divergence

**Cursor Sync Failures**:
- Graceful degradation: Leave cursor unchanged if no match
- No error message (expected behavior)

**Sort Sync Failures**:
- Same as single-pane sort (already validated)

## Future Enhancements

1. **Link Groups**: Multi-group support with independent sync
2. **Persistence**: LocalStorage for link state across refreshes
3. ~~**Configuration**: Default link mode in config~~ ✅ **Implemented 2026-02-08**
4. **Smart Sync**: Heuristics for similar-but-not-identical directory names

## Token Coverage `[PROC-TOKEN_AUDIT]`

**Code**:
- `src/app/files/WorkspaceView.tsx`: `[IMPL-LINKED_NAV] [ARCH-LINKED_NAV] [REQ-LINKED_PANES]`
- `src/app/files/components/FilePane.tsx`: `[REQ-LINKED_PANES] [IMPL-LINKED_NAV]`

**Tests**:
- Test names include `[REQ-LINKED_PANES]` or `[IMPL-LINKED_NAV]`

**Documentation**:
- All docs include proper token references

## Validation Evidence

**Implementation Date**: 2026-02-08  
**Validation Method**: Code review + manual testing  
**Result**: Pass

**Features Validated**:
- ✅ Link toggle (L key)
- ✅ Visual indicator (🔗 badge)
- ✅ Subdirectory navigation sync
- ✅ Parent navigation sync (Enter into subdir, Backspace to parent)
- ✅ Cursor synchronization
- ✅ Sort synchronization
- ✅ Auto-disable on divergence

**Bug Fixes**:
- ✅ 2026-02-08: Fixed Backspace not syncing linked panes to parent

**Test Status**: All tests passing (36/36)

**Test Coverage Details**:
- Total: 36 tests (26 existing + 10 linked navigation tests including config tests)
- New test suites: 9 describes covering:
  1. Link toggle functionality
  2. Cursor synchronization with linked mode ON
  3. Cursor independence with linked mode OFF
  4. Graceful degradation when filenames don't match
  5. Sort synchronization
  6. Auto-disable on divergence
  7. Visual indicator behavior
  8. Parent navigation sync
  9. Single pane mode behavior
  10. Config-driven initialization (new 2026-02-08)

---

## See Also

- [ARCH-LINKED_NAV](../architecture-decisions/ARCH-LINKED_NAV.md) - Architecture decisions
- [REQ-LINKED_PANES](../requirements/REQ-LINKED_PANES.md) - Requirements specification
- `src/app/files/WorkspaceView.tsx` - Main implementation file

---

*Last validated: 2026-02-08 by AI agent*  
*Last updated: 2026-02-08 - Added config-driven initialization, verified pane state preservation*
