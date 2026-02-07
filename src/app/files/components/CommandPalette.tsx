// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// Command palette for searching and executing actions via fuzzy search

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  getAllKeybindings,
  formatKeyCombo,
  getCategoryLabel,
  type Keybinding,
} from "@/lib/files.keybinds";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (action: string) => void;
}

/**
 * CommandPalette component for searching and executing actions
 * Triggered by pressing Ctrl+P
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 */
export function CommandPalette({
  isOpen,
  onClose,
  onExecute,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const allKeybindings = getAllKeybindings();

  // Filter keybindings by query (fuzzy substring match)
  const filteredKeybindings = useMemo(() => {
    return allKeybindings.filter((kb) => {
      const searchText =
        `${kb.description} ${kb.action} ${getCategoryLabel(kb.category)}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }, [allKeybindings, query]);

  // Reset selection when filtered results change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (filteredKeybindings.length > 0 && selectedIndex >= filteredKeybindings.length) {
      setSelectedIndex(0);
    }
  }, [filteredKeybindings, selectedIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Focus input and reset when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset query and selection when opening
  // This is intentionally in an effect to reset state when the modal opens
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && filteredKeybindings.length > 0) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex, filteredKeybindings.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle these keys when command palette is open
      if (e.target !== inputRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredKeybindings.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredKeybindings[selectedIndex];
        if (selected) {
          onExecute(selected.action);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    filteredKeybindings,
    selectedIndex,
    onExecute,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Search Input */}
        <div className="border-b border-zinc-200 dark:border-zinc-700 p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="overflow-y-auto max-h-96 divide-y divide-zinc-200 dark:divide-zinc-700"
        >
          {filteredKeybindings.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              {query ? "No actions found" : "Type to search actions..."}
            </div>
          ) : (
            filteredKeybindings.map((kb, index) => (
              <ResultItem
                key={kb.action}
                keybinding={kb}
                isSelected={index === selectedIndex}
                query={query}
                onClick={() => {
                  onExecute(kb.action);
                  onClose();
                }}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {filteredKeybindings.length > 0 && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <div>
              Use{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                ↑↓
              </kbd>{" "}
              to navigate,{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                ↵
              </kbd>{" "}
              to execute
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                Esc
              </kbd>{" "}
              to close
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ResultItem displays a single action result with highlighting
 */
function ResultItem({
  keybinding,
  isSelected,
  query,
  onClick,
}: {
  keybinding: Keybinding;
  isSelected: boolean;
  query: string;
  onClick: () => void;
}) {
  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-600 text-zinc-900 dark:text-zinc-100">
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800 border-l-4 border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Description */}
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {highlightText(keybinding.description, query)}
          </div>
          {/* Category and Action */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
              {getCategoryLabel(keybinding.category)}
            </span>
            <span className="font-mono">{keybinding.action}</span>
          </div>
        </div>
        {/* Keyboard Shortcut */}
        <kbd className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 whitespace-nowrap">
          {formatKeyCombo(keybinding)}
        </kbd>
      </div>
    </div>
  );
}
