// [TEST-TOUCH_MTIME] [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]

import { describe, it, expect, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { setFileMtime, bulkTouch } from "./files.data";

describe("[TEST-TOUCH_MTIME] setFileMtime [IMPL-TOUCH_MTIME]", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("sets mtime while preserving atime on a file", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "touch-mtime-"));
    const filePath = path.join(tmpDir, "sample.txt");
    const past = new Date("2020-01-01T00:00:00.000Z");
    await fs.writeFile(filePath, "hello");
    await fs.utimes(filePath, past, past);

    const before = await fs.stat(filePath);
    const newMtime = new Date("2025-06-15T12:00:00.000Z");
    await setFileMtime(filePath, newMtime);

    const after = await fs.stat(filePath);
    expect(after.mtime.getTime()).toBe(newMtime.getTime());
    expect(after.atime.getTime()).toBe(before.atime.getTime());
  });

  // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-FILE_OPERATIONS]: how — setFileMtime preserves atime on directories
  it("sets mtime while preserving atime on a directory", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "touch-mtime-dir-"));
    const dirPath = path.join(tmpDir, "nested");
    const past = new Date("2020-01-01T00:00:00.000Z");
    await fs.mkdir(dirPath);
    await fs.utimes(dirPath, past, past);

    const before = await fs.stat(dirPath);
    const newMtime = new Date("2025-06-15T12:00:00.000Z");
    await setFileMtime(dirPath, newMtime);

    const after = await fs.stat(dirPath);
    expect(after.mtime.getTime()).toBe(newMtime.getTime());
    expect(after.atime.getTime()).toBe(before.atime.getTime());
  });

  // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — bulkTouch aggregates successCount across entries
  it("bulkTouch reports success count", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "touch-bulk-"));
    const a = path.join(tmpDir, "a.txt");
    const b = path.join(tmpDir, "b.txt");
    await fs.writeFile(a, "a");
    await fs.writeFile(b, "b");
    const target = new Date("2024-12-01T00:00:00.000Z");

    const result = await bulkTouch([
      { path: a, mtime: target },
      { path: b, mtime: target },
    ]);

    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    const statA = await fs.stat(a);
    expect(statA.mtime.getTime()).toBe(target.getTime());
  });

  it("bulkTouch reports partial failure for missing path", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "touch-bulk-partial-"));
    const existing = path.join(tmpDir, "exists.txt");
    await fs.writeFile(existing, "ok");
    const target = new Date("2024-12-01T00:00:00.000Z");

    const result = await bulkTouch([
      { path: existing, mtime: target },
      { path: path.join(tmpDir, "missing.txt"), mtime: target },
    ]);

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    const stat = await fs.stat(existing);
    expect(stat.mtime.getTime()).toBe(target.getTime());
  });
});
