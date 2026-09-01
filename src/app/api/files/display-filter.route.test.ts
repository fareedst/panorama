// [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_FILTER_API]

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { PUT as PUT_SPECS } from "../display-specs/route";
import { serverCreateDisplaySpec } from "@/lib/display-spec-store-server";

const mockGetVolumeStats = vi.fn();
vi.mock("@/lib/volume-stats", () => ({
  getVolumeStats: (...args: unknown[]) => mockGetVolumeStats(...args),
}));

vi.mock("@/lib/files.data", () => ({
  listDirectory: vi.fn(async () => [
    { name: "README.md", path: "/tmp/README.md", isDirectory: false, size: 1, mtime: new Date(), extension: ".md" },
    { name: "app.log", path: "/tmp/app.log", isDirectory: false, size: 1, mtime: new Date(), extension: ".log" },
  ]),
  getUserHomeDirectory: () => "/tmp",
  sortFiles: (files: unknown[]) => files,
  copyFile: vi.fn(),
  moveFile: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  bulkCopy: vi.fn(),
  bulkMove: vi.fn(),
  bulkDelete: vi.fn(),
  bulkTouch: vi.fn(),
  bulkRename: vi.fn(),
}));

const SPECS_FILE = path.join(process.cwd(), "data", "display-specs.json");

const availableVolumeStats = {
  totalBytes: 1_000_000,
  availableBytes: 400_000,
  freePercent: 40,
  deviceId: 42,
  sourcePath: "/tmp",
  status: "available" as const,
};

// [IMPL-FILES_API] [IMPL-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY]: GET always returns enriched listing with volumeStats

describe("GET /api/files with displaySpecId [IMPL-DISPLAY_FILTER_API]", () => {
  beforeEach(async () => {
    mockGetVolumeStats.mockResolvedValue({ ...availableVolumeStats, sourcePath: "/tmp" });
    try {
      await fs.unlink(SPECS_FILE);
    } catch {
      /* empty */
    }
  });

  afterEach(async () => {
    try {
      await fs.unlink(SPECS_FILE);
    } catch {
      /* empty */
    }
  });

  it("SERVER_FILTER_LISTING returns filtered listing with hiddenCount", async () => {
    // [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
    // how: GET /api/files lists directory then filterFileStats when displaySpecId resolves on server store; legacy array when omitted.
    const spec = await serverCreateDisplaySpec({
      name: "No logs",
      rules: [
        { id: "r1", action: "exclude", target: "file", pattern: "*.log", order: 0, enabled: true },
      ],
    });
    if ("ok" in spec) throw new Error("expected spec");
    const req = new NextRequest(
      `http://localhost/api/files?path=/tmp&displaySpecId=${spec.id}`,
    );
    const res = await GET(req);
    const body = await res.json();
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["README.md"]);
    expect(body.hiddenCount).toBe(1);
    expect(body.volumeStats).toMatchObject({
      status: "available",
      totalBytes: 1_000_000,
      availableBytes: 400_000,
    });
  });

  it("returns filtered listing after client catalog sync", async () => {
    const clientSpec = {
      id: "client-only-spec-id",
      name: "Synced from client",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [
        { id: "r1", action: "exclude", target: "file", pattern: "*.log", order: 0, enabled: true },
      ],
    };
    const syncReq = new NextRequest("http://localhost/api/display-specs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specs: [clientSpec] }),
    });
    expect((await PUT_SPECS(syncReq)).status).toBe(200);

    const req = new NextRequest(
      "http://localhost/api/files?path=/tmp&displaySpecId=client-only-spec-id",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["README.md"]);
    expect(body.volumeStats?.status).toBe("available");
  });

  it("VALIDATE_OPERATION_PATHS rejects bulk-delete of hidden path", async () => {
    // [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER] [REQ-BULK_FILE_OPS]
    // how: Reject POST operation sources whose basename is not visible under active display spec in parent directory.
    const spec = await serverCreateDisplaySpec({
      name: "No logs",
      rules: [
        { id: "r1", action: "exclude", target: "file", pattern: "*.log", order: 0, enabled: true },
      ],
    });
    if ("ok" in spec) throw new Error("expected spec");
    const req = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "bulk-delete",
        sources: ["/tmp/app.log"],
        displaySpecId: spec.id,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/files listing enrichment [REQ-PANE_VOLUME_CAPACITY] [IMPL-PANE_VOLUME_CAPACITY]", () => {
  beforeEach(() => {
    mockGetVolumeStats.mockResolvedValue({ ...availableVolumeStats, sourcePath: "/tmp" });
  });

  it("returns enriched object without displaySpecId (not bare array)", async () => {
    const req = new NextRequest("http://localhost/api/files?path=/tmp");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(false);
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["README.md", "app.log"]);
    expect(body.hiddenCount).toBe(0);
    expect(body.totalCount).toBe(2);
    expect(body.volumeStats).toMatchObject({
      status: "available",
      sourcePath: "/tmp",
    });
    expect(mockGetVolumeStats).toHaveBeenCalledWith("/tmp");
  });

  it("returns listing when volume stats are unavailable", async () => {
    mockGetVolumeStats.mockResolvedValueOnce({
      totalBytes: 0,
      availableBytes: 0,
      freePercent: 0,
      deviceId: null,
      sourcePath: "/tmp",
      status: "unavailable",
      errorCode: "STAT_FAILED",
    });
    const req = new NextRequest("http://localhost/api/files?path=/tmp");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.files).toHaveLength(2);
    expect(body.volumeStats.status).toBe("unavailable");
  });

  it("does not call getVolumeStats for rejected traversal paths", async () => {
    mockGetVolumeStats.mockClear();
    const req = new NextRequest("http://localhost/api/files?path=/tmp/../secret");
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockGetVolumeStats).not.toHaveBeenCalled();
  });
});
