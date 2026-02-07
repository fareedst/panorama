// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]
// Tests for filesystem data layer

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FileStat } from "./files.types";

// Mock fs/promises BEFORE importing the module under test
vi.mock("fs/promises", () => {
  return {
    default: {
      readdir: vi.fn(),
      stat: vi.fn(),
      copyFile: vi.fn(),
      rename: vi.fn(),
      rm: vi.fn(),
      unlink: vi.fn(),
    },
  };
});

// Now import using the same pattern as the module under test
import fs from "fs/promises";
import {
  listDirectory,
  getParentDirectory,
  joinPath,
  getFileInfo,
  getUserHomeDirectory,
  copyFile,
  moveFile,
  deleteFile,
  renameFile,
  sortFiles,
  buildComparisonIndex,
} from "./files.data";
import { formatSize } from "./files.utils";

const mockedFs = vi.mocked(fs);

describe("listDirectory [REQ_DIRECTORY_NAVIGATION]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("should list directory contents", async () => {
    // Mock readdir and stat
    mockedFs.readdir.mockResolvedValue([
      { name: "file1.txt", isDirectory: () => false } as never,
      { name: "dir1", isDirectory: () => true } as never,
    ]);
    
    mockedFs.stat
      .mockResolvedValueOnce({
        size: 100,
        mtime: new Date("2024-01-01"),
      } as never)
      .mockResolvedValueOnce({
        size: 0,
        mtime: new Date("2024-01-02"),
      } as never);
    
    const results = await listDirectory("/test");
    
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("file1.txt");
    expect(results[0].isDirectory).toBe(false);
    expect(results[0].extension).toBe(".txt");
    expect(results[1].name).toBe("dir1");
    expect(results[1].isDirectory).toBe(true);
    expect(results[1].extension).toBe("");
  });
  
  it("should return empty array on error", async () => {
    mockedFs.readdir.mockRejectedValue(new Error("Permission denied"));
    
    const results = await listDirectory("/forbidden");
    
    expect(results).toEqual([]);
  });
  
  it("should skip files that cannot be stat'd", async () => {
    mockedFs.readdir.mockResolvedValue([
      { name: "file1.txt", isDirectory: () => false } as never,
      { name: "broken.link", isDirectory: () => false } as never,
    ]);
    
    mockedFs.stat
      .mockResolvedValueOnce({
        size: 100,
        mtime: new Date("2024-01-01"),
      } as never)
      .mockRejectedValueOnce(new Error("Broken symlink"));
    
    const results = await listDirectory("/test");
    
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("file1.txt");
  });
});

describe("getParentDirectory [REQ_DIRECTORY_NAVIGATION]", () => {
  it("should return parent directory", () => {
    expect(getParentDirectory("/home/user/documents")).toBe("/home/user");
    expect(getParentDirectory("/home/user")).toBe("/home");
    expect(getParentDirectory("/home")).toBe("/");
  });
  
  it("should return same path at root", () => {
    const root = getParentDirectory("/");
    expect(root).toBe("/");
  });
});

describe("joinPath [REQ_DIRECTORY_NAVIGATION]", () => {
  it("should join path components", () => {
    const result = joinPath("/home", "user", "documents");
    expect(result).toContain("home");
    expect(result).toContain("user");
    expect(result).toContain("documents");
  });
  
  it("should normalize paths", () => {
    const result = joinPath("/home", "../home", "user");
    expect(result).toContain("home");
    expect(result).toContain("user");
    expect(result).not.toContain("..");
  });
});

describe("getFileInfo [REQ_FILE_LISTING]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("should return file info", async () => {
    mockedFs.stat.mockResolvedValue({
      isDirectory: () => false,
      size: 1024,
      mtime: new Date("2024-01-01"),
    } as never);
    
    const info = await getFileInfo("/test/file.txt");
    
    expect(info).not.toBeNull();
    expect(info?.name).toBe("file.txt");
    expect(info?.isDirectory).toBe(false);
    expect(info?.size).toBe(1024);
    expect(info?.extension).toBe(".txt");
  });
  
  it("should return null for non-existent file", async () => {
    mockedFs.stat.mockRejectedValue(new Error("ENOENT"));
    
    const info = await getFileInfo("/test/nonexistent.txt");
    
    expect(info).toBeNull();
  });
});

describe("getUserHomeDirectory [REQ_DIRECTORY_NAVIGATION]", () => {
  it("should return home directory", () => {
    const home = getUserHomeDirectory();
    expect(home).toBeTruthy();
    expect(typeof home).toBe("string");
  });
});

