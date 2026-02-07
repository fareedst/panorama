// [TEST-FILE_PREVIEW] [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
// Tests for file preview API route

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/files/preview/route";
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

describe("File Preview API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns text preview for small text file", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Text file preview
    const mockStats = {
      isFile: () => true,
      size: 100,
    };

    const mockContent = "Hello, world!";

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);
    vi.mocked(fs.readFile).mockResolvedValue(mockContent as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=/test/file.txt&type=text")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("text");
    expect(data.content).toBe(mockContent);
    expect(data.truncated).toBe(false);
  });

  it("returns truncated text for large text file", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Truncate large text files
    const mockStats = {
      isFile: () => true,
      size: 200 * 1024, // 200KB (> 100KB limit)
    };

    const mockFile = {
      read: vi.fn().mockResolvedValue({
        bytesRead: 100 * 1024,
      }),
      close: vi.fn(),
    };

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);
    vi.mocked(fs.open).mockResolvedValue(mockFile as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=/test/large.txt&type=text")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("text");
    expect(data.truncated).toBe(true);
    expect(data.originalSize).toBe(200 * 1024);
  });

  it("returns image metadata for image file", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Image preview metadata
    const mockStats = {
      isFile: () => true,
      size: 5000,
    };

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=/test/image.png&type=image")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("image");
    expect(data.name).toBe("image.png");
    expect(data.extension).toBe(".png");
    expect(data.size).toBe(5000);
    expect(data.url).toContain("/api/files/raw");
  });

  it("returns archive stub for archive file", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Archive preview (stub)
    const mockStats = {
      isFile: () => true,
      size: 10000,
    };

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=/test/archive.zip&type=archive")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("archive");
    expect(data.name).toBe("archive.zip");
    expect(data.extension).toBe(".zip");
    expect(data.message).toContain("not yet implemented");
  });

  it("rejects paths with directory traversal", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Security - directory traversal
    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=../../etc/passwd")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  });

  it("returns error for missing path parameter", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Missing required parameter
    const request = new NextRequest(
      new URL("http://localhost/api/files/preview")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing path parameter");
  });

  it("rejects preview of directory", async () => {
    // [TEST-FILE_PREVIEW] [REQ-FILE_PREVIEW] Test: Cannot preview directory
    const mockStats = {
      isFile: () => false,
    };

    vi.mocked(fs.stat).mockResolvedValue(mockStats as never);

    const request = new NextRequest(
      new URL("http://localhost/api/files/preview?path=/test/dir")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Path is not a file");
  });
});
