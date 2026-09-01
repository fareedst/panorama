// [TEST-COPY_FILE] [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
// Integration tests for copyFile on real filesystem (no fs mocks)

import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { copyFile, moveFile } from "./files.data";

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

describe("[TEST-MOVE_FILE] moveFile integration [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS]", () => {
  let tmpDir: string;

  afterEach(async () => {
    vi.restoreAllMocks();
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS]: how — simulate EXDEV when src/dest use different volume roots; copy+delete completes move
  it("moveFile uses copy+delete fallback when rename throws EXDEV across volume roots", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "move-exdev-"));
    const volA = path.join(tmpDir, "volA", "rags");
    const volB = path.join(tmpDir, "volB", "rags");
    await fs.mkdir(volA, { recursive: true });
    await fs.mkdir(volB, { recursive: true });

    const src = path.join(volA, "sample.mp4");
    const dest = path.join(volB, "sample.mp4");
    await fs.writeFile(src, "video-bytes");

    const originalRename = fs.rename.bind(fs);
    vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
      const fromRoot = path.join(tmpDir, "volA");
      const toRoot = path.join(tmpDir, "volB");
      if (!String(from).startsWith(fromRoot) || !String(to).startsWith(toRoot)) {
        return originalRename(from, to);
      }
      const err = Object.assign(new Error("EXDEV: cross-device link not permitted, rename"), {
        code: "EXDEV",
      });
      throw err;
    });

    await moveFile(src, dest);

    expect(await fs.readFile(dest, "utf-8")).toBe("video-bytes");
    await expect(fs.stat(src)).rejects.toThrow();
  });

  // [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS]: how — same tmp root rename fast path still works without fallback
  it("moveFile renames within same directory without copy fallback", async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "move-rename-"));
    const src = path.join(tmpDir, "old.txt");
    const dest = path.join(tmpDir, "new.txt");
    await fs.writeFile(src, "content");

    await moveFile(src, dest);

    expect(await fs.readFile(dest, "utf-8")).toBe("content");
    await expect(fs.stat(src)).rejects.toThrow();
  });
});