describe("File Operations [REQ_FILE_OPERATIONS]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("copyFile", () => {
    it("should copy file", async () => {
      mockedFs.copyFile.mockResolvedValue();
      
      await copyFile("/src/file.txt", "/dest/file.txt");
      
      expect(mockedFs.copyFile).toHaveBeenCalledWith(
        "/src/file.txt",
        "/dest/file.txt"
      );
    });
  });
  
  describe("moveFile", () => {
    it("should move file", async () => {
      mockedFs.rename.mockResolvedValue();
      
      await moveFile("/src/file.txt", "/dest/file.txt");
      
      expect(mockedFs.rename).toHaveBeenCalledWith(
        "/src/file.txt",
        "/dest/file.txt"
      );
    });
  });
  
  describe("deleteFile", () => {
    it("should delete regular file", async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => false,
      } as never);
      mockedFs.unlink.mockResolvedValue();
      
      await deleteFile("/test/file.txt");
      
      expect(mockedFs.unlink).toHaveBeenCalledWith("/test/file.txt");
    });
    
    it("should delete directory recursively", async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as never);
      mockedFs.rm.mockResolvedValue();
      
      await deleteFile("/test/dir");
      
      expect(mockedFs.rm).toHaveBeenCalledWith("/test/dir", { recursive: true });
    });
  });
  
  describe("renameFile", () => {
    it("should rename file", async () => {
      mockedFs.rename.mockResolvedValue();
      
      await renameFile("/test/old.txt", "/test/new.txt");
      
      expect(mockedFs.rename).toHaveBeenCalledWith(
        "/test/old.txt",
        "/test/new.txt"
      );
    });
  });
});

describe("sortFiles [REQ_FILE_LISTING]", () => {
  let files: FileStat[];
  
  beforeEach(() => {
    files = [
      {
        name: "zebra.txt",
        path: "/test/zebra.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-03"),
        extension: ".txt",
      },
      {
        name: "alpha.txt",
        path: "/test/alpha.txt",
        isDirectory: false,
        size: 200,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
      {
        name: "beta.md",
        path: "/test/beta.md",
        isDirectory: false,
        size: 150,
        mtime: new Date("2024-01-02"),
        extension: ".md",
      },
      {
        name: "dir1",
        path: "/test/dir1",
        isDirectory: true,
        size: 0,
        mtime: new Date("2024-01-04"),
        extension: "",
      },
    ];
  });
  
  it("should sort by name ascending", () => {
    sortFiles(files, "Name", false);
    expect(files.map((f) => f.name)).toEqual([
      "alpha.txt",
      "beta.md",
      "dir1",
      "zebra.txt",
    ]);
  });
  
  it("should sort by name descending", () => {
    sortFiles(files, "NameRev", false);
    expect(files.map((f) => f.name)).toEqual([
      "zebra.txt",
      "dir1",
      "beta.md",
      "alpha.txt",
    ]);
  });
  
  it("should sort by size ascending", () => {
    sortFiles(files, "Size", false);
    expect(files.map((f) => f.size)).toEqual([0, 100, 150, 200]);
  });
  
  it("should sort by size descending", () => {
    sortFiles(files, "SizeRev", false);
    expect(files.map((f) => f.size)).toEqual([200, 150, 100, 0]);
  });
  
  it("should sort by mtime ascending", () => {
    sortFiles(files, "Mtime", false);
    expect(files.map((f) => f.name)).toEqual([
      "alpha.txt",
      "beta.md",
      "zebra.txt",
      "dir1",
    ]);
  });
  
  it("should sort by mtime descending", () => {
    sortFiles(files, "MtimeRev", false);
    expect(files.map((f) => f.name)).toEqual([
      "dir1",
      "zebra.txt",
      "beta.md",
      "alpha.txt",
    ]);
  });
  
  it("should sort by extension ascending", () => {
    sortFiles(files, "Ext", false);
    expect(files.map((f) => f.extension)).toEqual(["", ".md", ".txt", ".txt"]);
  });
  
  it("should sort by extension descending", () => {
    sortFiles(files, "ExtRev", false);
    expect(files.map((f) => f.extension)).toEqual([".txt", ".txt", ".md", ""]);
  });
  
  it("should prioritize directories when enabled", () => {
    sortFiles(files, "Name", true);
    expect(files[0].isDirectory).toBe(true);
    expect(files.map((f) => f.name)).toEqual([
      "dir1",
      "alpha.txt",
      "beta.md",
      "zebra.txt",
    ]);
  });
});

