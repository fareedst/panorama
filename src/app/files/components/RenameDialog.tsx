// [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Rename file dialog
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] Used by file.rename keybinding and context menu

"use client";

import { useState, useEffect, useRef } from "react";

interface RenameDialogProps {
  isOpen: boolean;
  initialName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

/**
 * RenameDialog - Modal for renaming a single file
 * [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]
 */
export default function RenameDialog({
  isOpen,
  initialName,
  onConfirm,
  onClose,
}: RenameDialogProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) {
      onConfirm(trimmed);
      onClose();
    } else if (trimmed === initialName) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Rename
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New name"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Rename
            </button>
          </div>
        </form>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
          Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs">ESC</kbd> to cancel
        </p>
      </div>
    </div>
  );
}
