// [IMPL-MESH_CONNECTOR] [REQ-MESH_PLATFORM]: Fake connector contract tests — phase 4

import { describe, it, expect } from "vitest";
import { FakeConnector } from "./fake-connector";

describe("FakeConnector [IMPL-MESH_CONNECTOR]", () => {
  it("connector_can_list_entries", () => {
    const conn = new FakeConnector();
    conn.seedFile("/a.txt", new TextEncoder().encode("a"));
    const listed = conn.listEntries("/");
    expect(Array.isArray(listed)).toBe(true);
    if (Array.isArray(listed)) {
      expect(listed.length).toBeGreaterThan(0);
    }
  });

  it("connector_can_stat_entry", () => {
    const conn = new FakeConnector();
    conn.seedFile("/b.txt", new TextEncoder().encode("b"));
    const stat = conn.statEntry("/b.txt");
    expect(stat).not.toHaveProperty("code");
    if (!("code" in stat)) {
      expect(stat.isDirectory).toBe(false);
    }
  });

  it("connector_can_read_file_when_supported", () => {
    const conn = new FakeConnector();
    conn.seedFile("/c.txt", new TextEncoder().encode("c"));
    const data = conn.readFile("/c.txt");
    expect(data).not.toHaveProperty("code");
    expect(ArrayBuffer.isView(data)).toBe(true);
  });

  it("connector_can_write_file_when_supported", () => {
    const conn = new FakeConnector();
    const err = conn.writeFile("/d.txt", new TextEncoder().encode("d"));
    expect(err).toBeUndefined();
    const written = conn.readFile("/d.txt");
    expect(written).not.toHaveProperty("code");
    expect(ArrayBuffer.isView(written)).toBe(true);
  });

  it("connector_can_delete_file_when_supported", () => {
    const conn = new FakeConnector();
    conn.seedFile("/e.txt", new TextEncoder().encode("e"));
    const del = conn.deleteFile("/e.txt");
    expect(del).toBeUndefined();
    const read = conn.readFile("/e.txt");
    expect(read).toHaveProperty("code");
  });

  it("connector_reports_unsupported_operations", () => {
    const conn = new FakeConnector();
    (conn as { capabilities: { canRead: boolean } }).capabilities.canRead = false;
    const read = conn.readFile("/missing.txt");
    expect(read).toEqual({ code: "unsupported", message: "Read not supported" });
  });

  it("connector_health_check_returns_structured_status", () => {
    const conn = new FakeConnector();
    const health = conn.healthCheck();
    expect(health.ok).toBe(true);
    expect(typeof health.message).toBe("string");
  });

  it("connector_errors_are_normalized", () => {
    const conn = new FakeConnector();
    const err = conn.readFile("/nope.txt");
    expect(err).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
  });
});
