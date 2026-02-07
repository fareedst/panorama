// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// FinderDialog - Incremental file finder with fuzzy matching
// Triggered by Ctrl+F

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { FileStat } from "@/lib/files.types";
import { filterFiles, SearchHistory, scoreMatch } from "@/lib/files.search";
import type { FilesCopyConfig } from "@/lib/config.types";

interface FinderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FileStat) => void;
  files: FileStat[];
  copy: FilesCopyConfig["search"];
}

/**
 * FinderDialog component - incremental file finder with fuzzy matching
 * [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
 * 
 * Features:
 * - Real-time fuzzy filtering as user types
 * - Search history with dropdown
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Match highlighting
 * - Result count display
 */
export function FinderDialog({
  isOpen,
  onClose,
  onSelect,
  files,
  copy,
}: FinderDialogProps) {
  const [pattern, setPattern] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // [REQ-FILE_SEARCH] Search history manager
  const historyManager = useMemo(() => new SearchHistory("finder"), []);

  // [REQ-FILE_SEARCH] Filter files by pattern
  const filteredFiles = useMemo(() => {
    if (!pattern.trim()) return files;
    const filtered = filterFiles(files, pattern, false);
    // Sort by match score (best matches first)
    return filtered.sort((a, b) => {
      const scoreA = scoreMatch(pattern, a.name);
      const scoreB = scoreMatch(pattern, b.name);
      return scoreB - scoreA;
    });
  }, [files, pattern]);

  // [REQ-FILE_SEARCH] Load search history
  const history = useMemo(() => historyManager.getPatterns(10), [historyManager]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // [REQ-FILE_SEARCH] Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showHistory) {
        // Navigate history dropdown
        setSelectedIndex((prev) => Math.min(prev + 1, history.length - 1));
      } else {
        // Navigate results
        setSelectedIndex((prev) => Math.min(prev + 1, filteredFiles.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showHistory) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showHistory && history.length > 0) {
        // Select from history
        setPattern(history[selectedIndex] || "");
        setShowHistory(false);
        setSelectedIndex(0);
      } else if (filteredFiles.length > 0) {
        // Select file
        const selected = filteredFiles[selectedIndex];
        if (selected) {
          historyManager.add(pattern);
          onSelect(selected);
          onClose();
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Toggle history dropdown
      setShowHistory(!showHistory);
      setSelectedIndex(0);
    }
  };

  // [REQ-FILE_SEARCH] Handle pattern change
  const handlePatternChange = (value: string) => {
    setPattern(value);
    setSelectedIndex(0);
    setShowHistory(false);
  };

  // [REQ-FILE_SEARCH] Highlight matching text
  const highlightMatch = (text: string, pattern: string): React.ReactNode => {
    if (!pattern.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    const index = lowerText.indexOf(lowerPattern);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-400 text-gray-900">
          {text.slice(index, index + pattern.length)}
        </span>
        {text.slice(index + pattern.length)}
      </>
    );
  };

  if (!isOpen) return null;

  const resultsCount = filteredFiles.length;
  const resultsText = (copy?.finderResultsCount || "{count} file(s) found")
    .replace("{count}", String(resultsCount));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="mt-20 w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {copy?.finderTitle || "Find Files"}
          </h2>
        </div>

        {/* Input */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={pattern}
            onChange={(e) => handlePatternChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={copy?.finderPlaceholder || "Type to filter files..."}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          
          {/* Result count */}
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {resultsText}
            {history.length > 0 && (
              <span className="ml-4 text-gray-500">
                Tab: Toggle history ({history.length})
              </span>
            )}
          </div>
        </div>

        {/* Results or History */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto border-t border-gray-200 dark:border-gray-700"
        >
          {showHistory ? (
            // History dropdown
            <div>
              {history.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No search history
                </div>
              ) : (
                history.map((entry, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer px-4 py-2 ${
                      index === selectedIndex
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      setPattern(entry);
                      setShowHistory(false);
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-gray-900 dark:text-white">{entry}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // File results
            <div>
              {resultsCount === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {copy?.finderNoResults || "No matching files"}
                </div>
              ) : (
                filteredFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className={`cursor-pointer px-4 py-2 ${
                      index === selectedIndex
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      historyManager.add(pattern);
                      onSelect(file);
                      onClose();
                    }}
                  >
                    <div className="flex items-center">
                      {file.isDirectory && (
                        <span className="mr-2 text-blue-600 dark:text-blue-400">
                          📁
                        </span>
                      )}
                      <span className="text-gray-900 dark:text-white">
                        {highlightMatch(file.name, pattern)}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {file.isDirectory ? "DIR" : `${(file.size / 1024).toFixed(1)} KB`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
          ↑↓: Navigate • Enter: Select • Esc: Close • Tab: History
        </div>
      </div>
    </div>
  );
}
