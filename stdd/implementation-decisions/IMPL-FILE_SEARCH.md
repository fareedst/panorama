# [IMPL-FILE_SEARCH] File Search Implementation

**Status**: Planned  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07  
**Cross-References**: `[ARCH-SEARCH_ENGINE]`, `[REQ-FILE_SEARCH]`

## Rationale

### Why This Implementation?

Following the hybrid architecture decision (`[ARCH-SEARCH_ENGINE]`), we implement search as separate client-side (file finder) and server-side (content search) modules, with shared search history management.

### Problems Solved

1. **Fast File Navigation**: Fuzzy matching filters files instantly
2. **Content Discovery**: Server-side grep finds text in files
3. **Search Reuse**: History prevents re-typing common patterns
4. **Security**: Server validates all search patterns and paths

### Benefits

- Modular, testable search utilities
- Reusable components for future search features
- Clear separation of concerns (UI vs logic)
- Performance-optimized for common use cases

## Implementation Approach

### Summary

Implement three main modules:
1. **Search Utilities** (`files.search.ts`) - Core search logic and history
2. **File Finder UI** (`FinderDialog.tsx`) - Incremental file search
3. **Content Search** (API + `SearchDialog.tsx`) - Full-text search

### Detailed Implementation

---

## Module 1: Search Utilities (`src/lib/files.search.ts`)

### File Structure

```typescript
// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// File search utilities - fuzzy matching, filtering, history management
// Client-safe module (no Node.js dependencies)

import type { FileStat } from "@/lib/files.types";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchOptions {
  caseSensitive?: boolean;
  regex?: boolean;
  filePattern?: string;  // Glob pattern for filename filtering
}

export interface SearchHistoryEntry {
  pattern: string;
  timestamp: number;
  options?: SearchOptions;
}

export interface ContentSearchRequest {
  pattern: string;
  basePath: string;
  recursive?: boolean;
  regex?: boolean;
  caseSensitive?: boolean;
  filePattern?: string;
  maxResults?: number;
}

export interface ContentSearchMatch {
  line: number;
  content: string;
  column: number;
  length: number;
}

export interface ContentSearchResult {
  path: string;
  matches: ContentSearchMatch[];
}

export interface ContentSearchResponse {
  results: ContentSearchResult[];
  totalMatches: number;
  truncated: boolean;
  duration: number;
}

// ============================================================================
// FUZZY MATCHING
// ============================================================================

/**
 * Simple fuzzy match using substring matching
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH]
 * 
 * @param pattern - Search pattern
 * @param target - String to search in
 * @param caseSensitive - Whether to match case-sensitively
 * @returns true if pattern found in target
 */
export function fuzzyMatch(
  pattern: string,
  target: string,
  caseSensitive = false
): boolean {
  if (!pattern) return true; // Empty pattern matches all
  
  const p = caseSensitive ? pattern : pattern.toLowerCase();
  const t = caseSensitive ? target : target.toLowerCase();
  
  return t.includes(p);
}

/**
 * Filter file list by fuzzy matching against filename
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH]
 * 
 * @param files - Array of files to filter
 * @param pattern - Search pattern
 * @param caseSensitive - Whether to match case-sensitively
 * @returns Filtered array of files
 */
export function filterFiles(
  files: FileStat[],
  pattern: string,
  caseSensitive = false
): FileStat[] {
  if (!pattern.trim()) return files;
  
  return files.filter((file) => fuzzyMatch(pattern, file.name, caseSensitive));
}

/**
 * Score a match for ranking (0-1, higher is better)
 * Future enhancement: can use Levenshtein distance
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH]
 */
export function scoreMatch(pattern: string, target: string): number {
  const p = pattern.toLowerCase();
  const t = target.toLowerCase();
  
  if (t === p) return 1.0; // Exact match
  if (t.startsWith(p)) return 0.9; // Prefix match
  if (t.includes(p)) return 0.5; // Substring match
  return 0.0;
}

// ============================================================================
// SEARCH HISTORY
// ============================================================================

const HISTORY_PREFIX = "files:search:";
const MAX_HISTORY = 20;

/**
 * Search history manager with localStorage persistence
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH]
 */
export class SearchHistory {
  private key: string;

  constructor(type: "finder" | "content") {
    this.key = `${HISTORY_PREFIX}${type}:history`;
  }

  /**
   * Add search to history (most recent first)
   */
  add(pattern: string, options?: SearchOptions): void {
    if (!pattern.trim()) return;

    const history = this.getAll();
    const entry: SearchHistoryEntry = {
      pattern,
      timestamp: Date.now(),
      options,
    };

    // Remove duplicates (keep most recent)
    const filtered = history.filter((e) => e.pattern !== pattern);
    
    // Add to front
    filtered.unshift(entry);

    // Limit to MAX_HISTORY
    const limited = filtered.slice(0, MAX_HISTORY);

    // Save to localStorage
    try {
      localStorage.setItem(this.key, JSON.stringify(limited));
    } catch (e) {
      console.warn(`[IMPL-FILE_SEARCH] Failed to save search history:`, e);
    }
  }

  /**
   * Get all search history (most recent first)
   */
  getAll(): SearchHistoryEntry[] {
    try {
      const json = localStorage.getItem(this.key);
      if (!json) return [];
      return JSON.parse(json);
    } catch (e) {
      console.warn(`[IMPL-FILE_SEARCH] Failed to load search history:`, e);
      return [];
    }
  }

  /**
   * Get recent patterns only (no metadata)
   */
  getPatterns(limit = 10): string[] {
    return this.getAll()
      .slice(0, limit)
      .map((e) => e.pattern);
  }

  /**
   * Clear all history
   */
  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (e) {
      console.warn(`[IMPL-FILE_SEARCH] Failed to clear history:`, e);
    }
  }
}

// ============================================================================
// CONTENT SEARCH API CLIENT
// ============================================================================

/**
 * Search file contents via server API
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH]
 * 
 * @param request - Search parameters
 * @returns Search results
 */
export async function searchContent(
  request: ContentSearchRequest
): Promise<ContentSearchResponse> {
  const response = await fetch("/api/files/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${error}`);
  }

  return response.json();
}
```

### Key Algorithms

**Fuzzy Match**:
- Complexity: O(n) where n = target string length
- Optimized for speed over accuracy
- Future: Can enhance with Levenshtein distance

**Search History**:
- LRU cache with localStorage persistence
- Deduplication keeps most recent entry
- Max 20 entries to prevent bloat

---

## Module 2: File Finder Dialog (`src/app/files/components/FinderDialog.tsx`)

**Dialog state reset**: Parent can pass `key={isOpen ? 'open' : 'closed'}` so the component remounts on open/close, resetting internal state without effect-based setState (avoids react-hooks/set-state-in-effect). Alternatively, reset state in a useEffect when `isOpen` becomes true.

### Component Structure

```typescript
// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// Incremental file finder dialog (Ctrl+F)

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { filterFiles, SearchHistory } from "@/lib/files.search";
import type { FileStat } from "@/lib/files.types";

