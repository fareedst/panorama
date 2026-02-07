# [ARCH-MOUSE_SUPPORT] Mouse and Touch Interaction Architecture

**Status**: Active  
**Cross-References**: REQ-MOUSE_INTERACTION  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Decision Summary

Implement mouse and touch support through React event handlers with a portal-based context menu component, native HTML5 drag-and-drop, and existing browser scroll support.

## Context

The file manager currently supports keyboard-only navigation. Adding mouse support improves accessibility and provides familiar desktop file manager interactions without compromising the keyboard-driven workflow.

## Decision

### Approach

1. **Context Menu**: Portal-rendered menu component positioned at click coordinates
2. **Click Selection**: Existing `onClick` handlers in FilePane (already implemented)
3. **Double-Click**: Existing `onDoubleClick` handlers in FilePane (already implemented)
4. **Drag-and-Drop**: HTML5 drag-and-drop API with custom drag image
5. **Scroll**: Native browser scrolling (no custom implementation needed)

### Key Components

#### ContextMenu Component

```typescript
interface ContextMenuProps {
  x: number; // Click coordinates
  y: number;
  file: FileStat;
  marks: Set<string>;
  onClose: () => void;
  onCopy: () => void;
  onMove: () => void;
  onDelete: () => void;
  onRename: () => void;
}
```

- Portal-rendered to document.body to escape parent overflow
- Position calculated to keep menu on-screen
- Close on outside click or Escape key
- Keyboard navigation within menu (arrow keys, Enter)

#### Drag-and-Drop Implementation

```typescript
// Source pane (draggable files)
<div 
  draggable={true}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>

// Target pane (drop zone)
<div
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
>
```

- Store drag data in `dataTransfer` object
- Use custom drag image with file count badge
- Highlight drop target on drag hover
- Detect Ctrl key for copy vs move

## Rationale

### Why This Approach

- **Portal Pattern**: Context menu must escape pane overflow constraints
- **HTML5 Drag-Drop**: Native browser API provides ghost image and pointer feedback
- **Event Delegation**: Existing React event handlers integrate seamlessly
- **Progressive Enhancement**: Mouse support doesn't break keyboard workflows

### Problems Solved

- Context menu positioning and overflow
- Cross-pane file transfer visualization
- Touch gesture support (HTML5 drag-drop supports touch)
- Accessibility for non-keyboard users

### Benefits

- No external dependencies (native browser APIs)
- Familiar desktop file manager UX
- Works on touch devices (tablets)
- Context menu provides operation discoverability

## Alternatives Considered

### Alternative 1: Third-Party Drag-Drop Library

- **Pros**: Polished DX, handles edge cases
- **Cons**: Extra dependency, bundle size, overkill for simple case
- **Rejected**: HTML5 API sufficient for our needs

### Alternative 2: Custom Context Menu Library

- **Pros**: Advanced features (submenus, icons)
- **Cons**: Dependency, configuration overhead
- **Rejected**: Simple portal component meets all requirements

### Alternative 3: Browser Native Context Menu

- **Pros**: Zero implementation
- **Cons**: Cannot customize items, inconsistent across browsers
- **Rejected**: Need custom file operations, not browser actions

## Implementation Approach

### Phase 1: Verify Existing Mouse Support

1. Audit FilePane for onClick/onDoubleClick (already present)
2. Test click to select and double-click to enter

### Phase 2: Context Menu Component

1. Create ContextMenu component with portal rendering
2. Add right-click handler to FilePane
3. Position menu at click coordinates (with boundary detection)
4. Implement menu close logic (outside click, Escape)
5. Connect menu actions to existing operation handlers

### Phase 3: Drag-and-Drop

1. Add draggable attribute to file rows
2. Implement onDragStart (store file data, create drag image)
3. Implement drop zone (onDragOver, onDrop, visual feedback)
4. Handle drop operation (call existing copy/move logic)
5. Detect modifier keys (Ctrl=copy, default=move)

### Phase 4: Touch Optimization

1. Test on mobile browser (iOS Safari, Android Chrome)
2. Adjust touch target sizes if needed
3. Test long-press context menu

### Phase 5: Testing

1. Unit tests for ContextMenu component
2. Integration tests for drag-drop data flow
3. Manual testing on desktop and tablet

## Lessons Learned

1. **Portal Timing**: Must appendChild drag image before `setDragImage()`, then remove immediately after
2. **Drag Effect**: Must set `dataTransfer.effectAllowed = "copyMove"` to enable Ctrl toggle
3. **Drop Zone**: Must call `preventDefault()` on `onDragOver` to enable drop
4. **Context Menu Focus**: Menu doesn't steal focus from file list (good for keyboard users)
5. **Portal Testing**: Portal-rendered components require querying `document.body` in tests

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari (HTML5 drag-drop support)
- **Mobile**: iOS Safari, Android Chrome (touch events supported)
- **Tablets**: Touch-and-hold for context menu, touch drag for file operations

## Traceability

- **Requirements**: REQ-MOUSE_INTERACTION
- **Implementation**: IMPL-MOUSE_SUPPORT
- **Tests**: testMouseSupport_ARCH_MOUSE_SUPPORT
- **Code**: ARCH-MOUSE_SUPPORT

## Related Decisions

- **Depends On**: ARCH-FILE_MANAGER_HIERARCHY (FilePane structure), ARCH-FILE_OPERATIONS_API (operations to expose)
- **Informs**: IMPL-MOUSE_SUPPORT
- **See Also**: ARCH-KEYBIND_SYSTEM (complementary input method)

---

*Status*: Active - Phase 10 implementation complete  
*Created*: 2026-02-07  
*Last Updated*: 2026-02-07  
*Author*: AI Agent
