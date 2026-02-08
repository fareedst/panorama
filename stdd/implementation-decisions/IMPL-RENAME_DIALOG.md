# IMPL-RENAME_DIALOG: Rename File Dialog and R-Key Handler

**Status**: Active  
**Created**: 2026-02-08  
**Cross-references**: [REQ-KEYBOARD_SHORTCUTS_COMPLETE], [REQ-FILE_OPERATIONS], [REQ-MOUSE_INTERACTION], [ARCH-KEYBIND_SYSTEM], [IMPL-KEYBINDS], [IMPL-MOUSE_SUPPORT]

---

## Summary

Implements the `file.rename` action so that the **R** keystroke and the context menu **Rename** item open a modal dialog and perform a single-file rename via the existing `POST /api/files` `operation: "rename"` API. Fixes the issue where pressing **r** did nothing because the handler was a TODO/no-op.

---

## Problem Addressed

- **Keystroke `r` to rename did nothing**: The keybinding and dispatcher correctly matched **r** to `file.rename` and invoked the handler, but the handler only logged "Rename action not yet implemented" and showed no UI.
- **Context menu Rename** had no handler passed from `WorkspaceView` to `FilePane`, so the Rename menu item did not open any dialog.
- The backend already supported rename (`renameFile` in `files.data.ts`, `operation: "rename"` in `/api/files` route); only the UI and wiring were missing.

---

## Implementation Approach

1. **RenameDialog component** (`src/app/files/components/RenameDialog.tsx`)
   - Modal with title "Rename", single text input (initial value = current file name), Cancel and Rename buttons.
   - Props: `isOpen`, `initialName`, `onConfirm(newName)`, `onClose`.
   - ESC closes; submit calls `onConfirm(trimmed)` and closes (no-op if name unchanged).

2. **WorkspaceView**
   - **State**: `renameDialog: { isOpen, filePath, fileName, paneIndex }`.
   - **handleRenameConfirm(filePath, paneIndex, newName)**: Builds `dest = path.join(path.dirname(filePath), newName)`, closes dialog, `POST /api/files` with `{ operation: "rename", src: filePath, dest }`, then `handleNavigate(paneIndex, dir)` to refresh the pane. On error, `alert` and leave dialog closed.
   - **file.rename action handler**: Gets `file = pane.files[pane.cursor]`; if present, sets `renameDialog` with that file’s path, name, and `focusIndex`.
   - **RenameDialog** rendered with `initialName={renameDialog.fileName}`, `onConfirm` calling `handleRenameConfirm(renameDialog.filePath, renameDialog.paneIndex, newName)`.
   - **FilePane** receives `onRename={(file) => setRenameDialog({ isOpen: true, filePath: file.path, fileName: file.name, paneIndex: index })}` so the context menu opens the dialog for the right-clicked file.

3. **Context menu and FilePane**
   - **onRename** type changed from `() => void` to `(file: FileStat) => void`.
   - **ContextMenu**: Rename button calls `handleAction(() => onRename(file))` so the file under the cursor is passed.
   - **ContextMenu.test.tsx**: Expects `onRename` to be called with `mockFile`.

4. **Footer**
   - Added "R: Rename" hint to the keyboard shortcuts footer.

---

## Traceability

| Kind            | Tokens / locations |
|-----------------|---------------------|
| Requirements    | REQ-KEYBOARD_SHORTCUTS_COMPLETE, REQ-FILE_OPERATIONS, REQ-MOUSE_INTERACTION |
| Architecture    | ARCH-KEYBIND_SYSTEM |
| Implementation  | IMPL-KEYBINDS, IMPL-MOUSE_SUPPORT, IMPL-FILES_API, IMPL-WORKSPACE_VIEW |
| Code            | RenameDialog.tsx, WorkspaceView.tsx (rename state, handler, dialog, onRename), FilePane.tsx, ContextMenu.tsx |
| Tests           | ContextMenu.test.tsx (onRename called with file) |

---

## Related Decisions

- **Depends on**: [IMPL-KEYBINDS], [IMPL-FILES_API], [IMPL-WORKSPACE_VIEW]
- **See also**: [IMPL-MOUSE_SUPPORT], [IMPL-KEYBINDS]