interface FinderDialogProps {
  isOpen: boolean;
  files: FileStat[];
  currentFile: string | null;
  onSelect: (file: FileStat) => void;
  onClose: () => void;
}

export function FinderDialog({
  isOpen,
  files,
  currentFile,
  onSelect,
  onClose,
}: FinderDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const history = useMemo(() => new SearchHistory("finder"), []);

  // Filter files by query
  const filteredFiles = useMemo(() => {
    return filterFiles(files, query);
  }, [files, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredFiles.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredFiles.length > 0) {
        e.preventDefault();
        history.add(query);
        onSelect(filteredFiles[selectedIndex]);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, selectedIndex, filteredFiles, onSelect, onClose, history]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && filteredFiles.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, filteredFiles]);

  // Load history
  const recentSearches = history.getPatterns(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-2">Find File</h2>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
              setShowHistory(false);
            }}
            onFocus={() => setShowHistory(!query && recentSearches.length > 0)}
            placeholder="Type to search files..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
          
          {/* History dropdown */}
          {showHistory && (
            <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md">
              <div className="text-xs text-gray-500 px-3 py-1">Recent searches</div>
              {recentSearches.map((pattern, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setQuery(pattern);
                    setShowHistory(false);
                    inputRef.current?.focus();
                  }}
                >
                  {pattern}
                </button>
              ))}
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-2">
            {filteredFiles.length} of {files.length} files
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 && query && (
            <div className="p-8 text-center text-gray-500">
              No files match "{query}"
            </div>
          )}
          {filteredFiles.map((file, idx) => (
            <button
              key={file.name}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                idx === selectedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
              }`}
              onClick={() => {
                history.add(query);
                onSelect(file);
                onClose();
              }}
            >
              <div className="flex items-center gap-2">
                <span className={file.isDirectory ? "text-blue-600" : "text-gray-700"}>
                  {file.isDirectory ? "📁" : "📄"}
                </span>
                <span>{file.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500">
          <kbd>↑↓</kbd> Navigate • <kbd>Enter</kbd> Select • <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  );
}
```

---

## Module 3: Content Search API (`src/app/api/files/search/route.ts`)

### Implementation

```typescript
// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// Content search API endpoint

import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { ContentSearchRequest, ContentSearchResponse } from "@/lib/files.search";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RESULTS = 500;
const MAX_MATCHES_PER_FILE = 100;

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const req: ContentSearchRequest = await request.json();
    
    // Validate request
    validateRequest(req);
    
    // Perform search
    const results = await searchFiles(req);
    
    const duration = Date.now() - startTime;
    
    const response: ContentSearchResponse = {
      results: results.slice(0, MAX_RESULTS),
      totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
      truncated: results.length > MAX_RESULTS,
      duration,
    };
    
    logger.info(`[IMPL-FILE_SEARCH] Search completed: pattern="${req.pattern}", results=${results.length}, duration=${duration}ms`);
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error(`[IMPL-FILE_SEARCH] Search failed:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}

function validateRequest(req: ContentSearchRequest): void {
  // Validate pattern
  if (!req.pattern || req.pattern.length === 0) {
    throw new Error("Pattern is required");
  }
  if (req.pattern.length > 500) {
    throw new Error("Pattern too long (max 500 characters)");
  }
  
  // Validate regex (if enabled)
  if (req.regex) {
    try {
      // Check for potentially dangerous regex patterns
      if (/(\*\+|\+\*|\{\d{4,}\}|(\.\*){3,})/.test(req.pattern)) {
        throw new Error("Potentially malicious regex pattern");
      }
      new RegExp(req.pattern);
    } catch (e) {
      throw new Error(`Invalid regex: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  
  // Validate base path
  if (!req.basePath || req.basePath.includes("..")) {
    throw new Error("Invalid base path");
  }
  
  const config = getConfig();
  const rootDir = config.site.rootDirectory || process.cwd();
  const fullPath = path.join(rootDir, req.basePath);
  
  if (!fullPath.startsWith(rootDir)) {
    throw new Error("Path outside root directory");
  }
}

async function searchFiles(req: ContentSearchRequest): Promise<ContentSearchResult[]> {
  const config = getConfig();
  const rootDir = config.site.rootDirectory || process.cwd();
  const fullPath = path.join(rootDir, req.basePath);
  
  const pattern = req.regex
    ? new RegExp(req.pattern, req.caseSensitive ? "" : "i")
    : req.pattern;
  
  const results: ContentSearchResult[] = [];
  
  // Get list of files to search
  const filesToSearch = await collectFiles(fullPath, req.recursive || false, req.filePattern);
  
  // Search files in parallel (limit concurrency)
  const BATCH_SIZE = 10;
  for (let i = 0; i < filesToSearch.length; i += BATCH_SIZE) {
    const batch = filesToSearch.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((file) => searchFile(file, pattern, req.caseSensitive || false, rootDir))
    );
    
    results.push(...batchResults.filter((r) => r.matches.length > 0));
    
    // Stop if we've hit the limit
    if (results.length >= MAX_RESULTS) break;
  }
  
  return results;
}

async function collectFiles(
  dir: string,
  recursive: boolean,
  filePattern?: string
): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        // Skip binary files (simple heuristic)
        if (isBinaryFile(entry.name)) continue;
        
        // Apply file pattern filter if specified
        if (filePattern && !minimatch(entry.name, filePattern)) continue;
        
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function searchFile(
  filePath: string,
  pattern: string | RegExp,
  caseSensitive: boolean,
  rootDir: string
): Promise<ContentSearchResult> {
  const result: ContentSearchResult = {
    path: path.relative(rootDir, filePath),
    matches: [],
  };
  
  try {
    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn(`[IMPL-FILE_SEARCH] Skipping large file: ${filePath} (${stats.size} bytes)`);
      return result;
    }
    
    // Read file
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    // Search each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = findMatches(line, pattern, caseSensitive);
      
      for (const match of matches) {
        result.matches.push({
          line: i + 1, // 1-indexed
          content: line,
          column: match.index,
          length: match.length,
        });
        
        // Limit matches per file
        if (result.matches.length >= MAX_MATCHES_PER_FILE) {
          return result;
        }
      }
    }
  } catch (error) {
    logger.warn(`[IMPL-FILE_SEARCH] Error reading file ${filePath}:`, error);
  }
  
  return result;
}

function findMatches(
  line: string,
  pattern: string | RegExp,
  caseSensitive: boolean
): Array<{ index: number; length: number }> {
  const matches: Array<{ index: number; length: number }> = [];
  
  if (pattern instanceof RegExp) {
    // Regex matching
    const regex = new RegExp(pattern.source, pattern.flags + "g");
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({ index: match.index, length: match[0].length });
    }
  } else {
    // Simple string matching
    const searchStr = caseSensitive ? line : line.toLowerCase();
    const patternStr = caseSensitive ? pattern : pattern.toLowerCase();
    
    let index = 0;
    while ((index = searchStr.indexOf(patternStr, index)) !== -1) {
      matches.push({ index, length: pattern.length });
      index += pattern.length;
    }
  }
  
  return matches;
}

function isBinaryFile(filename: string): boolean {
  const binaryExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".dat",
  ];
  
  return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}
```

---

## Module 4: Search Dialog Component (`src/app/files/components/SearchDialog.tsx`)

Similar structure to `FinderDialog` but with:
- Options panel (regex, case-sensitive, recursive)
- Loading state with progress indicator
- Result list with file/line/content display
- Click to navigate to file

(Full implementation would be ~300 lines, similar pattern to FinderDialog)

---

## Code Locations

### Files to Create

| Path | Description | Estimated Lines |
|------|-------------|----------------|
| `src/lib/files.search.ts` | Search utilities and history | 250 |
| `src/app/files/components/FinderDialog.tsx` | File finder UI | 200 |
| `src/app/api/files/search/route.ts` | Content search API | 300 |
| `src/app/files/components/SearchDialog.tsx` | Content search UI | 300 |
| `src/lib/files.search.test.ts` | Search utilities tests | 200 |
| `src/app/api/files/search/route.test.ts` | API tests | 150 |

### Files to Modify

| Path | Changes | Lines Modified |
|------|---------|----------------|
| `src/app/files/WorkspaceView.tsx` | Add search dialog state and handlers | +50 |
| `config/files.yaml` | Add search keybindings (already has Ctrl+F/Ctrl+Shift+F) | +0 |

---

## Test Coverage

**Test environment**: SearchHistory tests run in Node.js and use a localStorage mock (getItem, setItem, removeItem, clear). Clear storage between tests (e.g. beforeEach/afterEach) to avoid cross-test leakage.

### Unit Tests (`files.search.test.ts`)
```typescript
describe("fuzzyMatch", () => {
  it("matches substring case-insensitively", () => {
    expect(fuzzyMatch("test", "MyTestFile.ts")).toBe(true);
  });
  
  it("respects case-sensitive flag", () => {
    expect(fuzzyMatch("Test", "test.ts", true)).toBe(false);
  });
  
  it("handles empty pattern", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });
});

describe("SearchHistory", () => {
  it("stores recent searches", () => {
    const history = new SearchHistory("finder");
    history.add("test");
    expect(history.getPatterns()).toContain("test");
  });
  
  it("limits to MAX_HISTORY entries", () => {
    const history = new SearchHistory("finder");
    for (let i = 0; i < 30; i++) {
      history.add(`pattern${i}`);
    }
    expect(history.getAll().length).toBe(20);
  });
  
  it("deduplicates entries", () => {
    const history = new SearchHistory("finder");
    history.add("test");
    history.add("other");
    history.add("test"); // Duplicate
    const patterns = history.getPatterns();
    expect(patterns.filter(p => p === "test").length).toBe(1);
  });
});
```

### API Tests (`route.test.ts`)
```typescript
describe("POST /api/files/search", () => {
  it("searches file contents", async () => {
    const response = await POST(
      new Request("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/test",
          recursive: false,
        }),
      })
    );
    expect(response.status).toBe(200);
  });
  
  it("validates regex patterns", async () => {
    const response = await POST(
      new Request("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "(.*)*", // Malicious regex
          basePath: "/test",
          regex: true,
        }),
      })
    );
    expect(response.status).toBe(400);
  });
});
```

---

## Performance Considerations

### File Finder
- Debounce input: 200ms
- Limit displayed results: 100
- Use `useMemo` for filtered list

### Content Search
- Parallel file reading: 10 concurrent
- Skip binary files
- Limit file size: 10MB
- Limit results: 500 total
- Timeout: 30 seconds

---

## Security Considerations

1. **Path Validation**: Prevent directory traversal
2. **Regex Validation**: Prevent ReDoS attacks
3. **File Size Limits**: Prevent memory exhaustion
4. **Result Limits**: Prevent response bloat
5. **Timeout**: Prevent long-running searches

---

**Document Maintained By**: AI Agent  
**STDD Version**: 1.5.0
