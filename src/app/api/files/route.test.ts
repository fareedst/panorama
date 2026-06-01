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

const mockBulkTouch = vi.fn();
const mockBulkRename = vi.fn();
const mockBulkMakeDirectory = vi.fn();
const mockExecuteCommandBatch = vi.fn();
vi.mock("@/lib/files.data", () => ({
  copyFile: vi.fn(),
  moveFile: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  bulkCopy: vi.fn(),
  bulkMove: vi.fn(),
  bulkDelete: vi.fn(),
  bulkTouch: (...args: unknown[]) => mockBulkTouch(...args),
  bulkRename: (...args: unknown[]) => mockBulkRename(...args),
  bulkMakeDirectory: (...args: unknown[]) => mockBulkMakeDirectory(...args),
  listDirectory: vi.fn(),
  getUserHomeDirectory: vi.fn(),
  sortFiles: vi.fn(),
}));

vi.mock("@/lib/execute-command.data", () => ({
  executeCommandBatch: (...args: unknown[]) => mockExecuteCommandBatch(...args),
}));

describe("POST /api/files [TEST-FILES_API] [IMPL-FILES_API] [REQ-FILE_OPERATIONS]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBulkTouch.mockResolvedValue({
      successCount: 1,
      errorCount: 0,
      errors: [],
    });
    mockBulkRename.mockResolvedValue({
      successCount: 1,
      errorCount: 0,
      errors: [],
    });
    mockBulkMakeDirectory.mockResolvedValue({
      successCount: 1,
      errorCount: 0,
      errors: [],
    });
    mockExecuteCommandBatch.mockResolvedValue({
      successCount: 1,
      errorCount: 0,
      results: [{ paneIndex: 0, exitCode: 0 }],
    });
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

  // [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: POST parses JSON body; operation required; src required only for copy/move/delete/rename; reject .. in src/dest when present

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

  // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: sync() builds plan, iterates sources, syncItem to all destinations in parallel, deletes sources only after all dests succeed when move=true

  describe("sync-all operation [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET]", () => {
    // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: sync() builds plan, iterates sources, syncItem to all destinations in parallel, deletes sources only after all dests succeed when move=true
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

  describe("bulk-touch operation [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]", () => {
    // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — reject missing entries array
    it("returns 400 when entries missing [REQ-TOUCH_MTIME]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk-touch" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Entries array required");
      expect(mockBulkTouch).not.toHaveBeenCalled();
    });

    // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — reject path traversal in entry
    it("returns 400 for invalid path in entry [REQ-TOUCH_MTIME]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-touch",
          entries: [{ path: "../secret", mtime: "2026-01-01T00:00:00.000Z" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid path");
    });

    // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — reject missing path field in entry
    it("returns 400 when entry path missing [REQ-TOUCH_MTIME]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-touch",
          entries: [{ mtime: "2026-01-01T00:00:00.000Z" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires path");
      expect(mockBulkTouch).not.toHaveBeenCalled();
    });

    // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — reject missing or invalid mtime string
    it("returns 400 for invalid mtime in entry [REQ-TOUCH_MTIME]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-touch",
          entries: [{ path: "/tmp/a.txt", mtime: "not-a-date" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid mtime");
      expect(mockBulkTouch).not.toHaveBeenCalled();
    });

    // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — parse ISO mtime and delegate to bulkTouch
    it("delegates valid bulk-touch to bulkTouch [REQ-TOUCH_MTIME]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-touch",
          entries: [
            { path: "/tmp/a.txt", mtime: "2026-01-01T00:00:00.000Z" },
          ],
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockBulkTouch).toHaveBeenCalledWith([
        {
          path: "/tmp/a.txt",
          mtime: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]);
    });
  });

  describe("bulk-rename operation [IMPL-RENAME_REGEX] [IMPL-FILES_API] [ARCH-BATCH_OPERATIONS] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]", () => {
    // [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]: how — validate entries array present
    it("returns 400 when entries missing [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk-rename" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Entries array required");
      expect(mockBulkRename).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid path in entry [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ src: "../secret", dest: "../secret2" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid path");
    });

    it("returns 400 when rename crosses directories [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ src: "/tmp/a.txt", dest: "/other/a.txt" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Rename must stay in same directory");
    });

    // [IMPL-RENAME_REGEX] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]: how — each entry requires src and dest strings
    it("returns 400 when entry missing src [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ dest: "/tmp/b.txt" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires src");
      expect(mockBulkRename).not.toHaveBeenCalled();
    });

    it("returns 400 when entry missing dest [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ src: "/tmp/a.txt" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires dest");
      expect(mockBulkRename).not.toHaveBeenCalled();
    });

    // [IMPL-RENAME_REGEX] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]: how — validateRenameBasename on destination basename
    it("returns 400 for invalid destination basename [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ src: "/tmp/a.txt", dest: "/tmp/." }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid destination name");
      expect(mockBulkRename).not.toHaveBeenCalled();
    });

    // [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]: how — delegate validated entries to bulkRename
    it("delegates valid bulk-rename to bulkRename [REQ-BULK_FILE_OPS]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-rename",
          entries: [{ src: "/tmp/a.txt", dest: "/tmp/b.txt" }],
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockBulkRename).toHaveBeenCalledWith([
        { src: "/tmp/a.txt", dest: "/tmp/b.txt" },
      ]);
    });
  });

  describe("bulk-mkdir operation [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]", () => {
    it("returns 400 when entries missing [REQ-DIRECTORY_NAVIGATION]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "bulk-mkdir" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Entries array required");
      expect(mockBulkMakeDirectory).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid path in entry [REQ-DIRECTORY_NAVIGATION]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-mkdir",
          entries: [{ path: "../secret/newdir" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid path");
    });

    it("returns 400 when entry path missing [REQ-DIRECTORY_NAVIGATION]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-mkdir",
          entries: [{}],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires path");
      expect(mockBulkMakeDirectory).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid directory name [REQ-DIRECTORY_NAVIGATION]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-mkdir",
          entries: [{ path: "/tmp/." }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid directory name");
      expect(mockBulkMakeDirectory).not.toHaveBeenCalled();
    });

    it("delegates valid bulk-mkdir to bulkMakeDirectory [REQ-DIRECTORY_NAVIGATION]", async () => {
      mockBulkMakeDirectory.mockResolvedValueOnce({
        successCount: 1,
        errorCount: 0,
        errors: [],
      });
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "bulk-mkdir",
          entries: [{ path: "/tmp/newdir" }],
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockBulkMakeDirectory).toHaveBeenCalledWith([{ path: "/tmp/newdir" }]);
    });
  });

  describe("execute-command operation [IMPL-PANE_COMMAND_EXEC] [IMPL-FILES_API] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]", () => {
    it("returns 400 when entries missing [REQ-PANE_COMMAND_EXEC] [IMPL-FILES_API]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "execute-command" }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Entries array required");
      expect(mockExecuteCommandBatch).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid cwd in entry [REQ-PANE_COMMAND_EXEC]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "execute-command",
          entries: [{ paneIndex: 0, cwd: "../secret", command: "echo hi" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid cwd");
    });

    it("returns 400 when command missing [REQ-PANE_COMMAND_EXEC] [IMPL-FILES_API]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "execute-command",
          entries: [{ paneIndex: 0, cwd: "/tmp", command: "  " }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires command");
      expect(mockExecuteCommandBatch).not.toHaveBeenCalled();
    });

    it("returns 400 when paneIndex missing [REQ-PANE_COMMAND_EXEC] [IMPL-FILES_API]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "execute-command",
          entries: [{ cwd: "/tmp", command: "echo hi" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires paneIndex");
      expect(mockExecuteCommandBatch).not.toHaveBeenCalled();
    });

    it("returns 400 when cwd missing [REQ-PANE_COMMAND_EXEC] [IMPL-FILES_API]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "execute-command",
          entries: [{ paneIndex: 0, command: "echo hi" }],
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Each entry requires cwd");
      expect(mockExecuteCommandBatch).not.toHaveBeenCalled();
    });

    it("delegates valid execute-command to executeCommandBatch [REQ-PANE_COMMAND_EXEC] [IMPL-FILES_API]", async () => {
      const request = new NextRequest("http://localhost/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "execute-command",
          entries: [
            {
              paneIndex: 0,
              cwd: "/tmp",
              command: "echo hi",
              filePath: "/tmp/a.txt",
              markedPaths: [],
            },
          ],
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockExecuteCommandBatch).toHaveBeenCalledWith([
        {
          paneIndex: 0,
          cwd: "/tmp",
          command: "echo hi",
          filePath: "/tmp/a.txt",
          markedPaths: [],
        },
      ]);
    });
  });
});
