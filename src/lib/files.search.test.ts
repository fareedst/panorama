// [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] [TEST-FILE_SEARCH]
// Tests for file search utilities

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  fuzzyMatch,
  filterFiles,
  scoreMatch,
  SearchHistory,
} from "./files.search";
import type { FileStat } from "./files.types";

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up global localStorage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.localStorage = localStorageMock as any;

// ============================================================================
// FUZZY MATCHING TESTS
// ============================================================================

describe("fuzzyMatch [REQ-FILE_SEARCH] [TEST-FILE_SEARCH]", () => {
  it("matches substring case-insensitively", () => {
    expect(fuzzyMatch("test", "MyTestFile.ts")).toBe(true);
    expect(fuzzyMatch("TEST", "MyTestFile.ts")).toBe(true);
    expect(fuzzyMatch("file", "MyTestFile.ts")).toBe(true);
  });

  it("respects case-sensitive flag", () => {
    expect(fuzzyMatch("Test", "test.ts", true)).toBe(false);
    expect(fuzzyMatch("Test", "Test.ts", true)).toBe(true);
  });

  it("handles empty pattern", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
    expect(fuzzyMatch("", "")).toBe(true);
  });

  it("returns false for no match", () => {
    expect(fuzzyMatch("xyz", "abc.ts")).toBe(false);
  });

  it("handles special characters", () => {
    expect(fuzzyMatch("test.ts", "test.ts")).toBe(true);
    expect(fuzzyMatch(".", "file.txt")).toBe(true);
  });
});

// ============================================================================
// FILTER FILES TESTS
// ============================================================================

