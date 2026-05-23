// [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_FILTER_API]

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "./route";

const SPECS_FILE = path.join(process.cwd(), "data", "display-specs.json");

describe("display-specs API [IMPL-DISPLAY_FILTER_API]", () => {
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

  it("creates and lists specs", async () => {
    const createReq = new NextRequest("http://localhost/api/display-specs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Test-${Date.now()}`,
        rules: [
          { id: "r1", action: "exclude", target: "file", pattern: "*.tmp", order: 0, enabled: true },
        ],
      }),
    });
    const created = await POST(createReq);
    expect(created.status).toBe(201);

    const listRes = await GET();
    const list = await listRes.json();
    expect(list.specs.length).toBeGreaterThanOrEqual(1);
    expect(list.specs.some((s: { name: string }) => s.name.startsWith("Test-"))).toBe(true);
  });

  it("PUT merges client catalog with stable ids", async () => {
    const clientSpec = {
      id: "client-uuid-123",
      name: "Client spec",
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
    const syncRes = await PUT(syncReq);
    expect(syncRes.status).toBe(200);

    const list = await (await GET()).json();
    expect(list.specs).toHaveLength(1);
    expect(list.specs[0].id).toBe("client-uuid-123");
  });

  it("deletes spec by id", async () => {
    const createReq = new NextRequest("http://localhost/api/display-specs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Gone-${Date.now()}`,
        rules: [
          { id: "r1", action: "exclude", target: "both", pattern: "*", order: 0, enabled: true },
        ],
      }),
    });
    const created = await POST(createReq);
    const spec = await created.json();
    const delReq = new NextRequest(`http://localhost/api/display-specs?id=${spec.id}`, {
      method: "DELETE",
    });
    const delRes = await DELETE(delReq);
    expect(delRes.status).toBe(200);
    const list = await (await GET()).json();
    expect(list.specs).toHaveLength(0);
  });
});
