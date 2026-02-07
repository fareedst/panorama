# ARCH-LINKED_NAV: Linked Pane Navigation Architecture

**STDD Methodology Version**: 1.5.0  
**Status**: Implemented  
**Cross-references**: `[REQ-LINKED_PANES]`

## Overview

Linked pane navigation enables synchronized directory changes, cursor movements, and sort settings across multiple file manager panes. This architecture defines the state management, synchronization logic, auto-disable behavior, and UI indicators for linked navigation mode.

## Rationale

### Why

Comparison tasks require maintaining parallel directory context across panes. A simple toggle-based linked mode with automatic synchronization eliminates manual re-navigation overhead while preserving each pane's independent state (marks, history).

### Problems Solved

1. **State complexity**: Managing linked state without interfering with existing pane state
2. **Synchronization timing**: Ensuring linked panes update together without race conditions
3. **Asymmetric directories**: Handling cases where target subdirectory doesn't exist in linked pane
4. **Visual feedback**: Clear indication of linked state without cluttering UI
5. **Configuration flexibility**: Supporting simple global toggle
6. **Cursor synchronization**: Keeping visual context across panes
7. **Sort synchronization**: Maintaining consistent ordering for comparison tasks
8. **Auto-disable on divergence**: Preventing confusion when structures differ

### Benefits

1. **Simple toggle model**: Boolean `linkedMode` state in WorkspaceView
2. **Automatic propagation**: Navigation, cursor, and sort changes sync automatically
3. **Visual clarity**: 🔗 badge in footer
4. **Minimal state overhead**: Single boolean + sync tracking ref
5. **Backward compatible**: Disabled by default, no impact on existing features
6. **Graceful degradation**: Auto-disable prevents broken sync state

## Decision

### Summary

Add `linkedMode` boolean state to `WorkspaceView` with L key toggle. When enabled, `handleNavigate` automatically navigates all panes, `handleCursorMove` syncs cursor by filename, and `handleSortChange` applies sort to all panes. Auto-disable triggers when subdirectory navigation partially fails.

### Context

- File manager already has multi-pane support (`[IMPL-PANE_MANAGEMENT]`)
- Navigation system is centralized in `handleNavigate` callback
- Cursor management in `handleCursorMove` callback
- Sort management in `handleSortChange` function
- Keybinding system can easily add new action (`link.toggle`)
- Footer already shows session info (can add link badge)

### Technical Approach

#### 1. Link State Management

```typescript
// WorkspaceView.tsx
const [linkedMode, setLinkedMode] = useState<boolean>(false);

// Track panes currently syncing to prevent infinite recursion
const syncingRef = useRef<Set<number>>(new Set());
```

**Implementation**: Simple boolean applies to all panes

**Future Enhancement**: Link groups allow independent synchronization (e.g., panes 0+1 linked, panes 2+3 linked separately)

#### 2. Navigation Synchronization

```typescript
// handleNavigate in WorkspaceView.tsx
if (isInitiatingNavigation && linkedMode && panes.length > 1) {
  // Track success/failure for auto-disable
  let successCount = 1; // Source pane always succeeds
  let failureCount = 0;
  
  // Navigate other panes to matching subdirectory
  for (let i = 0; i < panes.length; i++) {
    if (i === paneIndex) continue;
    
    syncingRef.current.add(i);
    // ... check existence and navigate ...
    
    // Auto-disable if partial failure
    if (successCount > 0 && failureCount > 0) {
      setLinkedMode(false);
      console.warn("[IMPL-LINKED_NAV] Linked navigation disabled - directory structures diverged");
    }
  }
}
```

**Key Design Points**:
- Relative path resolution for subdirectories
- Parent navigation by step count
- Existence check before navigation
- Success/failure tracking for auto-disable
- Sync ref prevents infinite recursion

#### 3. Cursor Synchronization

```typescript
// handleCursorMove in WorkspaceView.tsx
if (linkedMode && panes.length > 1 && clampedCursor < pane.files.length) {
  const cursorFilename = pane.files[clampedCursor].name;
  
  // Sync cursor to matching filename in all other panes
  for (let i = 0; i < updated.length; i++) {
    if (i === paneIndex) continue;
    
    const matchIndex = linkedPane.files.findIndex((f) => f.name === cursorFilename);
    if (matchIndex !== -1) {
      updated[i] = { ...linkedPane, cursor: matchIndex };
    }
  }
}
```

**Benefits**:
- Instant visual feedback across panes
- Filename-based matching survives sort changes
- Graceful degradation (no match = no change)

#### 4. Sort Synchronization

```typescript
// handleSortChange in WorkspaceView.tsx
const panesToUpdate = linkedMode && panes.length > 1
  ? updated.map((_, idx) => idx) // All panes
  : [focusIndex]; // Just focused pane

for (const paneIdx of panesToUpdate) {
  // Apply sort settings to pane
  // Preserve cursor by filename
}
```

**Benefits**:
- Consistent ordering for visual comparison
- Cursor preservation during sort
- Works with all sort criteria (name, size, time, extension)

#### 5. Link Toggle Handler

```typescript
// Action handler for L key
handlers.set("link.toggle", () => {
  setLinkedMode((prev) => !prev);
});
```

