// [TEST-RENAME_REGEX] [IMPL-RENAME_REGEX] [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]

import { describe, it, expect, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { bulkRename } from "./files.data";

describe("[TEST-RENAME_REGEX] bulkRename [IMPL-RENAME_REGEX]", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // [IMPL-RENAME_REGEX] [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — Promise.allSettled aggregates successCount across entries
  it("bulkRename reports success count", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rename-bulk-"));
    const a = path.join(tmpDir, "a.txt");
    const b = path.join(tmpDir, "b.txt");
    await fs.writeFile(a, "a");
    await fs.writeFile(b, "b");

    const result = await bulkRename([
      { src: a, dest: path.join(tmpDir, "a-renamed.txt") },
      { src: b, dest: path.join(tmpDir, "b-renamed.txt") },
    ]);

    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    await expect(fs.stat(path.join(tmpDir, "a-renamed.txt"))).resolves.toBeDefined();
    await expect(fs.stat(path.join(tmpDir, "b-renamed.txt"))).resolves.toBeDefined();
  });

  // [IMPL-RENAME_REGEX] [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — continue on error and report partial failure
  it("bulkRename reports partial failure for missing path", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rename-bulk-partial-"));
    const existing = path.join(tmpDir, "exists.txt");
    await fs.writeFile(existing, "ok");

    const result = await bulkRename([
      { src: existing, dest: path.join(tmpDir, "renamed.txt") },
      {
        src: path.join(tmpDir, "missing.txt"),
        dest: path.join(tmpDir, "missing-renamed.txt"),
      },
    ]);

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    await expect(fs.stat(path.join(tmpDir, "renamed.txt"))).resolves.toBeDefined();
  });
});
