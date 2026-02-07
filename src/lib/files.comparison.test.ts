// [TEST-FILE_COMPARISON] [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
// Tests for enhanced comparison index with size/time analysis

import { describe, it, expect } from "vitest";
import { buildEnhancedComparisonIndex } from "./files.comparison";
import type { FileStat } from "./files.types";

describe("[TEST-FILE_COMPARISON] buildEnhancedComparisonIndex", () => {
  const createFile = (
    name: string,
    size: number,
    mtime: Date | string
  ): FileStat => ({
    name,
    path: `/test/${name}`,
    isDirectory: false,
    size,
    mtime,
    extension: ".txt",
  });

  it("should return empty map for single pane [REQ-FILE_COMPARISON_VISUAL]", () => {
    const panes = [[createFile("file1.txt", 100, new Date())]];
    
    const result = buildEnhancedComparisonIndex(panes);
    
    expect(result.size).toBe(0); // No shared files
  });

  it("should return empty map when no shared files [REQ-FILE_COMPARISON_VISUAL]", () => {
    const panes = [
      [createFile("file1.txt", 100, new Date())],
      [createFile("file2.txt", 200, new Date())],
    ];
    
    const result = buildEnhancedComparisonIndex(panes);
    
    expect(result.size).toBe(0); // No shared files
  });

  it("should identify shared files across panes [REQ-FILE_COMPARISON_VISUAL]", () => {
    const now = new Date();
    const panes = [
      [createFile("shared.txt", 100, now)],
      [createFile("shared.txt", 100, now)],
    ];
    
    const result = buildEnhancedComparisonIndex(panes);
    
    expect(result.size).toBe(1);
    expect(result.has("shared.txt")).toBe(true);
  });

  describe("size comparison [IMPL-COMPARISON_COLORS]", () => {
    it("should mark equal sizes [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 100, now)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap).toBeDefined();
      expect(fileMap?.get(0)?.sizeComparison[0]).toBe("equal");
      expect(fileMap?.get(1)?.sizeComparison[0]).toBe("equal");
    });

    it("should mark smallest and largest [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 200, now)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.sizeComparison[0]).toBe("smallest");
      expect(fileMap?.get(1)?.sizeComparison[0]).toBe("largest");
    });

    it("should handle 3+ panes [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 200, now)],
        [createFile("file.txt", 300, now)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.sizeComparison[0]).toBe("smallest");
      expect(fileMap?.get(1)?.sizeComparison[0]).toBe(null); // Middle value
      expect(fileMap?.get(2)?.sizeComparison[0]).toBe("largest");
    });
  });

  describe("time comparison [IMPL-COMPARISON_COLORS]", () => {
    it("should mark equal times [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 100, now)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.timeComparison[0]).toBe("equal");
      expect(fileMap?.get(1)?.timeComparison[0]).toBe("equal");
    });

    it("should mark equal times within 1 second [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 500); // 500ms later
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 100, soon)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      // Within 1 second should be considered equal
      expect(fileMap?.get(0)?.timeComparison[0]).toBe("equal");
      expect(fileMap?.get(1)?.timeComparison[0]).toBe("equal");
    });

    it("should mark earliest and latest [REQ-FILE_COMPARISON_VISUAL]", () => {
      const old = new Date("2024-01-01");
      const newer = new Date("2024-01-02");
      const panes = [
        [createFile("file.txt", 100, old)],
        [createFile("file.txt", 100, newer)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.timeComparison[0]).toBe("earliest");
      expect(fileMap?.get(1)?.timeComparison[0]).toBe("latest");
    });

    it("should handle string mtimes (from JSON) [REQ-FILE_COMPARISON_VISUAL]", () => {
      const panes = [
        [createFile("file.txt", 100, "2024-01-01T00:00:00.000Z")],
        [createFile("file.txt", 100, "2024-01-02T00:00:00.000Z")],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.timeComparison[0]).toBe("earliest");
      expect(fileMap?.get(1)?.timeComparison[0]).toBe("latest");
    });

    it("should handle 3+ panes [REQ-FILE_COMPARISON_VISUAL]", () => {
      const old = new Date("2024-01-01");
      const mid = new Date("2024-01-15");
      const newer = new Date("2024-01-31");
      const panes = [
        [createFile("file.txt", 100, old)],
        [createFile("file.txt", 100, mid)],
        [createFile("file.txt", 100, newer)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      
      expect(fileMap?.get(0)?.timeComparison[0]).toBe("earliest");
      expect(fileMap?.get(1)?.timeComparison[0]).toBe(null); // Middle value
      expect(fileMap?.get(2)?.timeComparison[0]).toBe("latest");
    });
  });

  describe("multiple shared files [IMPL-COMPARISON_COLORS]", () => {
    it("should handle multiple shared files independently [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const later = new Date(now.getTime() + 2000);
      const panes = [
        [
          createFile("file1.txt", 100, now),
          createFile("file2.txt", 200, now),
        ],
        [
          createFile("file1.txt", 200, later),
          createFile("file2.txt", 100, later),
        ],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      
      expect(result.size).toBe(2);
      
      const file1 = result.get("file1.txt");
      expect(file1?.get(0)?.sizeComparison[0]).toBe("smallest");
      expect(file1?.get(1)?.sizeComparison[0]).toBe("largest");
      expect(file1?.get(0)?.timeComparison[0]).toBe("earliest");
      expect(file1?.get(1)?.timeComparison[0]).toBe("latest");
      
      const file2 = result.get("file2.txt");
      expect(file2?.get(0)?.sizeComparison[0]).toBe("largest");
      expect(file2?.get(1)?.sizeComparison[0]).toBe("smallest");
      expect(file2?.get(0)?.timeComparison[0]).toBe("earliest");
      expect(file2?.get(1)?.timeComparison[0]).toBe("latest");
    });
  });

  describe("comparison state structure [IMPL-COMPARISON_COLORS]", () => {
    it("should maintain panes, sizes, and mtimes arrays [REQ-FILE_COMPARISON_VISUAL]", () => {
      const now = new Date();
      const panes = [
        [createFile("file.txt", 100, now)],
        [createFile("file.txt", 200, now)],
      ];
      
      const result = buildEnhancedComparisonIndex(panes);
      const fileMap = result.get("file.txt");
      const state = fileMap?.get(0);
      
      expect(state?.panes).toEqual([0, 1]);
      expect(state?.sizes).toEqual([100, 200]);
      expect(state?.mtimes.length).toBe(2);
    });
  });
});
