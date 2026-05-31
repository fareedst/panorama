// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: Top-level Mouse and Touch Interaction Implementation: Mouse and Touch Interaction Implementation
// Context menu component for file operations

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { FileStat } from "@/lib/files.types";
import {
  copyTextToClipboard,
  formatAbsolutePathForClipboard,
  formatCrossPanePathsForClipboard,
  formatCursorFilenameForClipboard,
  resolveCrossPanePathsForFilename,
} from "@/lib/file-column-clipboard";

interface ContextMenuProps {
  /** Click X coordinate */
  x: number;
  /** Click Y coordinate */
  y: number;
  /** File that was right-clicked */
  file: FileStat | null;
  /** Set of marked file names */
  marks: Set<string>;
  /** Handler to close menu */
  onClose: () => void;
  /** Handler for copy operation */
  onCopy?: () => void;
  /** Handler for move operation */
  onMove?: () => void;
  /** Handler for delete operation */
  onDelete?: () => void;
  /** Handler for rename operation (receives the file to rename) */
  onRename?: (file: FileStat) => void;
  /** [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION] Open Set as Base directory dialog */
  onSetBaseDirectory?: () => void;
  /** [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION] Open Touch file dialog */
  onTouch?: () => void;
  /** [REQ-PANE_COMMAND_EXEC] [REQ-MOUSE_INTERACTION] Open Execute file dialog */
  onExecute?: () => void;
  /** [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION] Open Rename Regex dialog */
  onRenameRegex?: () => void;
  /** Workspace pane listings for cross-pane path clipboard actions */
  paneFilesList?: readonly (readonly FileStat[])[];
  /** Injectable clipboard writer for tests */
  copyText?: (text: string) => Promise<void>;
  /** Label for Set as Base directory menu item */
  setBaseDirectoryMenuLabel?: string;
  /** Label for Touch menu item */
  touchMenuLabel?: string;
  /** Label for Execute menu item */
  executeMenuLabel?: string;
  /** Label for Rename Regex menu item */
  renameRegexMenuLabel?: string;
}

/**
 * ContextMenu component - right-click context menu for file operations
 * [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
 */