describe("filterFiles [REQ-FILE_SEARCH] [TEST-FILE_SEARCH]", () => {
  const mockFiles: FileStat[] = [
    {
      name: "test.ts",
      isDirectory: false,
      size: 100,
      modified: new Date(),
      permissions: "rw-r--r--",
    },
    {
      name: "TestFile.tsx",
      isDirectory: false,
      size: 200,
      modified: new Date(),
      permissions: "rw-r--r--",
    },
    {
      name: "example.js",
      isDirectory: false,
      size: 150,
      modified: new Date(),
      permissions: "rw-r--r--",
    },
    {
      name: "docs",
      isDirectory: true,
      size: 0,
      modified: new Date(),
      permissions: "rwxr-xr-x",
    },
  ];

  it("filters files by pattern", () => {
    const result = filterFiles(mockFiles, "test");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("test.ts");
    expect(result[1].name).toBe("TestFile.tsx");
  });

  it("returns all files for empty pattern", () => {
    const result = filterFiles(mockFiles, "");
    expect(result).toHaveLength(4);
  });

  it("returns empty array for no matches", () => {
    const result = filterFiles(mockFiles, "xyz");
    expect(result).toHaveLength(0);
  });

  it("filters directories too", () => {
    const result = filterFiles(mockFiles, "doc");
    expect(result).toHaveLength(1);
    expect(result[0].isDirectory).toBe(true);
  });

  it("handles case-sensitive filtering", () => {
    const result = filterFiles(mockFiles, "Test", true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TestFile.tsx");
  });

  it("trims whitespace from pattern", () => {
    const result = filterFiles(mockFiles, "  test  ");
    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// SCORE MATCH TESTS
// ============================================================================

describe("scoreMatch [REQ-FILE_SEARCH] [TEST-FILE_SEARCH]", () => {
  it("gives perfect score for exact match", () => {
    expect(scoreMatch("test.ts", "test.ts")).toBe(1.0);
  });

  it("gives high score for prefix match", () => {
    expect(scoreMatch("test", "test.ts")).toBe(0.9);
    expect(scoreMatch("my", "myfile.js")).toBe(0.9);
  });

  it("gives medium score for substring match", () => {
    expect(scoreMatch("test", "my_test_file.ts")).toBe(0.5);
  });

  it("gives zero score for no match", () => {
    expect(scoreMatch("xyz", "abc.ts")).toBe(0.0);
  });

  it("is case-insensitive", () => {
    expect(scoreMatch("TEST", "test.ts")).toBe(0.9); // Prefix match
    expect(scoreMatch("Test", "test.ts")).toBe(0.9); // Prefix match
  });
});

// ============================================================================
// SEARCH HISTORY TESTS
// ============================================================================

describe("SearchHistory [REQ-FILE_SEARCH] [TEST-FILE_SEARCH]", () => {
  let history: SearchHistory;
  const storageKey = "files:search:finder:history";

  beforeEach(() => {
    localStorage.clear();
    history = new SearchHistory("finder");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("stores search patterns", () => {
    history.add("test");
    const patterns = history.getPatterns();
    expect(patterns).toContain("test");
  });

  it("stores most recent searches first", () => {
    history.add("first");
    history.add("second");
    history.add("third");
    const patterns = history.getPatterns();
    expect(patterns[0]).toBe("third");
    expect(patterns[1]).toBe("second");
    expect(patterns[2]).toBe("first");
  });

  it("limits history to MAX_HISTORY (20) entries", () => {
    for (let i = 0; i < 30; i++) {
      history.add(`pattern${i}`);
    }
    const all = history.getAll();
    expect(all.length).toBe(20);
    expect(all[0].pattern).toBe("pattern29");
  });

  it("deduplicates entries (keeps most recent)", () => {
    history.add("test");
    history.add("other");
    history.add("test"); // Duplicate
    const patterns = history.getPatterns();
    expect(patterns.filter((p) => p === "test").length).toBe(1);
    expect(patterns[0]).toBe("test"); // Most recent at front
  });

  it("ignores empty patterns", () => {
    history.add("");
    history.add("  ");
    expect(history.getAll()).toHaveLength(0);
  });

  it("stores search options", () => {
    history.add("test", { caseSensitive: true, regex: true });
    const all = history.getAll();
    expect(all[0].options).toEqual({ caseSensitive: true, regex: true });
  });

  it("includes timestamp", () => {
    const before = Date.now();
    history.add("test");
    const after = Date.now();
    const all = history.getAll();
    expect(all[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(all[0].timestamp).toBeLessThanOrEqual(after);
  });

  it("limits returned patterns", () => {
    for (let i = 0; i < 15; i++) {
      history.add(`pattern${i}`);
    }
    const patterns = history.getPatterns(5);
    expect(patterns).toHaveLength(5);
  });

  it("persists across instances", () => {
    history.add("test");
    const newHistory = new SearchHistory("finder");
    expect(newHistory.getPatterns()).toContain("test");
  });

  it("separates finder and content histories", () => {
    const finderHistory = new SearchHistory("finder");
    const contentHistory = new SearchHistory("content");

    finderHistory.add("file-search");
    contentHistory.add("content-search");

    expect(finderHistory.getPatterns()).toEqual(["file-search"]);
    expect(contentHistory.getPatterns()).toEqual(["content-search"]);
  });

  it("clears history", () => {
    history.add("test");
    history.add("other");
    history.clear();
    expect(history.getAll()).toHaveLength(0);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(storageKey, "invalid json {");
    const newHistory = new SearchHistory("finder");
    expect(newHistory.getAll()).toEqual([]);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Search Integration [REQ-FILE_SEARCH] [TEST-FILE_SEARCH]", () => {
  const mockFiles: FileStat[] = [
    {
      name: "component.tsx",
      isDirectory: false,
      size: 500,
      modified: new Date("2024-01-01"),
      permissions: "rw-r--r--",
    },
    {
      name: "component.test.tsx",
      isDirectory: false,
      size: 300,
      modified: new Date("2024-01-02"),
      permissions: "rw-r--r--",
    },
    {
      name: "utils.ts",
      isDirectory: false,
      size: 200,
      modified: new Date("2024-01-03"),
      permissions: "rw-r--r--",
    },
  ];

  it("filters and scores results", () => {
    const filtered = filterFiles(mockFiles, "component");
    expect(filtered).toHaveLength(2);

    // Score results
    const scored = filtered.map((file) => ({
      file,
      score: scoreMatch("component", file.name),
    }));

    // Exact prefix should score highest
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
  });

  it("combines filtering with history", () => {
    const history = new SearchHistory("finder");
    history.add("component");

    const filtered = filterFiles(mockFiles, "component");
    expect(filtered).toHaveLength(2);
    expect(history.getPatterns()[0]).toBe("component");
  });
});