**Keybinding Configuration** (`config/files.yaml`):

```yaml
keybindings:
  - key: "l"
    action: "link.toggle"
    description: "Toggle linked pane navigation"
    category: "view-sort"
```

#### 6. Visual Indicator

```tsx
// WorkspaceView.tsx - Link indicator in footer
{linkedMode && panes.length >= 2 && (
  <span className="text-blue-600 dark:text-blue-400 font-bold">
    🔗 L: Linked
  </span>
)}
```

### Alternatives Considered

#### Option 1: Server-side link state

**Pros**:
- Persists across page refreshes
- Centralized state management

**Cons**:
- Network latency on toggle
- Requires session storage or database
- Over-engineered for simple toggle

**Rejected**: Client-side state sufficient; session persistence not required for toggle mode

#### Option 2: Link groups with UI configuration

**Pros**:
- Maximum flexibility (panes 0+1 linked, 2+3 separate)
- Advanced workflows

**Cons**:
- Complex UI for group management
- Increased state complexity
- Unclear use case for most users

**Rejected**: Defer to future enhancement; simple global toggle covers 90% of use cases

#### Option 3: Automatic link detection

**Pros**:
- No manual toggle needed
- "Smart" behavior based on similar paths

**Cons**:
- Unpredictable behavior
- Difficult to disable when not wanted
- Path similarity heuristics unreliable

**Rejected**: Explicit user control (L key toggle) provides predictability

## Implementation Approach

### Completed Features

1. **Link state management** ✅
   - `linkedMode: boolean` state in WorkspaceView
   - Toggle handler in action registry
   - Sync tracking with useRef to prevent recursion

2. **Navigation synchronization** ✅
   - Subdirectory navigation propagates to all panes
   - Parent navigation propagates to all panes
   - Relative path resolution logic
   - Existence checks before navigation

3. **Cursor synchronization** ✅
   - `handleCursorMove` syncs to same filename
   - Graceful degradation when filename not found
   - Works with keyboard and mouse input

4. **Sort synchronization** ✅
   - `handleSortChange` applies to all panes when linked
   - Cursor preservation during sort
   - All sort criteria supported

5. **Auto-disable on divergence** ✅
   - Success/failure tracking during navigation
   - Auto-disable with warning message
   - Prevents broken sync state

6. **Visual indicators** ✅
   - 🔗 L: Linked badge in footer when linked
   - Conditional on 2+ panes

7. **Keybinding integration** ✅
   - `link.toggle` action in keybindings config
   - Handler registered in actionHandlers

### Future Enhancements

1. **Link groups** (Phase 12+)
   - `LinkGroupState` with multiple independent groups
   - UI for configuring group membership
   - Group-aware synchronization

2. **Configuration** (Phase 11+)
   - Default linked mode in `config/files.yaml`
   - Link behavior options (strict/permissive)

3. **Persistence**
   - localStorage for link state across refreshes
   - Per-workspace link state

## Consequences

### Positive

- **Complete feature parity**: Matches Goful linked navigation
- **Simple implementation**: Minimal state, straightforward logic
- **No performance impact**: Synchronization only on user actions
- **Discoverable**: L key in help overlay, visual feedback
- **Flexible**: Easy to extend to link groups later
- **Robust**: Auto-disable prevents confusion

### Negative

- **Asymmetric handling**: Linked panes may diverge if target directories don't match (mitigated by auto-disable)
- **No persistence**: Link state resets on page refresh (acceptable for P2)
- **Global mode**: Cannot link specific pane subsets (future enhancement)

### Mitigations

- **Warning logs**: Console warnings when target directory not found
- **Auto-disable**: Automatic disable with user message on divergence
- **Graceful degradation**: Failed sync doesn't break navigation
- **Future persistence**: Can add localStorage in later phase

## Traceability

### Requirements
- `[REQ-LINKED_PANES]`
- `[REQ-MULTI_PANE_LAYOUT]`
- `[REQ-DIRECTORY_NAVIGATION]`

### Implementation
- `[IMPL-LINKED_NAV]`

### Tests
- `testLinkedPanes_REQ_LINKED_PANES`
- `testLinkedCursorSync_IMPL_LINKED_NAV`
- `testLinkedSortSync_IMPL_LINKED_NAV`
- `testLinkedAutoDisable_IMPL_LINKED_NAV`

### Code Annotations
- `[ARCH-LINKED_NAV]`
- `[REQ-LINKED_PANES]`
- `[IMPL-LINKED_NAV]`

## Related Decisions

### Depends On
- `[ARCH-FILE_MANAGER_HIERARCHY]` - Pane and workspace architecture
- `[ARCH-KEYBIND_SYSTEM]` - Keyboard shortcut system
- `[ARCH-SORT_PIPELINE]` - Sort system

### Informs
- `[IMPL-LINKED_NAV]` - Implementation details

### See Also
- `[ARCH-COMPARISON_INDEX]` - Linked navigation enhances comparison workflows
- `[ARCH-DIRECTORY_HISTORY]` - Independent history per pane preserved

## Metadata

- **Created**: 2026-02-07 by AI Agent
- **Last Updated**: 2026-02-08 by AI Agent (complete implementation with all features)
- **Last Validated**: 2026-02-08 by AI Agent (pass)

