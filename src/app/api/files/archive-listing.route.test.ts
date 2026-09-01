// [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILES_API] [IMPL-ARCHIVE_DIRECTORY_PANES]: GET /api/files virtual archive locator branch — Tranche 3

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import {
  cleanupArchiveFixtures,
  createArchiveFixtures,
  type FixturePaths,
} from "@/lib/archive/test-fixtures";
import { encodeVirtualArchivePath } from "@/lib/archive";

const mockGetVolumeStats = vi.fn();
vi.mock("@/lib/volume-stats", () => ({
  getVolumeStats: (...args: unknown[]) => mockGetVolumeStats(...args),
}));

vi.mock("@/lib/files.data", () => ({
  listDirectory: vi.fn(async () => [
    {
      name: "README.md",
      path: "/tmp/README.md",
      isDirectory: false,
      size: 1,
      mtime: new Date(),
      extension: ".md",
    },
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

const availableVolumeStats = {
  totalBytes: 1_000_000,
  availableBytes: 400_000,
  freePercent: 40,
  deviceId: 42,
  sourcePath: "/tmp",
  status: "available" as const,
};

describe("GET /api/files archive listing [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILES_API]", () => {
  let fixtures: FixturePaths;

  beforeAll(async () => {
    fixtures = await createArchiveFixtures();
  }, 30_000);

  afterAll(() => {
    cleanupArchiveFixtures(fixtures);
  });

  beforeEach(() => {
    mockGetVolumeStats.mockClear();
    mockGetVolumeStats.mockResolvedValue({ ...availableVolumeStats });
  });

  it("returns projected archive entries with archiveSource for valid virtual locator", async () => {
    const locator = encodeVirtualArchivePath(fixtures.sampleZip, "");
    mockGetVolumeStats.mockResolvedValueOnce({
      ...availableVolumeStats,
      sourcePath: fixtures.sampleZip,
    });

    const req = new NextRequest(`http://localhost/api/files?path=${encodeURIComponent(locator)}`);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.files)).toBe(true);
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.files.every((row: { archiveSource?: unknown }) => row.archiveSource)).toBe(true);
    expect(body.files.map((row: { name: string }) => row.name).sort()).toEqual(
      ["docs", "nested.zip", "readme.txt"].sort(),
    );
    expect(body.volumeStats.sourcePath).toBe(fixtures.sampleZip);
    expect(mockGetVolumeStats).toHaveBeenCalledWith(fixtures.sampleZip);
  });

  it("returns 400 with INVALID_ARCHIVE_LOCATOR for malformed virtual locator", async () => {
    const req = new NextRequest(
      "http://localhost/api/files?path=@archive/v1/not-valid-base64!!!",
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe("INVALID_ARCHIVE_LOCATOR");
    expect(mockGetVolumeStats).not.toHaveBeenCalled();
  });

  it("returns 404 when archive file is missing", async () => {
    const missing = "/tmp/does-not-exist-archive.zip";
    const locator = encodeVirtualArchivePath(missing, "");
    const req = new NextRequest(`http://localhost/api/files?path=${encodeURIComponent(locator)}`);
    const res = await GET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.errorCode).toBe("ARCHIVE_NOT_FOUND");
  });

  it("returns 400 FORMAT_UNSUPPORTED for deferred archive format", async () => {
    const locator = encodeVirtualArchivePath(fixtures.unsupported7z, "");
    const req = new NextRequest(`http://localhost/api/files?path=${encodeURIComponent(locator)}`);
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe("FORMAT_UNSUPPORTED");
  });

  it("ordinary path listing remains unchanged enriched shape", async () => {
    const req = new NextRequest("http://localhost/api/files?path=/tmp");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["README.md"]);
    expect(body.hiddenCount).toBe(0);
    expect(body.totalCount).toBe(1);
    expect(body.volumeStats.status).toBe("available");
    expect(mockGetVolumeStats).toHaveBeenCalledWith("/tmp");
  });
});
