// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// Tests for client-safe file utilities

import { describe, test, expect } from "vitest";
import { formatSize, sortFiles, getSortLabel, getSortDirectionSymbol } from "./files.utils";
import type { FileStat } from "./files.types";

// Test [REQ-FILE_LISTING] formatSize function
describe("formatSize - REQ_FILE_LISTING", () => {
  test("formats zero bytes", () => {
    expect(formatSize(0)).toBe("0 B");
  });

  test("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B");
    expect(formatSize(1023)).toBe("1023 B");
  });

  test("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
    expect(formatSize(10240)).toBe("10.0 KB");
  });

  test("formats megabytes", () => {
    expect(formatSize(1048576)).toBe("1.0 MB");
    expect(formatSize(1572864)).toBe("1.5 MB");
  });

  test("formats gigabytes", () => {
    expect(formatSize(1073741824)).toBe("1.0 GB");
    expect(formatSize(2147483648)).toBe("2.0 GB");
  });

  test("formats terabytes", () => {
    expect(formatSize(1099511627776)).toBe("1.0 TB");
  });
});

// Test [REQ-FILE_SORTING_ADVANCED] sortFiles function
describe("sortFiles - REQ_FILE_SORTING_ADVANCED", () => {
  // Helper to create test files
  function createFile(
    name: string,
    size: number,
    mtime: Date | string,
    isDirectory: boolean = false
  ): FileStat {
    const extension = isDirectory ? "" : name.split(".").pop() || "";
    return {
      name,
      path: `/test/${name}`,
      isDirectory,
      size,
      mtime,
      extension: extension === name ? "" : extension,
    };
  }

  const testFiles: FileStat[] = [
    createFile("zebra.txt", 1000, new Date("2024-01-15")),
    createFile("alpha.txt", 500, new Date("2024-02-20")),
    createFile("beta.doc", 2000, new Date("2024-01-10")),
    createFile("gamma.txt", 1500, new Date("2024-03-01")),
    createFile("docs", 0, new Date("2024-02-01"), true),
    createFile("archive", 0, new Date("2024-01-01"), true),
    createFile("file10.txt", 100, new Date("2024-01-01")),
    createFile("file2.txt", 200, new Date("2024-01-02")),
    createFile("noext", 300, new Date("2024-01-03")),
  ];

  describe("sort by name", () => {
    test("sorts alphabetically ascending with dirs first", () => {
      const sorted = sortFiles(testFiles, "name", "asc", true);
      
      // Directories first
      expect(sorted[0].name).toBe("archive");
      expect(sorted[1].name).toBe("docs");
      
      // Then files alphabetically
      expect(sorted[2].name).toBe("alpha.txt");
      expect(sorted[3].name).toBe("beta.doc");
      expect(sorted[4].name).toBe("file2.txt");
      expect(sorted[5].name).toBe("file10.txt"); // natural number sort
      expect(sorted[6].name).toBe("gamma.txt");
      expect(sorted[7].name).toBe("noext");
      expect(sorted[8].name).toBe("zebra.txt");
    });

    test("sorts alphabetically descending with dirs first", () => {
      const sorted = sortFiles(testFiles, "name", "desc", true);
      
      // Directories first (but in reverse order)
      expect(sorted[0].name).toBe("docs");
      expect(sorted[1].name).toBe("archive");
      
      // Then files in reverse
      expect(sorted[2].name).toBe("zebra.txt");
      expect(sorted[8].name).toBe("alpha.txt");
    });

    test("sorts without directory priority", () => {
      const sorted = sortFiles(testFiles, "name", "asc", false);
      
      // All mixed, purely alphabetical
      expect(sorted[0].name).toBe("alpha.txt");
      expect(sorted[1].name).toBe("archive");
      expect(sorted[2].name).toBe("beta.doc");
      expect(sorted[3].name).toBe("docs");
    });

    test("handles natural number sorting", () => {
      const files = [
        createFile("file100.txt", 0, new Date()),
        createFile("file2.txt", 0, new Date()),
        createFile("file10.txt", 0, new Date()),
        createFile("file1.txt", 0, new Date()),
      ];
      
      const sorted = sortFiles(files, "name", "asc", false);
      expect(sorted.map(f => f.name)).toEqual([
        "file1.txt",
        "file2.txt",
        "file10.txt",
        "file100.txt",
      ]);
    });
  });

  describe("sort by size", () => {
    test("sorts by size ascending with dirs first", () => {
      const sorted = sortFiles(testFiles, "size", "asc", true);
      
      // Directories first (both size 0)
      expect(sorted[0].isDirectory).toBe(true);
      expect(sorted[1].isDirectory).toBe(true);
      
      // Then files by size
      expect(sorted[2].size).toBe(100); // file10.txt
      expect(sorted[3].size).toBe(200); // file2.txt
      expect(sorted[4].size).toBe(300); // noext
      expect(sorted[5].size).toBe(500); // alpha.txt
      expect(sorted[6].size).toBe(1000); // zebra.txt
      expect(sorted[7].size).toBe(1500); // gamma.txt
      expect(sorted[8].size).toBe(2000); // beta.doc
    });

    test("sorts by size descending", () => {
      const sorted = sortFiles(testFiles, "size", "desc", true);
      
      // Directories first
      expect(sorted[0].isDirectory).toBe(true);
      expect(sorted[1].isDirectory).toBe(true);
      
      // Files largest to smallest
      expect(sorted[2].size).toBe(2000);
      expect(sorted[8].size).toBe(100);
    });
  });

  describe("sort by modification time", () => {
    test("sorts by mtime ascending with dirs first", () => {
      const sorted = sortFiles(testFiles, "mtime", "asc", true);
      
      // Directories first
      expect(sorted[0].isDirectory).toBe(true);
      expect(sorted[1].isDirectory).toBe(true);
      
      // Files oldest to newest
      expect(sorted[2].name).toBe("file10.txt"); // 2024-01-01
      expect(sorted[3].name).toBe("file2.txt");   // 2024-01-02
      expect(sorted[4].name).toBe("noext");       // 2024-01-03
      expect(sorted[5].name).toBe("beta.doc");    // 2024-01-10
      expect(sorted[6].name).toBe("zebra.txt");   // 2024-01-15
      expect(sorted[7].name).toBe("alpha.txt");   // 2024-02-20
      expect(sorted[8].name).toBe("gamma.txt");   // 2024-03-01
    });

    test("sorts by mtime descending", () => {
      const sorted = sortFiles(testFiles, "mtime", "desc", true);
      
      // Files newest to oldest (after directories)
      expect(sorted[2].name).toBe("gamma.txt");   // 2024-03-01
      expect(sorted[3].name).toBe("alpha.txt");   // 2024-02-20
      expect(sorted[8].name).toBe("file10.txt"); // 2024-01-01
    });

    test("handles string dates (from JSON)", () => {
      const files = [
        createFile("new.txt", 0, "2024-03-01T00:00:00Z"),
        createFile("old.txt", 0, "2024-01-01T00:00:00Z"),
        createFile("mid.txt", 0, "2024-02-01T00:00:00Z"),
      ];
      
      const sorted = sortFiles(files, "mtime", "asc", false);
      expect(sorted.map(f => f.name)).toEqual([
        "old.txt",
        "mid.txt",
        "new.txt",
      ]);
    });
  });

  describe("sort by extension", () => {
    test("sorts by extension ascending with dirs first", () => {
      const sorted = sortFiles(testFiles, "extension", "asc", true);
      
      // Directories first
      expect(sorted[0].isDirectory).toBe(true);
      expect(sorted[1].isDirectory).toBe(true);
      
      // Files without extensions
      expect(sorted[2].name).toBe("noext");
      
      // Then by extension, with name as tiebreaker
      const extensions = sorted.slice(3).map(f => f.extension);
      expect(extensions).toContain("doc");
      expect(extensions).toContain("txt");
    });

    test("uses name as tiebreaker within same extension", () => {
      const files = [
        createFile("zebra.txt", 0, new Date()),
        createFile("alpha.txt", 0, new Date()),
        createFile("beta.txt", 0, new Date()),
      ];
      
      const sorted = sortFiles(files, "extension", "asc", false);
      expect(sorted.map(f => f.name)).toEqual([
        "alpha.txt",
        "beta.txt",
        "zebra.txt",
      ]);
    });

    test("sorts descending", () => {
      const sorted = sortFiles(testFiles, "extension", "desc", true);
      
      // Directories first
      expect(sorted[0].isDirectory).toBe(true);
      
      // Files with extensions before no-extension
      const lastFile = sorted[sorted.length - 1];
      expect(lastFile.extension).toBe("");
    });
  });

  describe("edge cases", () => {
    test("handles empty array", () => {
      const sorted = sortFiles([], "name", "asc", true);
      expect(sorted).toEqual([]);
    });

    test("handles single file", () => {
      const files = [createFile("single.txt", 100, new Date())];
      const sorted = sortFiles(files, "name", "asc", true);
      expect(sorted).toEqual(files);
    });

    test("does not mutate original array", () => {
      const files = [
        createFile("b.txt", 0, new Date()),
        createFile("a.txt", 0, new Date()),
      ];
      const original = [...files];
      
      sortFiles(files, "name", "asc", false);
      
      expect(files).toEqual(original);
    });

    test("handles all directories", () => {
      const files = [
        createFile("docs", 0, new Date(), true),
        createFile("archive", 0, new Date(), true),
      ];
      
      const sorted = sortFiles(files, "name", "asc", true);
      expect(sorted[0].name).toBe("archive");
      expect(sorted[1].name).toBe("docs");
    });

    test("handles all files (no directories)", () => {
      const files = [
        createFile("z.txt", 0, new Date()),
        createFile("a.txt", 0, new Date()),
      ];
      
      const sorted = sortFiles(files, "name", "asc", true);
      expect(sorted[0].name).toBe("a.txt");
      expect(sorted[1].name).toBe("z.txt");
    });
  });
});

// Test [REQ-FILE_SORTING_ADVANCED] helper functions
describe("getSortLabel - REQ_FILE_SORTING_ADVANCED", () => {
  test("returns correct labels", () => {
    expect(getSortLabel("name")).toBe("Name");
    expect(getSortLabel("size")).toBe("Size");
    expect(getSortLabel("mtime")).toBe("Time");
    expect(getSortLabel("extension")).toBe("Extension");
  });
});

describe("getSortDirectionSymbol - REQ_FILE_SORTING_ADVANCED", () => {
  test("returns correct symbols", () => {
    expect(getSortDirectionSymbol("asc")).toBe("↑");
    expect(getSortDirectionSymbol("desc")).toBe("↓");
  });
});
