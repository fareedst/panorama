// [TEST-COPY_FILE] [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
// Integration tests for copyFile on real filesystem (no fs mocks)

import { describe, it, expect, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { copyFile } from "./files.data";

describe("[TEST-COPY_FILE] copyFile integration [IMPL-FILES_DATA]", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: mkdir dest parent, fs.cp recursive for directories, nested tree copied to new path
  it("copyFile copies nested directory tree to new parent path", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "copy-dir-"));
    const srcDir = path.join(tmpDir, "src", "sub");
    const srcFile = path.join(srcDir, "file.txt");
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(srcFile, "nested content");

    const destDir = path.join(tmpDir, "dest", "nested", "sub");
    await copyFile(srcDir, destDir);

    const destFile = path.join(destDir, "file.txt");
    const content = await fs.readFile(destFile, "utf-8");
    expect(content).toBe("nested content");
    expect((await fs.stat(destDir)).isDirectory()).toBe(true);
  });

  // [IMPL-FILES_DATA] [IMPL-COPY_ATTRS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS] [REQ-COPY_OPERATIONS]: how: after file copy preserveCopyAttributes applies source mtime/atime/mode on dest
  it("copyFile copies file and preserves mtime where supported", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "copy-file-"));
    const srcFile = path.join(tmpDir, "source.txt");
    const destParent = path.join(tmpDir, "out", "nested");
    const destFile = path.join(destParent, "source.txt");

    await fs.writeFile(srcFile, "file content");
    const past = new Date(Date.now() - 86400_000);
    await fs.utimes(srcFile, past, past);
    const sourceStat = await fs.stat(srcFile);

    await copyFile(srcFile, destFile);

    const destStat = await fs.stat(destFile);
    expect(await fs.readFile(destFile, "utf-8")).toBe("file content");
    expect(destStat.mtime.getTime()).toBe(sourceStat.mtime.getTime());
    expect(destStat.atime.getTime()).toBe(sourceStat.atime.getTime());
    expect(destStat.mode).toBe(sourceStat.mode);
  });
});
