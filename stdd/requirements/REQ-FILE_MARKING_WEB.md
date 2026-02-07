# [REQ-FILE_MARKING_WEB] Web-Based File Marking for Batch Operations

**Category**: Functional  
**Priority**: P0 (Critical)  
**Status**: ✅ Active (Implemented)  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07  
**Implemented**: 2026-02-07

---

## Description

Users must be able to mark and unmark individual files within a web-based directory listing for batch operations. Marked files are visually distinguished from unmarked files using checkbox icons and background highlighting. The system must support marking/unmarking individual files, toggling marks on all files, and clearing all marks. Mark state must persist when the directory is re-sorted or refreshed, maintaining marks on the same file names. Marked files participate in batch operations (copy, move, delete) as a group.

This requirement adapts the terminal-based marking system from Goful to work within a React/Next.js web interface, leveraging web-native interactions (checkboxes, mouse clicks) while preserving keyboard-driven workflows.

## Rationale

File management in web interfaces frequently involves operating on multiple files simultaneously. Marking enables users to select arbitrary sets of files for batch operations without requiring consecutive selection or complex Shift+Click patterns. Client-side mark persistence across directory re-reads prevents users from losing their selection when sorting, filtering, or refreshing the view. Visual distinction through checkboxes and background colors provides immediate, clear feedback about which files are selected for operations.

Web-specific considerations:
- **Checkboxes**: More intuitive than asterisk prefixes for web users
- **Background highlighting**: Better visual feedback than color-only indicators
- **Mixed input**: Support both keyboard (Space, Shift+M) and mouse (click checkbox)
- **Client-side state**: Marks stored in React state for instant feedback

## Satisfaction Criteria

- ✅ Users can mark individual files by:
  - Pressing Space key when cursor is on a file
  - Clicking the checkbox icon next to the filename
- ✅ Users can mark all files in current directory with Shift+M keyboard shortcut
- ✅ Users can invert marks (mark unmarked, unmark marked) with Ctrl+M keyboard shortcut
- ✅ Users can clear all marks with Escape key
- ✅ Marked files are visually distinguished:
  - Checkbox icon shows checked state
  - File row has distinct background color (yellow highlight)
  - Unmarked files show unchecked checkbox with default background
- ✅ Mark state persists when the directory is re-sorted (any sort criterion)
- ✅ Mark state persists when the directory is refreshed (reload button/F5)
- ✅ Persistence is name-based: marks follow filenames even if file order changes
- ✅ The pane footer displays the marked file count in format: `[N marked]`
- ✅ Batch operations operate on marked files when marks exist, otherwise on cursor file
- ✅ Mark state is specific to each pane (panes have independent mark sets)

## Validation Criteria

- ✅ Unit tests verify mark/unmark operations on individual files
- ✅ Unit tests verify mark all and invert mark operations
- ✅ Unit tests verify clear marks operation
- ✅ Unit tests verify mark persistence across sort operations
- ✅ Integration tests verify batch operations use marked files when marks exist
- ✅ Integration tests verify batch operations fall back to cursor file when no marks
- ✅ UI tests verify checkbox visual states (checked, unchecked)
- ✅ UI tests verify background color application to marked files
- ✅ UI tests verify footer display of marked count
- ✅ Tests reference `[REQ-FILE_MARKING_WEB]` token
- **Test Results**: 24 tests in WorkspaceView.test.tsx, all passing

## Traceability

- **Architecture**: See `architecture-decisions.md` § Marking State [ARCH-MARKING_STATE]
- **Implementation**: See `implementation-decisions.md` § File Marking [IMPL-FILE_MARKING]
- **Tests**: `src/app/files/WorkspaceView.test.tsx` (24 marking test cases, all passing)
- **Code**:
  - `src/app/files/WorkspaceView.tsx` - Mark state management, handlers, keyboard shortcuts
  - `src/app/files/components/FilePane.tsx` - Checkbox UI, visual marking, footer count

## Implementation Summary

**Completed**: 2026-02-07

### Components Implemented:
1. **State Management** (`WorkspaceView.tsx`):
   - `marks: Set<string>` in PaneState interface
   - Name-based marking for sort persistence
   - Independent mark sets per pane

2. **Mark Operations**:
   - `handleToggleMark()` - Toggle individual file (Space, M keys, checkbox click)
   - `handleMarkAll()` - Mark all files (Shift+M)
   - `handleInvertMarks()` - Invert all marks (Ctrl+M/Cmd+M)
   - `handleClearMarks()` - Clear all marks (Escape)

3. **Visual Feedback** (`FilePane.tsx`):
   - Checkbox icons with checked/unchecked states
   - Yellow background highlight for marked files
   - Footer displays `[N marked]` count

4. **Keyboard Shortcuts**:
   - **M**: Toggle mark on cursor file
   - **Space**: Mark and move cursor down
   - **Shift+M**: Mark all files
   - **Ctrl+M** (Cmd+M): Invert marks
   - **Escape**: Clear all marks

5. **Integration with Bulk Operations**:
   - Operations use marked files when marks exist
   - Falls back to cursor file when no marks
   - Automatic mark clearing after successful operations

### Test Coverage:
- 24 test cases in WorkspaceView.test.tsx
- Tests cover: individual marking, bulk marking, invert, clear, persistence, visual feedback
- All tests passing

## Related Requirements

- **Depends on**: [REQ-FILE_LISTING], [REQ-KEYBOARD_NAVIGATION]
- **Related to**: [REQ-BULK_FILE_OPS], [REQ-CONFIG_DRIVEN_FILE_MANAGER]
- **Adapted from**: Goful [REQ-FILE_MARKING]

---

## Implementation Notes (from Goful Translation)

**Terminal → Web Adaptations**:
1. **Visual Indicators**:
   - Terminal: `*` prefix + color change
   - Web: Checkbox icon + background highlight
   
2. **State Storage**:
   - Terminal: Go struct field `marked bool` in FileStat
   - Web: React state `marks: Set<string>` in PaneState
   
3. **Persistence Strategy**:
   - Both: Name-based (not index-based) to survive sort changes
   - Web: Stored in client-side React state (no server persistence)

4. **Keyboard Shortcuts**:
   - Preserved from Goful: Space (toggle), Shift+M (all), Ctrl+M (invert), Escape (clear)
   - Added: Mouse click on checkbox for web users

5. **Footer Display**:
   - Preserved: `[marked/total]` format
   - Web: Rendered in pane footer component with config-driven styling

**Configuration Integration**:
- Mark checkbox colors: `config/theme.yaml` § file manager → marked file colors
- Keyboard shortcuts: `config/files.yaml` § keybindings → marking shortcuts
- Footer format: `config/files.yaml` § footer → marked count template

---

*Imported from*: Goful `/Users/fareed/Documents/dev/go/goful/stdd/requirements/REQ-FILE_MARKING.md`  
*Translation date*: 2026-02-07  
*Adapted by*: AI Agent
