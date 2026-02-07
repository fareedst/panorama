// [TEST-FILE_SEARCH] [IMPL-FILE_SEARCH] [REQ-FILE_SEARCH]
// Tests for search API route

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import fs from "fs/promises";

// Mock fs/promises
vi.mock("fs/promises");

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Search API Route [TEST-FILE_SEARCH] [REQ-FILE_SEARCH]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Request Validation [IMPL-FILE_SEARCH]", () => {
    it("should reject missing pattern [REQ-FILE_SEARCH]", async () => {
      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("pattern and basePath are required");
    });

    it("should reject missing basePath [REQ-FILE_SEARCH]", async () => {
      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("pattern and basePath are required");
    });

    it("should reject path with directory traversal [REQ-FILE_SEARCH]", async () => {
      // Mock stat to throw error for traversed path
      vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user/../../etc",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Could be 400 (path validation) or 404 (path doesn't exist)
      expect([400, 404]).toContain(response.status);
      expect(data.error).toMatch(/Path traversal not allowed|basePath does not exist/);
    });

    it("should reject non-absolute paths [REQ-FILE_SEARCH]", async () => {
      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "relative/path",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Path must be absolute");
    });

    it("should reject non-existent base path [REQ-FILE_SEARCH]", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/nonexistent",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("basePath does not exist");
    });

    it("should reject file path (not directory) [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => false,
        isFile: () => true,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user/file.txt",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("basePath must be a directory");
    });
  });

  describe("Regex Validation [IMPL-FILE_SEARCH]", () => {
    it("should reject invalid regex pattern [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "[invalid",
          basePath: "/home/user",
          regex: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid regex pattern");
    });

    it("should reject very long regex pattern [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const longPattern = "a".repeat(501);
      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: longPattern,
          basePath: "/home/user",
          regex: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Pattern too long");
    });

    it("should reject dangerous regex patterns (many groups) [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "(a)(b)(c)(d)(e)",  // 5 groups - should trigger the pattern
          basePath: "/home/user",
          regex: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Potentially dangerous regex pattern");
    });
  });

  describe("Search Execution [IMPL-FILE_SEARCH]", () => {
    it("should search files successfully [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file1.txt", isDirectory: () => false, isFile: () => true },
        { name: "file2.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      // Mock file stats for size check
      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never); // basePath check
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never); // file size checks

      // Mock file contents
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce("line 1\ntest line 2\nline 3" as never)
        .mockResolvedValueOnce("line 1\nline 2\ntest line 3" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
          recursive: false,
          maxResults: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalMatches).toBe(2);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].matches).toHaveLength(1);
      expect(data.results[1].matches).toHaveLength(1);
    });

    it("should support case-sensitive search [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      vi.mocked(fs.readFile).mockResolvedValue("Test line\ntest line" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
          caseSensitive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalMatches).toBe(1); // Only lowercase "test" should match
    });

    it("should support regex search [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      vi.mocked(fs.readFile).mockResolvedValue("test123\ntest456\nabc" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test\\d+",
          basePath: "/home/user",
          regex: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalMatches).toBe(2); // test123 and test456
    });

    it("should filter files by pattern [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file1.txt", isDirectory: () => false, isFile: () => true },
        { name: "file2.js", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      vi.mocked(fs.readFile).mockResolvedValue("test content" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
          filePattern: "*.txt",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Only file1.txt should be searched
      expect(data.results).toHaveLength(1);
      expect(data.results[0].path).toContain("file1.txt");
    });

    it("should respect maxResults limit [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      // Multiple files with matches
      const mockDirents = [
        { name: "file1.txt", isDirectory: () => false, isFile: () => true },
        { name: "file2.txt", isDirectory: () => false, isFile: () => true },
        { name: "file3.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never); // basePath
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never); // file stats

      // Each file with many matches (4 lines per file = 12 total lines)
      const fileContent = "test\ntest\ntest\ntest";
      vi.mocked(fs.readFile).mockResolvedValue(fileContent as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
          maxResults: 5, // Limit to 5 matches (will stop at 2nd file)
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalMatches).toBeLessThanOrEqual(5);
      expect(data.truncated).toBe(true);
    });

    it("should skip files larger than 10MB [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "large.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 11 * 1024 * 1024 }; // 11MB
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(0); // File too large, skipped
    });

    it("should handle recursive search [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };

      // Root directory
      const mockRootDirents = [
        { name: "file1.txt", isDirectory: () => false, isFile: () => true },
        { name: "subdir", isDirectory: () => true, isFile: () => false },
      ];

      // Subdirectory
      const mockSubDirents = [
        { name: "file2.txt", isDirectory: () => false, isFile: () => true },
      ];

      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce(mockRootDirents as never)
        .mockResolvedValueOnce(mockSubDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never); // basePath
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never); // file stats

      vi.mocked(fs.readFile).mockResolvedValue("test content" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
          recursive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2); // Both files found
    });
  });

  describe("Error Handling [IMPL-FILE_SEARCH]", () => {
    it("should handle readdir errors gracefully [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);
      vi.mocked(fs.readdir).mockRejectedValue(new Error("Permission denied"));

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(0);
    });

    it("should handle file read errors gracefully [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      vi.mocked(fs.readFile).mockRejectedValue(new Error("Read error"));

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(0); // File couldn't be read, skipped
    });

    it("should return 500 on unexpected errors [REQ-FILE_SEARCH]", async () => {
      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Search failed");
    });
  });

  describe("Response Format [IMPL-FILE_SEARCH]", () => {
    it("should return correct response structure [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

      const mockDirents = [
        { name: "file.txt", isDirectory: () => false, isFile: () => true },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as never);

      const mockFileStats = { size: 1024 };
      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as never);
      vi.mocked(fs.stat).mockResolvedValue(mockFileStats as never);

      vi.mocked(fs.readFile).mockResolvedValue("test line 10" as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("totalMatches");
      expect(data).toHaveProperty("truncated");
      expect(data).toHaveProperty("duration");
      
      expect(Array.isArray(data.results)).toBe(true);
      expect(typeof data.totalMatches).toBe("number");
      expect(typeof data.truncated).toBe("boolean");
      expect(typeof data.duration).toBe("number");

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty("path");
        expect(result).toHaveProperty("matches");
        expect(Array.isArray(result.matches)).toBe(true);

        if (result.matches.length > 0) {
          const match = result.matches[0];
          expect(match).toHaveProperty("line");
          expect(match).toHaveProperty("content");
          expect(match).toHaveProperty("column");
          expect(match).toHaveProperty("length");
        }
      }
    });

    it("should include duration in response [REQ-FILE_SEARCH]", async () => {
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as never);
      vi.mocked(fs.readdir).mockResolvedValue([] as never);

      const request = new NextRequest("http://localhost/api/files/search", {
        method: "POST",
        body: JSON.stringify({
          pattern: "test",
          basePath: "/home/user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
