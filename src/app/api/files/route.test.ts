// [TEST-FILES_API] [IMPL-FILES_API] [IMPL-NSYNC_ENGINE] [REQ-FILE_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]
// Tests for POST /api/files validation and sync-all operation

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSync = vi.fn();
vi.mock("@/lib/sync", () => ({
  SyncEngine: vi.fn().mockImplementation(() => ({
    sync: mockSync,
  })),
}));

describe("POST /api/files [TEST-FILES_API] [IMPL-FILES_API] [REQ-FILE_OPERATIONS]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSync.mockResolvedValue({
      cancelled: false,
      storeFailureAbort: false,
      itemsCompleted: 1,
      itemsFailed: 0,
      itemsSkipped: 0,
      bytesCopied: 0,
      durationMs: 0,
      errors: [],
    });
  });

  describe("Operation validation [IMPL-FILES_API]", () => {
    it("returns 400 when operation is missing [REQ-FILE_OPERATIONS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src: "/a/file" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required parameters");
    });

    it("returns 400 for copy when src is missing [REQ-FILE_OPERATIONS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "copy", dest: "/dest" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required parameters");
    });
  });

  describe("sync-all operation [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET]", () => {
    it("accepts sync-all without src when sources and destinations provided [IMPL-NSYNC_ENGINE]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "sync-all",
          sources: ["/tmp/src/file.txt"],
          destinations: ["/tmp/dest1", "/tmp/dest2"],
          move: false,
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockSync).toHaveBeenCalledWith(
        ["/tmp/src/file.txt"],
        ["/tmp/dest1", "/tmp/dest2"],
        expect.objectContaining({ move: false })
      );
      const data = await response.json();
      expect(data.itemsCompleted).toBe(1);
    });

    it("returns 400 when sync-all has no sources [REQ-NSYNC_MULTI_TARGET]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "sync-all",
          destinations: ["/tmp/dest1"],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Sources array required");
      expect(mockSync).not.toHaveBeenCalled();
    });

    it("returns 400 when sync-all has no destinations [REQ-NSYNC_MULTI_TARGET]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "sync-all",
          sources: ["/tmp/src/file.txt"],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Destinations array required");
      expect(mockSync).not.toHaveBeenCalled();
    });

    it("returns 400 when sync-all has empty sources array [REQ-NSYNC_MULTI_TARGET]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "sync-all",
          sources: [],
          destinations: ["/tmp/dest1"],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Sources array required");
    });
  });
});
