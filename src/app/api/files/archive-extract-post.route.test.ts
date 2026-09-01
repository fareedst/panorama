// [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILES_API] [IMPL-ARCHIVE_DIRECTORY_PANES]: POST extract-archive-entry and virtual path mutation guards — Tranche 4

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { encodeVirtualArchivePath } from "@/lib/archive";
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

vi.mock("@/lib/sync", () => ({
  SyncEngine: vi.fn().mockImplementation(() => ({
    sync: vi.fn(),
  })),
}));

vi.mock("@/lib/files.data", () => ({
  copyFile: vi.fn(),
  moveFile: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  bulkCopy: vi.fn(),
  bulkMove: vi.fn(),
  bulkDelete: vi.fn(),
  bulkTouch: vi.fn(),
  bulkRename: vi.fn(),
  bulkMakeDirectory: vi.fn(),
  listDirectory: vi.fn(),
  getUserHomeDirectory: vi.fn(),
  sortFiles: vi.fn(),
}));

vi.mock("@/lib/execute-command.data", () => ({
  executeCommandBatch: vi.fn(),
}));

describe("POST /api/files extract-archive-entry [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILES_API]", () => {
  let fixtures: FixturePaths;
  let extractDir: string;

  beforeAll(async () => {
    fixtures = await createArchiveFixtures();
    extractDir = path.join(fixtures.root, "api-extract-out");
    fs.mkdirSync(extractDir, { recursive: true });
  }, 30_000);

  afterAll(() => {
    cleanupArchiveFixtures(fixtures);
  });

  it("extract-archive-entry writes file bytes and returns success", async () => {
    const dest = path.join(extractDir, "api-readme.txt");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-archive-entry",
        archivePath: fixtures.sampleZip,
        entryPath: "readme.txt",
        dest,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fs.readFileSync(dest, "utf8")).toBe("hello zip");
  });

  it("extract-archive-entry overwrites existing destination file", async () => {
    const dest = path.join(extractDir, "overwrite.txt");
    fs.writeFileSync(dest, "stale content");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-archive-entry",
        archivePath: fixtures.sampleZip,
        entryPath: "readme.txt",
        dest,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(fs.readFileSync(dest, "utf8")).toBe("hello zip");
  });

  it("returns 400 when extract parameters are missing", async () => {
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-archive-entry",
        archivePath: fixtures.sampleZip,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing required parameters");
  });

  it("rejects virtual archivePath for extract-archive-entry", async () => {
    const locator = encodeVirtualArchivePath(fixtures.sampleZip, "readme.txt");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-archive-entry",
        archivePath: locator,
        entryPath: "readme.txt",
        dest: path.join(extractDir, "reject.txt"),
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errorCode).toBe("VIRTUAL_PATH_MUTATION_REJECTED");
  });

  it("rejects virtual dest for extract-archive-entry", async () => {
    const locator = encodeVirtualArchivePath(fixtures.sampleZip, "");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-archive-entry",
        archivePath: fixtures.sampleZip,
        entryPath: "readme.txt",
        dest: locator,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errorCode).toBe("VIRTUAL_PATH_MUTATION_REJECTED");
  });
});

describe("POST /api/files virtual path mutation guards [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILES_API]", () => {
  const virtualSrc = encodeVirtualArchivePath("/tmp/sample.zip", "readme.txt");

  it("rejects copy with virtual src", async () => {
    const { copyFile } = await import("@/lib/files.data");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "copy",
        src: virtualSrc,
        dest: "/tmp/dest.txt",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "VIRTUAL_PATH_MUTATION_REJECTED" });
    expect(copyFile).not.toHaveBeenCalled();
  });

  it("rejects move with virtual dest", async () => {
    const { moveFile } = await import("@/lib/files.data");
    const virtualDest = encodeVirtualArchivePath("/tmp/other.zip", "");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "move",
        src: "/tmp/a.txt",
        dest: virtualDest,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "VIRTUAL_PATH_MUTATION_REJECTED" });
    expect(moveFile).not.toHaveBeenCalled();
  });

  it("rejects delete with virtual src", async () => {
    const { deleteFile } = await import("@/lib/files.data");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "delete",
        src: virtualSrc,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "VIRTUAL_PATH_MUTATION_REJECTED" });
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("rejects rename with virtual src", async () => {
    const { renameFile } = await import("@/lib/files.data");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "rename",
        src: virtualSrc,
        dest: "/tmp/renamed.txt",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "VIRTUAL_PATH_MUTATION_REJECTED" });
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("rejects bulk-copy when sources include virtual locator", async () => {
    const { bulkCopy } = await import("@/lib/files.data");
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "bulk-copy",
        sources: ["/tmp/a.txt", virtualSrc],
        dest: "/tmp/dest",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "VIRTUAL_PATH_MUTATION_REJECTED" });
    expect(bulkCopy).not.toHaveBeenCalled();
  });
});
