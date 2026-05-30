// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how — portal FileColumnContextMenu on metadata cell right-click; copy filename, absolute path, or cross-pane paths; disable cross-pane action when no listing matches.

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

export interface FileColumnContextMenuProps {
  x: number;
  y: number;
  file: FileStat;
  /** Workspace pane state listings (`panes[].files`) for cross-pane path resolution */
  paneFilesList: readonly (readonly FileStat[])[];
  onClose: () => void;
  /** Injectable for tests */
  copyText?: (text: string) => Promise<void>;
}

/**
 * [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how — portal-rendered clipboard menu for file column cells; disables cross-pane action when no listing matches basename.
 */
export default function FileColumnContextMenu({
  x,
  y,
  file,
  paneFilesList,
  onClose,
  copyText = copyTextToClipboard,
}: FileColumnContextMenuProps) {
  const menuElementRef = useRef<HTMLDivElement>(null);

  const menuRef = useCallback(
    // FILE_COLUMN_CONTEXT_MENU — viewport clamp keeps menu on-screen
    (node: HTMLDivElement | null) => {
      if (!node) return;
      menuElementRef.current = node;

      const menuRect = node.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10;
      }
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10;
      }

      node.style.left = `${adjustedX}px`;
      node.style.top = `${adjustedY}px`;
    },
    [x, y],
  );

  useEffect(() => {
    // FILE_COLUMN_CONTEXT_MENU — dismiss on outside mousedown
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuElementRef.current &&
        !menuElementRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    // FILE_COLUMN_CONTEXT_MENU — dismiss on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const crossPaneEntries = resolveCrossPanePathsForFilename(
    paneFilesList,
    file.name,
  );
  const crossPaneText = formatCrossPanePathsForClipboard(crossPaneEntries);

  // FILE_COLUMN_CONTEXT_MENU — copy then close menu
  const handleCopy = useCallback(
    async (text: string) => {
      await copyText(text);
      onClose();
    },
    [copyText, onClose],
  );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg min-w-56 py-1"
      style={{ left: `${x}px`, top: `${y}px` }}
      role="menu"
      aria-label="File column clipboard menu"
      data-testid="file-column-context-menu"
    >
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 truncate">
        {file.name}
      </div>

      <button
        type="button"
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
        role="menuitem"
        data-testid="file-column-copy-filename"
        onClick={() => void handleCopy(formatCursorFilenameForClipboard(file))}
      >
        Copy filename
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
        role="menuitem"
        data-testid="file-column-copy-path"
        onClick={() => void handleCopy(formatAbsolutePathForClipboard(file))}
      >
        Copy path
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        role="menuitem"
        data-testid="file-column-copy-cross-pane-paths"
        disabled={crossPaneEntries.length === 0}
        onClick={() => void handleCopy(crossPaneText)}
      >
        Copy paths in all panes
        {crossPaneEntries.length > 0 ? ` (${crossPaneEntries.length})` : ""}
      </button>
    </div>,
    document.body,
  );
}
