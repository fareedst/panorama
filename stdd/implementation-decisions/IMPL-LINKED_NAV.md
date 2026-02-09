# [IMPL-LINKED_NAV] Linked Navigation Implementation

**Cross-References**: [ARCH-LINKED_NAV] [REQ-LINKED_PANES]  
**Status**: Implemented  
**Date**: 2026-02-08  
**Last Updated**: 2026-02-09 (Parent button UI, Root path edge cases)

---

## Overview

Complete implementation of linked pane navigation including subdirectory/parent navigation sync, cursor synchronization with scroll-to-center, empty selection handling, sort synchronization, auto-disable on divergence, and config-driven default state.

**Recent Updates (2026-02-09)**:
- **Parent button**: Added `..` button in each pane header (next to Linked indicator) for mouse-based parent navigation. Visible only when not at root. Clicking triggers `navigateToParent(paneIndex)` which respects linked mode automatically via existing `handleNavigate` logic.
- **Root path edge cases**: When at root (`/`), `oldPath + '/'` is `"//"`, so `newPath.startsWith("//")` is false for paths like `/Users` or `/private`. Fixed by: (1) Treating "navigate to root" as upward when `newPath === '/'` so Backspace from e.g. `/Users` syncs all panes to `/`. (2) Treating "from root to subdir" as downward when `normalizedOld === '/'` and `newPath.startsWith('/') && newPath.length > 1` so Enter on a subdir at root syncs all panes. (3) When at root, `relativePath` must strip only the leading slash: use `newPath.slice(1)` instead of `newPath.slice(oldPath.length + 1)` (which would be `slice(2)` and drop the first character of the segment, e.g. "private" → "rivate").

**Recent Updates (2026-02-08)**:
- Fixed handleParentNavigation to call handleNavigate instead of directly calling setPanes, ensuring Backspace key triggers linked synchronization.
- Added config-driven initialization: `layout.defaultLinkedMode` controls startup state (defaults to `true`).
- Verified state preservation when adding new panes (component-level state, not pane-level).
- **Scroll-to-center**: Added automatic scrolling to center highlighted files in linked panes when cursor syncs.
- **Empty selection**: Cursor set to -1 when file doesn't exist in linked panes (no file highlighted, footer shows "- / N").
- **Scroll triggers**: State mechanism to trigger scroll effects in FilePane components after cursor sync.

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
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track scroll triggers for linked pane synchronization
const [scrollTriggers, setScrollTriggers] = useState<Map<number, number>>(new Map());
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
3. **Root edge cases**: When at root, `oldPath + '/'` is `"//"` so standard checks fail. Treat "navigate to root" as upward; treat "from root to subdir" as downward; when at root use `relativePath = newPath.slice(1)` (strip leading slash only).
4. For subdirectory navigation:
   - Extract relative path (at root: `newPath.slice(1)`; else: `newPath.slice(oldPath.length + 1)`)
   - Track success/failure count
   - Navigate other panes to matching subdirectory
   - Auto-disable if partial failure
5. For parent navigation:
   - Calculate steps up
   - Navigate all panes up by same number of steps (including to `/` when newPath is root)

**Subdirectory Sync**:
```typescript
if (isDownward) {
  const normalizedOld = (oldPath === '' ? '/' : oldPath);
  const relativePath = normalizedOld === '/' ? newPath.slice(1) : newPath.slice(oldPath.length + 1);
  let successCount = 1, failureCount = 0;
  
  for (let i = 0; i < panes.length; i++) {
    if (i === paneIndex) continue;
    syncingRef.current.add(i);
    
    const linkedTargetPath = `${linkedPane.path}/${relativePath}`.replace(/\/+/g, '/');
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

### Module 2.5: Parent Button UI

**File**: `src/app/files/components/FilePane.tsx`

**Purpose**: Provide mouse-based parent navigation that respects linked mode

**Implementation**:
1. **Prop**: `onNavigateParent?: () => void` callback passed from WorkspaceView
2. **Visibility**: Button shown when `path !== '/' && path.split('/').filter(Boolean).length > 0`
3. **Placement**: In pane header after path and Linked indicator: `[path] [Linked?] [..]`
4. **Behavior**: On click, calls `onNavigateParent()` which triggers `navigateToParent(paneIndex)`
5. **Styling**: Subtle gray button with hover effect, accessible with `aria-label="Parent directory"`

**WorkspaceView Integration**:
```typescript
// Refactored parent navigation to accept any pane index
const navigateToParent = useCallback(async (paneIndex: number) => {
  const pane = panes[paneIndex];
  if (!pane) return;
  
  const currentPath = pane.path;
  const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
  if (parentPath === currentPath) return; // Already at root
  
  // Save cursor position for history
  const subdirName = currentPath.split("/").filter(Boolean).pop() || "";
  if (subdirName) {
    globalDirectoryHistory.saveCursorPosition(paneIndex, parentPath, subdirName, 0, 0);
  }
  
  // Use handleNavigate to trigger linked sync
  await handleNavigate(paneIndex, parentPath);
}, [panes, handleNavigate]);

// Pass per-pane callback when rendering FilePane
<FilePane
  onNavigateParent={() => navigateToParent(index)}
  // ... other props
