# [REQ-LINKED_PANES] Linked Pane Navigation

**Category**: Functional  
**Priority**: P2 (Nice-to-Have)  
**Status**: ✅ Implemented  
**Created**: 2026-02-08  
**Last Updated**: 2026-02-08

---

## Description

The web file manager must support a toggleable "linked" navigation mode where directory navigation in the focused pane propagates to all other panes in the workspace. When enabled and the user navigates into a subdirectory, all other panes that contain a matching subdirectory also navigate to it. When the user navigates to a parent directory (backspace), all panes navigate to their respective parent directories. When linked mode is ON, cursor movements (via mouse clicks or keyboard navigation) synchronize the highlight position across all panes by filename. When linked mode is OFF, cursor movements only affect the focused pane. Sort changes also propagate to all panes when linked mode is ON.

## Rationale

Users comparing similar directory structures (e.g., syncing folder hierarchies, comparing releases, backup verification) benefit from synchronized navigation across panes. Manual navigation in each pane is tedious and error-prone when directory structures mirror each other. Synchronized cursor highlighting provides visual feedback showing matching files across all panes, making comparison tasks more efficient.

## Satisfaction Criteria

- A toggle mechanism (`L` key) enables/disables linked navigation mode.
- **Default state**: Linked mode is enabled by default when the file manager starts (configurable via `layout.defaultLinkedMode` in `config/files.yaml`).
- When disabled, navigation in the focused pane affects only that pane.
- When enabled, entering a subdirectory attempts to navigate all other panes to a matching subdirectory (by name) if it exists in each pane's current path.
- When enabled, navigating to parent directory (backspace) causes all panes to navigate to their respective parent directories.
- When enabled, changing sort order applies the same sort settings (criterion, direction, dirs-first) to all panes.
- When enabled, mouse single-click file selection syncs cursor to same filename in all panes.
- When enabled, keyboard cursor movement (up/down/page/home/end) syncs cursor to same filename in all panes.
- **Scroll-to-center**: When cursor syncs to other panes, those panes automatically scroll to center the highlighted file (smooth scrolling, `block: "center"`).
- **Empty selection**: When a file is selected in one pane but doesn't exist in other panes, those panes clear their selection (cursor set to -1, no file highlighted, footer shows "- / N").
- When disabled, both mouse and keyboard cursor movements only affect the focused pane.
- A visual indicator (🔗 badge in footer) shows when linked mode is ON.
- The mode state is per-session and does not persist across page refreshes.
- When enabled and subdirectory navigation cannot complete in one or more panes (subdirectory missing) but succeeds in at least one pane, linked navigation is automatically disabled with a warning message informing the user of the divergent directory structures.
- The default state is retained when new panes are added (component-level state, not pane-level).

## Validation Criteria

- Unit tests cover cursor synchronization with linked mode ON and OFF.
- Unit tests verify scroll triggering when cursor syncs across panes.
- Unit tests verify empty selection (cursor=-1) when file doesn't exist in linked panes.
- Unit tests verify sort synchronization across all panes when linked.
- Integration tests prove the toggle state affects navigation behavior correctly.
- Integration tests verify auto-disable behavior when subdirectory navigation partially fails.
- Manual verification confirms the visual indicator displays correctly and navigation propagates as expected.
- Manual verification confirms scrolling centers the highlighted file smoothly in linked panes.
- All existing tests still pass (no regressions).

## Traceability

- **Architecture**: See `architecture-decisions.yaml` [ARCH-LINKED_NAV]
- **Implementation**: See `implementation-decisions/IMPL-LINKED_NAV.md`
- **Tests**: `src/app/files/WorkspaceView.test.tsx`
- **Code**: `// [REQ-LINKED_PANES] [IMPL-LINKED_NAV]` in navigation code

## Related Requirements

- **Depends on**: [REQ-MULTI_PANE_LAYOUT], [REQ-DIRECTORY_NAVIGATION]
- **Related to**: [REQ-FILE_COMPARISON_VISUAL], [REQ-ADVANCED_NAV]

---

*Validation Evidence (2026-02-08)*:
- **All 40 tests passing** (38 existing + 2 new scroll/cursor tests)
- **Linter**: 0 errors
- **Type Safety**: Full TypeScript typing
- Config-driven initialization: ✅ Reads `layout.defaultLinkedMode` from config (defaults to true)
- State preservation: ✅ Linked mode state retained when adding new panes
- Cursor synchronization: ✅ Implemented in `WorkspaceView.tsx` `handleCursorMove`
- **Scroll-to-center**: ✅ Implemented with `scrollIntoView({ block: "center", behavior: "smooth" })` in `FilePane.tsx`
- **Empty selection**: ✅ Cursor set to -1 when file doesn't exist, footer shows "- / N"
- **Scroll triggering**: ✅ scrollTriggers state tracks which panes need scrolling
- Parent navigation: ✅ Implemented in `WorkspaceView.tsx` `handleNavigate` 
- Auto-disable on divergence: ✅ Implemented with success/failure tracking
- Sort synchronization: ✅ Implemented in `WorkspaceView.tsx` `handleSortChange`
- Visual indicator: ✅ Badge shows 🔗 L: Linked when mode is ON in footer
- Toggle keystroke: `L` key bound to `link.toggle` action
- Token annotations: `[REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]`

*Last validated: 2026-02-08 by AI agent*