describe("buildComparisonIndex [REQ_CROSS_PANE_COMPARISON]", () => {
  it("should build comparison index", () => {
    const pane1: FileStat[] = [
      {
        name: "file1.txt",
        path: "/pane1/file1.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
      {
        name: "file2.txt",
        path: "/pane1/file2.txt",
        isDirectory: false,
        size: 200,
        mtime: new Date("2024-01-02"),
        extension: ".txt",
      },
    ];
    
    const pane2: FileStat[] = [
      {
        name: "file1.txt",
        path: "/pane2/file1.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
      {
        name: "file3.txt",
        path: "/pane2/file3.txt",
        isDirectory: false,
        size: 300,
        mtime: new Date("2024-01-03"),
        extension: ".txt",
      },
    ];
    
    const index = buildComparisonIndex([pane1, pane2]);
    
    // file1.txt exists in both panes
    const file1State = index.get(0, "file1.txt");
    expect(file1State).not.toBeNull();
    expect(file1State?.panes).toEqual([0, 1]);
    expect(file1State?.sizes).toEqual([100, 100]);
    
    // file2.txt only in pane1 - should return null
    const file2State = index.get(0, "file2.txt");
    expect(file2State).toBeNull();
    
    // file3.txt only in pane2 - should return null
    const file3State = index.get(1, "file3.txt");
    expect(file3State).toBeNull();
  });
  
  it("should return shared filenames", () => {
    const pane1: FileStat[] = [
      {
        name: "shared.txt",
        path: "/pane1/shared.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
      {
        name: "unique1.txt",
        path: "/pane1/unique1.txt",
        isDirectory: false,
        size: 200,
        mtime: new Date("2024-01-02"),
        extension: ".txt",
      },
    ];
    
    const pane2: FileStat[] = [
      {
        name: "shared.txt",
        path: "/pane2/shared.txt",
        isDirectory: false,
        size: 150,
        mtime: new Date("2024-01-03"),
        extension: ".txt",
      },
    ];
    
    const index = buildComparisonIndex([pane1, pane2]);
    const shared = index.getSharedFilenames();
    
    expect(shared).toEqual(["shared.txt"]);
  });
  
  it("should handle three panes", () => {
    const pane1: FileStat[] = [
      {
        name: "common.txt",
        path: "/pane1/common.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
    ];
    
    const pane2: FileStat[] = [
      {
        name: "common.txt",
        path: "/pane2/common.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
    ];
    
    const pane3: FileStat[] = [
      {
        name: "common.txt",
        path: "/pane3/common.txt",
        isDirectory: false,
        size: 200,
        mtime: new Date("2024-01-02"),
        extension: ".txt",
      },
    ];
    
    const index = buildComparisonIndex([pane1, pane2, pane3]);
    const state = index.get(0, "common.txt");
    
    expect(state).not.toBeNull();
    expect(state?.panes).toEqual([0, 1, 2]);
    expect(state?.sizes).toEqual([100, 100, 200]);
  });
  
  it("should return null for files not in multiple panes", () => {
    const pane1: FileStat[] = [
      {
        name: "unique.txt",
        path: "/pane1/unique.txt",
        isDirectory: false,
        size: 100,
        mtime: new Date("2024-01-01"),
        extension: ".txt",
      },
    ];
    
    const pane2: FileStat[] = [
      {
        name: "other.txt",
        path: "/pane2/other.txt",
        isDirectory: false,
        size: 200,
        mtime: new Date("2024-01-02"),
        extension: ".txt",
      },
    ];
    
    const index = buildComparisonIndex([pane1, pane2]);
    
    // unique.txt only exists in pane 1
    const uniqueState = index.get(0, "unique.txt");
    expect(uniqueState).toBeNull();
  });
});

describe("formatSize [REQ_FILE_LISTING]", () => {
  it("should format bytes", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(100)).toBe("100 B");
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
    expect(formatSize(1048576)).toBe("1.0 MB");
    expect(formatSize(1073741824)).toBe("1.0 GB");
    expect(formatSize(1099511627776)).toBe("1.0 TB");
  });
});

describe("File Operations [REQ_FILE_OPERATIONS]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("copyFile", () => {
    it("should copy file", async () => {
      mockedFs.copyFile.mockResolvedValue();
      
      await copyFile("/src/file.txt", "/dest/file.txt");
      
      expect(mockedFs.copyFile).toHaveBeenCalledWith(
        "/src/file.txt",
        "/dest/file.txt"
      );
    });
  });
  
  describe("moveFile", () => {
    it("should move file", async () => {
      mockedFs.rename.mockResolvedValue();
      
      await moveFile("/src/file.txt", "/dest/file.txt");
      
      expect(mockedFs.rename).toHaveBeenCalledWith(
        "/src/file.txt",
        "/dest/file.txt"
      );
    });
  });
  
  describe("deleteFile", () => {
    it("should delete regular file", async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => false,
      } as never);
      mockedFs.unlink.mockResolvedValue();
      
      await deleteFile("/test/file.txt");
      
      expect(mockedFs.unlink).toHaveBeenCalledWith("/test/file.txt");
    });
    
    it("should delete directory recursively", async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as never);
      mockedFs.rm.mockResolvedValue();
      
      await deleteFile("/test/dir");
      
      expect(mockedFs.rm).toHaveBeenCalledWith("/test/dir", { recursive: true });
    });
  });
  
  describe("renameFile", () => {
    it("should rename file", async () => {
      mockedFs.rename.mockResolvedValue();
      
      await renameFile("/test/old.txt", "/test/new.txt");
      
      expect(mockedFs.rename).toHaveBeenCalledWith(
        "/test/old.txt",
        "/test/new.txt"
      );
    });
  });
});
