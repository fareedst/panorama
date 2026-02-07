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
  filePattern?: string; // Glob pattern for filename filtering
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
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern) return files;

  return files.filter((file) => fuzzyMatch(trimmedPattern, file.name, caseSensitive));
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
    // SSR guard: localStorage only available in browser
    if (typeof window === 'undefined') return;

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
    // SSR guard: localStorage only available in browser
    if (typeof window === 'undefined') return [];
    
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
    // SSR guard: localStorage only available in browser
    if (typeof window === 'undefined') return;
    
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
