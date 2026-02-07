// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// SearchDialog - Content search within files
// Triggered by Ctrl+Shift+F

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { searchContent, SearchHistory } from "@/lib/files.search";
import type { ContentSearchResponse, SearchOptions } from "@/lib/files.search";
import type { FilesCopyConfig } from "@/lib/config.types";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (path: string, line: number) => void;
  basePath: string;
  copy: FilesCopyConfig["search"];
}

/**
 * SearchDialog component - search file contents with options
 * [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
 * 
 * Features:
 * - Pattern input with history
 * - Options panel (regex, case-sensitive, recursive, file pattern)
 * - Results list with line numbers and content
 * - Loading state with progress
 * - Click to jump to file
 * - Keyboard navigation
 */
export function SearchDialog({
  isOpen,
  onClose,
  onSelectResult,
  basePath,
  copy,
}: SearchDialogProps) {
  const [pattern, setPattern] = useState("");
  const [results, setResults] = useState<ContentSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  // Search options
  const [recursive, setRecursive] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [filePattern, setFilePattern] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // [REQ-FILE_SEARCH] Search history manager
  const historyManager = useMemo(() => new SearchHistory("content"), []);

  // [REQ-FILE_SEARCH] Load search history
  const history = useMemo(() => historyManager.getPatterns(10), [historyManager]);

  // Flatten results for easier navigation
  const flatResults = useMemo(() => {
    if (!results) return [];
    const flat: Array<{ path: string; line: number; content: string; column: number }> = [];
    for (const result of results.results) {
      for (const match of result.matches) {
        flat.push({
          path: result.path,
          line: match.line,
          content: match.content,
          column: match.column,
        });
      }
    }
    return flat;
  }, [results]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // [REQ-FILE_SEARCH] Execute search
  const executeSearch = async () => {
    if (!pattern.trim()) {
      setError("Please enter a search pattern");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedIndex(0);

    try {
      const options: SearchOptions = {
        caseSensitive,
        regex,
        filePattern: filePattern.trim() || undefined,
      };

      const response = await searchContent({
        pattern,
        basePath,
        recursive,
        regex,
        caseSensitive,
        filePattern: filePattern.trim() || undefined,
        maxResults: 1000,
      });

      setResults(response);
      historyManager.add(pattern, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // [REQ-FILE_SEARCH] Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" && !showHistory) {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      // Scroll selected item into view
      if (resultsRef.current) {
        const items = resultsRef.current.querySelectorAll('[data-result-item]');
        items[selectedIndex + 1]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === "ArrowUp" && !showHistory) {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      // Scroll selected item into view
      if (resultsRef.current) {
        const items = resultsRef.current.querySelectorAll('[data-result-item]');
        items[selectedIndex - 1]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showHistory && history.length > 0) {
        // Select from history
        setPattern(history[selectedIndex] || "");
        setShowHistory(false);
        setSelectedIndex(0);
      } else if (flatResults.length > 0 && !loading) {
        // Select result
        const selected = flatResults[selectedIndex];
        if (selected) {
          onSelectResult(selected.path, selected.line);
          onClose();
        }
      } else if (!loading) {
        // Execute search
        executeSearch();
      }
    }
  };

  if (!isOpen) return null;

  const resultsCount = results?.totalMatches || 0;
  const fileCount = results?.results.length || 0;
  const resultsText = (copy?.searchResultsCount || "{count} match(es) in {files} file(s)")
    .replace("{count}", String(resultsCount))
    .replace("{files}", String(fileCount));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="mt-10 w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {copy?.searchTitle || "Search File Contents"}
          </h2>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={copy?.searchPlaceholder || "Search pattern..."}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={executeSearch}
              disabled={loading || !pattern.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {loading ? (copy?.searchInProgress || "Searching...") : (copy?.searchButton || "Search")}
            </button>
          </div>

          {/* Options */}
          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {copy?.searchOptions || "Options"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  className="mr-2"
                />
                {copy?.searchRecursive || "Recursive"}
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="mr-2"
                />
                {copy?.searchCaseSensitive || "Case Sensitive"}
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={regex}
                  onChange={(e) => setRegex(e.target.checked)}
                  className="mr-2"
                />
                {copy?.searchRegex || "Regular Expression"}
              </label>
              <input
                type="text"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                placeholder={copy?.searchFilePattern || "File Pattern (glob)"}
                className="rounded border border-gray-300 px-2 py-1 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status */}
          {(results || error) && (
            <div className="mt-2 text-sm">
              {error ? (
                <div className="text-red-600 dark:text-red-400">{error}</div>
              ) : results && (
                <div className="text-gray-600 dark:text-gray-400">
                  {resultsText}
                  {results.truncated && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                      (truncated)
                    </span>
                  )}
                  {results.duration && (
                    <span className="ml-2 text-gray-500">
                      ({results.duration}ms)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {history.length > 0 && !results && !loading && (
            <div className="mt-2 text-xs text-gray-500">
              Recent: {history.slice(0, 3).map((h, i) => (
                <button
                  key={i}
                  onClick={() => setPattern(h)}
                  className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto border-t border-gray-200 dark:border-gray-700"
        >
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                {copy?.searchInProgress || "Searching..."}
              </span>
            </div>
          ) : flatResults.length === 0 && results ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {copy?.searchNoResults || "No matches found"}
            </div>
          ) : (
            <div>
              {flatResults.map((result, index) => (
                <div
                  key={`${result.path}-${result.line}-${index}`}
                  data-result-item
                  className={`cursor-pointer border-b border-gray-100 px-4 py-2 dark:border-gray-700 ${
                    index === selectedIndex
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    onSelectResult(result.path, result.line);
                    onClose();
                  }}
                >
                  <div className="mb-1 flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-mono">{result.path}</span>
                    <span className="ml-2">Line {result.line}</span>
                  </div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white">
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
          {results ? "↑↓: Navigate • Enter: Jump to result • " : ""}
          Esc: Close
        </div>
      </div>
    </div>
  );
}
