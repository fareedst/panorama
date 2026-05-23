// [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_FILTER_API]

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { PUT as PUT_SPECS } from "../display-specs/route";
import { serverCreateDisplaySpec } from "@/lib/display-spec-store-server";

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
}));

const SPECS_FILE = path.join(process.cwd(), "data", "display-specs.json");

describe("GET /api/files with displaySpecId [IMPL-DISPLAY_FILTER_API]", () => {
  beforeEach(async () => {
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
  });

  it("VALIDATE_OPERATION_PATHS rejects bulk-delete of hidden path", async () => {
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
