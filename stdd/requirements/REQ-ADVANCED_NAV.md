# [REQ-ADVANCED_NAV] Advanced Navigation Features

**Category**: Functional  
**Priority**: P1 (Important)  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Description

Users must be able to navigate efficiently beyond basic directory traversal with per-directory cursor position history, bookmark system, goto dialog, and recent directories list. Cursor position is restored when revisiting directories, and parent navigation positions cursor on the previous subdirectory.

## Rationale

Efficient navigation reduces repetitive actions and maintains user context. Directory history prevents disorientation when navigating complex directory trees. Bookmarks enable quick access to frequently used locations. The goto dialog allows direct path entry for power users.

## Satisfaction Criteria

- Cursor position persists per-directory (filename-based restoration)
- Parent navigation (Backspace) positions cursor on previous subdirectory
- Goto dialog (G key) for direct path entry with autocomplete
- Recent directories accessible via Alt+Left/Right navigation
- Bookmark add (B key) and bookmark list (Ctrl+B) display
- Bookmarks stored in localStorage for persistence across sessions
- Home shortcut (~ key) navigates to home directory

## Validation Criteria

- Unit tests: History save/restore, bookmark CRUD operations
- Integration tests: Parent navigation cursor positioning
- localStorage tests: Bookmark persistence across sessions
- Tests reference `[REQ-ADVANCED_NAV]` token

## Traceability

- **Architecture**: [ARCH-DIRECTORY_HISTORY]
- **Implementation**: [IMPL-DIR_HISTORY]
- **Tests**: testAdvancedNav_REQ_ADVANCED_NAV
- **Code**: `// [REQ-ADVANCED_NAV]` in WorkspaceView.tsx

## Related Requirements

- **Depends on**: [REQ-DIRECTORY_NAVIGATION]
- **Related to**: [REQ-FILE_LISTING]
- **Adapted from**: Goful [ARCH-DIRECTORY_HISTORY]

---

*Adapted from*: Goful ARCH-DIRECTORY_HISTORY  
*Translation date*: 2026-02-07  
*Adapted by*: AI Agent