/>
```

**Benefits**:
- Mouse users can navigate up without keyboard (Backspace)
- Clear visual affordance for parent navigation
- Automatically respects linked mode (no special logic needed)
- Consistent with Backspace behavior (same code path)

**Module Boundary**: Pure UI component with callback, no navigation logic

### Module 3: Cursor Synchronization with Scroll-to-Center

**File**: `src/app/files/WorkspaceView.tsx` - `handleCursorMove` callback

**Logic**:
1. Update cursor for active pane
2. If linked mode ON and multiple panes:
   - Get filename at cursor position
   - Track which panes need scrolling (Map of paneIndex → cursor)
   - Find matching filename in each other pane
   - If match found: Update cursor to matching position, add to scroll triggers
   - If no match: Set cursor to -1 (empty selection), no scroll trigger
3. Set scrollTriggers state to trigger scroll effects in FilePane components

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
      
      // Track which panes need scrolling (Map of paneIndex → cursor)
      const triggers = new Map<number, number>();
      
      for (let i = 0; i < updated.length; i++) {
        if (i === paneIndex) continue; // Skip source pane
        
        const linkedPane = updated[i];
        const matchIndex = linkedPane.files.findIndex((f) => f.name === cursorFilename);
        
        if (matchIndex !== -1) {
          // Found matching file, update cursor
          updated[i] = { ...linkedPane, cursor: matchIndex };
          // Track this pane for scrolling
          triggers.set(i, matchIndex);
        } else {
          // File doesn't exist in this pane, clear selection
          updated[i] = { ...linkedPane, cursor: -1 };
          // No scroll trigger for cleared selection
        }
      }
      
      // Trigger scroll effects in other panes (after state update)
      setScrollTriggers(triggers);
    }
    
    return updated;
  });
}, [linkedMode, panes.length]);
```

**Cursor=-1 Convention**: When cursor is set to -1, it indicates "no selection". FilePane components check `cursor >= 0 && index === cursor` for highlighting, so -1 results in no file being highlighted. Footer displays "- / N" instead of "1 / N".

**Scroll Trigger Mechanism**: The scrollTriggers Map is passed to FilePane components as props. When a FilePane receives a scrollTrigger update, it uses useEffect to call scrollIntoView on the target file element.

**Module Boundary**: Pure cursor position management with scroll coordination, no navigation

### Module 4: FilePane Scroll-to-Center

**File**: `src/app/files/components/FilePane.tsx`

**Props Interface**:
```typescript
interface FilePaneProps {
  // ... existing props
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Cursor index to scroll to (undefined means no scroll) */
  scrollTrigger?: number;
}
```

**State and Refs**:
```typescript
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Ref for file list container
const fileListRef = useRef<HTMLDivElement>(null);
```

**Scroll Effect**:
```typescript
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Scroll to cursor when triggered by linked navigation
useEffect(() => {
  // Only scroll if scrollTrigger is defined and valid
  if (scrollTrigger === undefined || scrollTrigger < 0) {
    return;
  }

  // Scroll to the triggered cursor position
  if (fileListRef.current && files.length > 0 && scrollTrigger < files.length) {
    const targetElement = fileListRef.current.children[0]?.children[scrollTrigger] as HTMLElement;
    if (targetElement) {
      targetElement.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }
}, [scrollTrigger, files.length]);
```

**Cursor Highlighting**:
```typescript
// Handle cursor=-1 (no selection)
const isCursor = cursor >= 0 && index === cursor;
```

**Footer Display**:
```typescript
<span>
  {files.length > 0 
    ? cursor >= 0 
      ? `${cursor + 1} / ${files.length}` 
      : `- / ${files.length}` // Show dash for no selection
    : "Empty"
  }
</span>
```

**Module Boundary**: React component with scroll effect, no business logic

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
4. Cursor clearing (cursor=-1) when file doesn't exist in linked pane
5. Scroll triggering when cursor syncs across panes
6. Sort sync with linked mode ON
7. Sort independent with linked mode OFF
8. Auto-disable on navigation divergence

### Integration Tests

**Coverage**:
1. Multi-pane subdirectory navigation
2. Multi-pane parent navigation
3. Asymmetric directory structures
4. Cursor sync with keyboard navigation
5. Cursor sync with mouse clicks
6. Scroll-to-center behavior in non-source panes
7. Empty selection display (footer shows "- / N")
8. Sort changes propagating

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
- ✅ Scroll-to-center in linked panes
- ✅ Empty selection (cursor=-1) when file doesn't exist
- ✅ Sort synchronization
- ✅ Auto-disable on divergence

**Bug Fixes**:
- ✅ 2026-02-08: Fixed Backspace not syncing linked panes to parent
- ✅ 2026-02-09: Fixed linked nav at root: (1) Backspace from one level below root (e.g. `/Users`) now syncs all panes to `/`; (2) Enter on subdir at root now syncs all panes into that subdir; (3) relativePath at root uses `slice(1)` so linked pane gets e.g. `/private` not `/rivate`

**Test Status**: All tests passing (40/40)

**Test Coverage Details**:
- Total: 40 tests (38 existing + 2 new scroll/cursor=-1 tests)
- New test suites: 11 describes covering:
  1. Link toggle functionality
  2. Cursor synchronization with linked mode ON
  3. Cursor independence with linked mode OFF
  4. Graceful degradation when filenames don't match
  5. Cursor clearing when file doesn't exist (NEW)
  6. Scroll triggering in linked panes (NEW)
  7. Sort synchronization
  8. Auto-disable on divergence
  9. Visual indicator behavior
  10. Parent navigation sync
  11. Sync to root when Backspace from one level below root (root edge case)
  12. Sync from root into subdir with correct relativePath (no dropped leading character)
  13. Single pane mode behavior
  14. Config-driven initialization

---

## See Also

- [ARCH-LINKED_NAV](../architecture-decisions/ARCH-LINKED_NAV.md) - Architecture decisions
- [REQ-LINKED_PANES](../requirements/REQ-LINKED_PANES.md) - Requirements specification
- `src/app/files/WorkspaceView.tsx` - Main implementation file

---

*Last validated: 2026-02-09 by AI agent*  
*Last updated: 2026-02-09 - Root path edge cases (navigate to root, from root to subdir, relativePath at root)*
