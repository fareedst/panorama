// [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV]
// Bookmark management dialog

"use client";

import { useState, useEffect } from "react";
import { globalBookmarkManager, type Bookmark } from "@/lib/files.bookmarks";

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

/**
 * Bookmark list and management dialog
 * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
 */
export default function BookmarkDialog({
  isOpen,
  onClose,
  onNavigate,
}: BookmarkDialogProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Refresh bookmarks when dialog opens
  // This synchronizes React state with localStorage (external system)
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookmarks(globalBookmarkManager.getAllBookmarks());
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    onNavigate(path);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this bookmark?")) {
      globalBookmarkManager.removeBookmark(id);
      setBookmarks(globalBookmarkManager.getAllBookmarks());
    }
  };

  const handleStartEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      globalBookmarkManager.updateBookmark(id, editLabel.trim());
      setBookmarks(globalBookmarkManager.getAllBookmarks());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Bookmarks
        </h2>

        <div className="flex-1 overflow-y-auto">
          {bookmarks.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
              No bookmarks yet. Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs">B</kbd> to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-2 p-3 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                >
                  <button
                    onClick={() => handleNavigate(bookmark.path)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {editingId === bookmark.id ? (
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => handleSaveEdit(bookmark.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(bookmark.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                          autoFocus
                        />
                      ) : (
                        bookmark.label
                      )}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      {bookmark.path}
                    </div>
                  </button>

                  <button
                    onClick={() => handleStartEdit(bookmark)}
                    className="px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="Edit label"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    title="Remove bookmark"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs">B</kbd> to add • <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs">Ctrl+B</kbd> to list
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