export default function ContextMenu({
  x,
  y,
  file,
  marks,
  onClose,
  onCopy,
  onMove,
  onDelete,
  onRename,
  onSetBaseDirectory,
  onTouch,
  onExecute,
  onRenameRegex,
  paneFilesList,
  copyText = copyTextToClipboard,
  setBaseDirectoryMenuLabel = "Set as Base directory…",
  touchMenuLabel = "Touch…",
  executeMenuLabel = "Execute…",
  renameRegexMenuLabel = "Rename Regex…",
}: ContextMenuProps) {
  const menuElementRef = useRef<HTMLDivElement>(null);
  
  const menuRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    // Store element for outside-click detection
    menuElementRef.current = node;

    // Calculate position to keep menu on-screen
    const menuRect = node.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would overflow
    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertical position if menu would overflow
    if (y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10;
    }

    // Apply adjusted position directly via style
    node.style.left = `${adjustedX}px`;
    node.style.top = `${adjustedY}px`;
  }, [x, y]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuElementRef.current && !menuElementRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Menu action handler
  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose]
  );

  const handleClipboardCopy = useCallback(
    async (text: string) => {
      await copyText(text);
      onClose();
    },
    [copyText, onClose],
  );

  // Determine operation context (marked files or current file)
  const targetCount = marks.size > 0 ? marks.size : 1;
  const targetLabel =
    marks.size > 0 ? `${marks.size} marked file(s)` : file?.name || "file";

  if (!file) return null;

  const showClipboardSection = marks.size === 0 && paneFilesList !== undefined;
  const crossPaneEntries = showClipboardSection
    ? resolveCrossPanePathsForFilename(paneFilesList, file.name)
    : [];
  const crossPaneText = formatCrossPanePathsForClipboard(crossPaneEntries);
  const hasFileOps = !!(onCopy || onMove || (onRename && file) || onDelete);
  const showSetBaseDirectory =
    file.isDirectory && onSetBaseDirectory !== undefined;

  // Render menu via portal to escape pane overflow
  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg min-w-48 py-1"
      style={{ left: `${x}px`, top: `${y}px` }}
      role="menu"
      aria-label="File operations menu"
    >
      {/* Menu Header */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        {targetLabel}
      </div>

      {/* Copy */}
      {onCopy && (
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(onCopy)}
          role="menuitem"
        >
          <span className="text-sm">📋</span>
          <span>Copy {targetCount > 1 ? `(${targetCount})` : ""}</span>
          <span className="ml-auto text-xs text-gray-500">C</span>
        </button>
      )}

      {/* Move */}
      {onMove && (
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(onMove)}
          role="menuitem"
        >
          <span className="text-sm">✂️</span>
          <span>Move {targetCount > 1 ? `(${targetCount})` : ""}</span>
          <span className="ml-auto text-xs text-gray-500">V</span>
        </button>
      )}

      {/* Rename (only for single file, not marked) [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-MOUSE_INTERACTION] [REQ-FILE_OPERATIONS]: how: ContextMenu calls onRename(file) with right-clicked file; hidden when marks non-empty */}
      {marks.size === 0 && onRename && file && (
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(() => onRename(file))}
          role="menuitem"
        >
          <span className="text-sm">✏️</span>
          <span>Rename</span>
          <span className="ml-auto text-xs text-gray-500">R</span>
        </button>
      )}

      {/* [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION]: Rename Regex… opens Rename Regex dialog */}
      {onRenameRegex && (
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(onRenameRegex)}
          role="menuitem"
          data-testid="rename-regex-menu-item"
        >
          <span className="text-sm">🔤</span>
          <span>{renameRegexMenuLabel}</span>
        </button>
      )}

      {/* [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION]: Touch… opens Touch file dialog */}
      {onTouch && (
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(onTouch)}
          role="menuitem"
          data-testid="touch-file-menu-item"
        >
          <span className="text-sm">🕐</span>
          <span>{touchMenuLabel}</span>
        </button>
      )}

      {/* [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC] [REQ-MOUSE_INTERACTION]: Execute… opens Execute file dialog */}
      {onExecute && (
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          onClick={() => handleAction(onExecute)}
          role="menuitem"
          data-testid="execute-file-menu-item"
        >
          <span className="text-sm">▶️</span>
          <span>{executeMenuLabel}</span>
        </button>
      )}

      {/* Delete */}
      {onDelete && (
        <>
          {(onCopy || onMove || (marks.size === 0 && onRename)) && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2"
            onClick={() => handleAction(onDelete)}
            role="menuitem"
          >
            <span className="text-sm">🗑️</span>
            <span>Delete {targetCount > 1 ? `(${targetCount})` : ""}</span>
            <span className="ml-auto text-xs text-gray-500">D</span>
          </button>
        </>
      )}

      {/* SET_BASE_DIRECTORY_MENU — [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — eighth item on directory rows only; opens Set base directory dialog via onSetBaseDirectory */}
      {showSetBaseDirectory && (
        <>
          {hasFileOps && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleAction(onSetBaseDirectory!)}
            role="menuitem"
            data-testid="set-base-directory-menu-item"
          >
            <span className="text-sm">📂</span>
            <span>{setBaseDirectoryMenuLabel}</span>
          </button>
        </>
      )}

      {/* UNIFIED_ROW_CONTEXT_MENU clipboard section — [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how — copy filename, path, cross-pane paths on row or column right-click */}
      {showClipboardSection && (
        <div data-testid="file-column-context-menu">
          {hasFileOps && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            role="menuitem"
            data-testid="file-column-copy-filename"
            onClick={() => void handleClipboardCopy(formatCursorFilenameForClipboard(file))}
          >
            Copy filename
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            role="menuitem"
            data-testid="file-column-copy-path"
            onClick={() => void handleClipboardCopy(formatAbsolutePathForClipboard(file))}
          >
            Copy path
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
            data-testid="file-column-copy-cross-pane-paths"
            disabled={crossPaneEntries.length === 0}
            onClick={() => void handleClipboardCopy(crossPaneText)}
          >
            Copy paths in all panes
            {crossPaneEntries.length > 0 ? ` (${crossPaneEntries.length})` : ""}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
