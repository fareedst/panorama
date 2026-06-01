// [TEST-MAKE_DIRECTORY] [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]

import { describe, it, expect, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { bulkMakeDirectory, makeDirectory } from "./files.data";

describe("[TEST-MAKE_DIRECTORY] makeDirectory [IMPL-MAKE_DIRECTORY]", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates a single directory under parent path", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mkdir-single-"));
    const newDir = path.join(tmpDir, "newdir");
    await makeDirectory(newDir);
    const stat = await fs.stat(newDir);
    expect(stat.isDirectory()).toBe(true);
  });
});

describe("[TEST-MAKE_DIRECTORY] bulkMakeDirectory [IMPL-MAKE_DIRECTORY]", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — bulkMakeDirectory aggregates successCount across entries
  it("bulkMakeDirectory reports success count", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mkdir-bulk-"));
    const a = path.join(tmpDir, "alpha");
    const b = path.join(tmpDir, "beta");

    const result = await bulkMakeDirectory([{ path: a }, { path: b }]);

    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect((await fs.stat(a)).isDirectory()).toBe(true);
    expect((await fs.stat(b)).isDirectory()).toBe(true);
  });

  // [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — bulkMakeDirectory reports partial failure for existing path
  it("bulkMakeDirectory reports partial failure when directory exists", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mkdir-bulk-partial-"));
    const existing = path.join(tmpDir, "exists");
    const fresh = path.join(tmpDir, "fresh");
    await fs.mkdir(existing);

    const result = await bulkMakeDirectory([{ path: existing }, { path: fresh }]);

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect((await fs.stat(fresh)).isDirectory()).toBe(true);
  });
});
