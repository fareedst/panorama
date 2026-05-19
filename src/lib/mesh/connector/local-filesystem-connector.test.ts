// [REQ-MESH_REAL_CONNECTORS]: Local connector tests — phase 28

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { LocalFilesystemConnector } from "./local-filesystem-connector";

describe("LocalFilesystemConnector [IMPL-MESH_LOCAL_CONNECTOR]", () => {
  let dir: string;
  let connector: LocalFilesystemConnector;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "mesh-local-"));
    writeFileSync(join(dir, "hello.txt"), "world");
    connector = new LocalFilesystemConnector(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("local_connector_lists_files", () => {
    const listed = connector.listEntries("/");
    expect(Array.isArray(listed)).toBe(true);
    if (Array.isArray(listed)) {
      expect(listed.some((e) => e.name === "hello.txt")).toBe(true);
    }
  });

  it("local_connector_reads_file", () => {
    const data = connector.readFile("/hello.txt");
    expect(data).toBeInstanceOf(Uint8Array);
    if (data instanceof Uint8Array) {
      expect(new TextDecoder().decode(data)).toBe("world");
    }
  });

  it("local_connector_writes_file", () => {
    const writeErr = connector.writeFile("/out.txt", new TextEncoder().encode("new"));
    expect(writeErr).toBeUndefined();
    const read = connector.readFile("/out.txt");
    expect(read).toBeInstanceOf(Uint8Array);
  });
});
