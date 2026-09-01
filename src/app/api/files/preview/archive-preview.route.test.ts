// [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILE_PREVIEW] [IMPL-ARCHIVE_DIRECTORY_PANES]: Archive preview shared reader — Tranche 7

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import {
  cleanupArchiveFixtures,
  createArchiveFixtures,
  type FixturePaths,
} from "@/lib/archive/test-fixtures";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GET /api/files/preview archive shared reader [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  let fixtures: FixturePaths;

  beforeAll(async () => {
    fixtures = await createArchiveFixtures();
  }, 30_000);

  afterAll(() => {
    cleanupArchiveFixtures(fixtures);
  });

  it("returns top-level manifest entries via shared reader for zip archive", async () => {
    const request = new NextRequest(
      new URL(
        `http://localhost/api/files/preview?path=${encodeURIComponent(fixtures.sampleZip)}&type=archive`,
      ),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("archive");
    expect(data.name).toBe("sample.zip");
    expect(data.format).toBe("zip");
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.entries.some((entry: { name: string }) => entry.name === "readme.txt")).toBe(true);
    expect(data.message).toBeUndefined();
    expect(data.entries[0]).toMatchObject({
      name: expect.any(String),
      path: expect.stringContaining("@archive/v1/"),
      isDirectory: expect.any(Boolean),
      size: expect.any(Number),
      mtime: expect.any(String),
    });
  });

  it("returns sanitized error for unsupported archive format", async () => {
    const request = new NextRequest(
      new URL(
        `http://localhost/api/files/preview?path=${encodeURIComponent(fixtures.unsupported7z)}&type=archive`,
      ),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errorCode).toBe("FORMAT_UNSUPPORTED");
    expect(data.error).toBe("Archive preview failed");
    expect(JSON.stringify(data)).not.toMatch(/yauzl|tar-stream|ENOENT/i);
  });
});
