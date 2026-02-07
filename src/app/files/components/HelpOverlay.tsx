// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Help overlay component showing all keyboard shortcuts organized by category

"use client";

import { useEffect } from "react";
import {
  getAllCategories,
  getKeybindingsByCategory,
  getCategoryLabel,
  formatKeyCombo,
  type KeybindingCategory,
} from "@/lib/files.keybinds";

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * HelpOverlay component displays all keyboard shortcuts organized by category
 * Triggered by pressing the ? key
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  // Close on Escape or ? key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = getAllCategories();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-10rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {categories.map((category) => (
              <CategorySection key={category} category={category} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <div>
            Press{" "}
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs">
              ?
            </kbd>{" "}
            or{" "}
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs">
              Esc
            </kbd>{" "}
            to close
          </div>
          <div>
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs">
              Ctrl+P
            </kbd>{" "}
            for command palette
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CategorySection displays all keybindings for a single category
 */
function CategorySection({ category }: { category: KeybindingCategory }) {
  const keybindings = getKeybindingsByCategory(category);

  if (keybindings.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {getCategoryLabel(category)}
      </h3>
      <div className="space-y-2">
        {keybindings.map((kb) => (
          <div
            key={formatKeyCombo(kb)} // [IMPL-KEYBINDS] Use unique key combo instead of action to support multiple bindings per action
            className="flex items-start justify-between gap-4 py-1"
          >
            <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
              {kb.description}
            </span>
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100 whitespace-nowrap border border-zinc-300 dark:border-zinc-600">
              {formatKeyCombo(kb)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
