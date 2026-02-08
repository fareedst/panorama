// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
// Context menu component for file operations

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { FileStat } from "@/lib/files.types";

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

  // Determine operation context (marked files or current file)
  const targetCount = marks.size > 0 ? marks.size : 1;
  const targetLabel =
    marks.size > 0 ? `${marks.size} marked file(s)` : file?.name || "file";

  if (!file) return null;

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

      {/* Rename (only for single file, not marked) */}
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

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

      {/* Delete */}
      {onDelete && (
        <button
          className="w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2"
          onClick={() => handleAction(onDelete)}
          role="menuitem"
        >
          <span className="text-sm">🗑️</span>
          <span>Delete {targetCount > 1 ? `(${targetCount})` : ""}</span>
          <span className="ml-auto text-xs text-gray-500">D</span>
        </button>
      )}
    </div>,
    document.body
  );
}
