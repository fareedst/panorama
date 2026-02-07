// [TEST-FILE_PREVIEW] [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
// Tests for file info API route

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/files/info/route";
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

describe("File Info API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns file info for valid path", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Valid file info request
    const mockStats = {
      isDirectory: () => false,
      isFile: () => true,
      isSymbolicLink: () => false,
      size: 1024,
      birthtime: new Date("2024-01-01"),
      mtime: new Date("2024-01-02"),
      atime: new Date("2024-01-03"),
      mode: 0o644,
      uid: 1000,
      gid: 1000,
    };

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/info?path=/test/file.txt")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("file.txt");
    expect(data.size).toBe(1024);
    expect(data.extension).toBe(".txt");
    expect(data.isFile).toBe(true);
    expect(data.isDirectory).toBe(false);
  });

  it("rejects paths with directory traversal", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Security - directory traversal
    const request = new NextRequest(
      new URL("http://localhost/api/files/info?path=../../etc/passwd")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  });

  it("returns error for missing path parameter", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Missing required parameter
    const request = new NextRequest(
      new URL("http://localhost/api/files/info")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing path parameter");
  });

  it("returns 404 for non-existent file", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: File not found
    vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT: no such file or directory"));

    const request = new NextRequest(
      new URL("http://localhost/api/files/info?path=/nonexistent.txt")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File not found");
  });

  it("returns 403 for permission denied", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Permission denied
    vi.mocked(fs.stat).mockRejectedValue(new Error("EACCES: permission denied"));

    const request = new NextRequest(
      new URL("http://localhost/api/files/info?path=/restricted.txt")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Permission denied");
  });
});
