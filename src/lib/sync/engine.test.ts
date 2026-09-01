// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: SyncEngine orchestrates multi-source multi-destination sync with observer callbacks, compare skip, verify, store monitoring, and deferred move deletion
// SyncEngine tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { SyncEngine } from "./engine";
import { StoreMonitor } from "./store";
import * as operations from "./operations";
import * as moveExecutor from "../move-executor";
import * as verify from "./verify";
import * as hash from "./hash";
import { ErrorClass } from "../sync.types";
import type { SyncObserver } from "../sync.types";
import { vi } from "vitest";

describe("SyncEngine", () => {
  let tempDir: string;
  let sourceDir: string;
  let dest1Dir: string;
  let dest2Dir: string;

  beforeEach(async () => {
    // Create temp directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-test-"));
    sourceDir = path.join(tempDir, "source");
    dest1Dir = path.join(tempDir, "dest1");
    dest2Dir = path.join(tempDir, "dest2");

    await fs.mkdir(sourceDir);
    await fs.mkdir(dest1Dir);
    await fs.mkdir(dest2Dir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // [IMPL-NSYNC_ENGINE] [IMPL-NSYNC_OPERATIONS] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: sync() builds plan, iterates sources, syncItem to all destinations in parallel, deletes sources only after all dests succeed when move=true
  it("should sync a file to multiple destinations [REQ-NSYNC_MULTI_TARGET] [IMPL-NSYNC_OPERATIONS]", async () => {
    // Create source file
    const sourceFile = path.join(sourceDir, "test.txt");
    await fs.writeFile(sourceFile, "test content");

    // Create sync engine
    const engine = new SyncEngine();

    // Sync to two destinations
    const result = await engine.sync([sourceFile], [dest1Dir, dest2Dir], {
      compareMethod: "size-mtime",
    });

    // Verify result
    expect(result.itemsCompleted).toBe(1);
    expect(result.itemsFailed).toBe(0);
    expect(result.itemsSkipped).toBe(0);
    expect(result.cancelled).toBe(false);

    // Verify files exist at destinations
    const dest1File = path.join(dest1Dir, "test.txt");
    const dest2File = path.join(dest2Dir, "test.txt");

    const [dest1Content, dest2Content] = await Promise.all([
      fs.readFile(dest1File, "utf-8"),
      fs.readFile(dest2File, "utf-8"),
    ]);

    expect(dest1Content).toBe("test content");
    expect(dest2Content).toBe("test content");
  });

  // [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: Shared preserveCopyAttributes() after fs.copyFile; stat source then chmod + utimes on dest; each step try/catch so unsupported or denied ops do not fail the copy

  // [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: after copy apply utimes and chmod from source stat
  it("should preserve file attributes (mtime, mode) where possible [IMPL-COPY_ATTRS]", async () => {
    const sourceFile = path.join(sourceDir, "attrs.txt");
    await fs.writeFile(sourceFile, "content");
    const past = new Date(Date.now() - 86400_000);
    await fs.utimes(sourceFile, past, past);
    const sourceStat = await fs.stat(sourceFile);

    const engine = new SyncEngine();
    await engine.sync([sourceFile], [dest1Dir], {});

    const destFile = path.join(dest1Dir, "attrs.txt");
    const destStat = await fs.stat(destFile);
    expect(destStat.mtime.getTime()).toBe(sourceStat.mtime.getTime());
    expect(destStat.atime.getTime()).toBe(sourceStat.atime.getTime());
    expect(destStat.mode).toBe(sourceStat.mode);
  });

  // [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: compareFiles returns true when source and destination are equivalent so SyncEngine can skip copy
  it("should skip unchanged files [REQ-COMPARE_METHODS]", async () => {
    // Create source file
    const sourceFile = path.join(sourceDir, "test.txt");
    await fs.writeFile(sourceFile, "test content");

    // Create existing file at destination with same content
    const dest1File = path.join(dest1Dir, "test.txt");
    await fs.writeFile(dest1File, "test content");

    // Copy mtime from source to dest (so they match)
    const sourceStat = await fs.stat(sourceFile);
    await fs.utimes(dest1File, sourceStat.atime, sourceStat.mtime);

    const engine = new SyncEngine();

    // Sync
    const result = await engine.sync([sourceFile], [dest1Dir], {
      compareMethod: "size-mtime",
    });

    // File should be skipped
    expect(result.itemsSkipped).toBe(1);
    expect(result.itemsCompleted).toBe(0);
  });

  // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-DIRECTORY_TREE]: how: sourceBase maps nested sources to matching subpaths under each destination
  it("should sync nested source paths when sourceBase provided [REQ-DIRECTORY_TREE]", async () => {
    const subDir = path.join(sourceDir, "sub");
    await fs.mkdir(subDir);
    const sourceFile = path.join(subDir, "nested.txt");
    await fs.writeFile(sourceFile, "nested content");

    const engine = new SyncEngine();
    const result = await engine.sync([sourceFile], [dest1Dir, dest2Dir], {
      compareMethod: "size-mtime",
      sourceBase: sourceDir,
    });

    expect(result.itemsCompleted).toBe(1);

    const dest1File = path.join(dest1Dir, "sub", "nested.txt");
    const dest2File = path.join(dest2Dir, "sub", "nested.txt");

    const [dest1Content, dest2Content] = await Promise.all([
      fs.readFile(dest1File, "utf-8"),
      fs.readFile(dest2File, "utf-8"),
    ]);

    expect(dest1Content).toBe("nested content");
    expect(dest2Content).toBe("nested content");
  });

  // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: onStart(plan), onItemStart, onItemProgress, onItemComplete, onProgress(stats), onFinish(result)
  it("should call observer callbacks [REQ-SDK_OBSERVER]", async () => {
    const sourceFile = path.join(sourceDir, "test.txt");
    await fs.writeFile(sourceFile, "test content");

    const calls: string[] = [];

    const observer: SyncObserver = {
      onStart: () => calls.push("start"),
      onItemStart: () => calls.push("itemStart"),
      onItemProgress: () => calls.push("itemProgress"),
      onItemComplete: () => calls.push("itemComplete"),
      onProgress: () => calls.push("progress"),
      onFinish: () => calls.push("finish"),
    };

    const engine = new SyncEngine(observer);
    await engine.sync([sourceFile], [dest1Dir], {});

    // Verify observer was called
    expect(calls).toContain("start");
    expect(calls).toContain("itemStart");
    expect(calls).toContain("itemComplete");
    expect(calls).toContain("finish");
  });

  // [IMPL-NSYNC_ENGINE] [IMPL-NSYNC_OPERATIONS] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: after source loop, delete each source in sourcesToDelete when move AND NOT cancelled AND NOT storeFailureAbort
  it("should handle move semantics [REQ-MOVE_SEMANTICS] [IMPL-NSYNC_OPERATIONS]", async () => {
    // Create source file
    const sourceFile = path.join(sourceDir, "test.txt");
    await fs.writeFile(sourceFile, "test content");

    const engine = new SyncEngine();

    // Move to destinations
    const result = await engine.sync([sourceFile], [dest1Dir, dest2Dir], {
      move: true,
    });

    // Verify result
    expect(result.itemsCompleted).toBe(1);

    // Verify files exist at destinations
    const dest1File = path.join(dest1Dir, "test.txt");
    const dest2File = path.join(dest2Dir, "test.txt");

    const [dest1Content, dest2Content] = await Promise.all([
      fs.readFile(dest1File, "utf-8"),
      fs.readFile(dest2File, "utf-8"),
    ]);

    expect(dest1Content).toBe("test content");
    expect(dest2Content).toBe("test content");

    // Verify source was deleted
    await expect(fs.access(sourceFile)).rejects.toThrow();
  });

  // [IMPL-NSYNC_VERIFY] [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: sync with verifyDestination and hash compare verifies copied file
  it("should verify destination when verifyDestination enabled [IMPL-NSYNC_VERIFY] [IMPL-NSYNC_HASH]", async () => {
    const sourceFile = path.join(sourceDir, "verify.txt");
    await fs.writeFile(sourceFile, "verify destination content");

    const engine = new SyncEngine();
    const result = await engine.sync([sourceFile], [dest1Dir], {
      compareMethod: "hash",
      verifyDestination: true,
      hashAlgorithm: "blake3",
    });

    expect(result.itemsCompleted).toBe(1);
    expect(result.itemsFailed).toBe(0);

    const destFile = path.join(dest1Dir, "verify.txt");
    const destContent = await fs.readFile(destFile, "utf-8");
    expect(destContent).toBe("verify destination content");
  });

  // [IMPL-NSYNC_TYPE_SAFETY]: how: normalize bigint stat.size when building sync plan and item sizes
  it("should sync when stat.size is bigint [IMPL-NSYNC_TYPE_SAFETY]", async () => {
    const sourceFile = path.join(sourceDir, "bigint.txt");
    await fs.writeFile(sourceFile, "bigint size content");

    const statSpy = vi.spyOn(operations, "getFileStat").mockImplementation(async (filePath) => {
      const stat = await fs.stat(filePath);
      return Object.assign(stat, { size: BigInt(stat.size) });
    });

    try {
      const engine = new SyncEngine();
      const result = await engine.sync([sourceFile], [dest1Dir], {
        compareMethod: "size-mtime",
      });

      expect(result.itemsCompleted).toBe(1);
      expect(result.itemsFailed).toBe(0);
    } finally {
      statSpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]: how: StoreUnavailable streak at threshold marks store unavailable
  it("should mark store unavailable after threshold errors [IMPL-NSYNC_STORE]", () => {
    const monitor = new StoreMonitor(3);
    const destPath = path.join(dest1Dir, "file.txt");

    expect(monitor.recordError(destPath, ErrorClass.StoreUnavailable)).toBe(false);
    expect(monitor.recordError(destPath, ErrorClass.StoreUnavailable)).toBe(false);
    expect(monitor.recordError(destPath, ErrorClass.StoreUnavailable)).toBe(true);
    expect(monitor.hasUnavailableStore()).toBe(true);
  });
});

describe("Hybrid move plan [REQ-NSYNC_HYBRID_MOVE] [IMPL-NSYNC_ENGINE]", () => {
  let tempDir: string;
  let sourceDir: string;
  let destSameDir: string;
  let destCrossDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hybrid-move-"));
    sourceDir = path.join(tempDir, "volA", "source");
    destSameDir = path.join(tempDir, "volA", "destSame");
    destCrossDir = path.join(tempDir, "volB", "destCross");
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(destSameDir, { recursive: true });
    await fs.mkdir(destCrossDir, { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: A+A+B — one cross-volume copy, one rename, no deferred delete
  it("mixed same-volume + cross-volume uses one copy, one rename, no deferred delete", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "hybrid content");

    const destSameFile = path.join(destSameDir, "file.txt");
    const destCrossFile = path.join(destCrossDir, "file.txt");

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp === sourceFile || fp === sourceDir || fp === path.dirname(sourceFile)) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destSameDir) || fp === destSameDir) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const copySpy = vi.spyOn(operations, "copyFile");
    const renameSpy = vi.spyOn(operations, "renameFile");
    const deleteSpy = vi.spyOn(operations, "deleteFile");

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destSameDir, destCrossDir],
        { move: true, compareMethod: "none" }
      );

      expect(result.itemsCompleted).toBe(1);
      expect(copySpy).toHaveBeenCalledTimes(1);
      expect(copySpy.mock.calls[0]![1]).toBe(destCrossFile);
      expect(renameSpy).toHaveBeenCalledTimes(1);
      expect(renameSpy.mock.calls[0]![1]).toBe(destSameFile);
      expect(deleteSpy).not.toHaveBeenCalled();

      expect(await fs.readFile(destCrossFile, "utf-8")).toBe("hybrid content");
      expect(await fs.readFile(destSameFile, "utf-8")).toBe("hybrid content");
      await expect(fs.access(sourceFile)).rejects.toThrow();
    } finally {
      statSpy.mockRestore();
      copySpy.mockRestore();
      renameSpy.mockRestore();
      deleteSpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: partial failure before rename preserves source
  it("partial failure before rename preserves source path", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "preserve me");

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const copySpy = vi.spyOn(operations, "copyFile").mockRejectedValueOnce(
      new Error("cross-volume copy failed")
    );
    const renameSpy = vi.spyOn(operations, "renameFile");

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destSameDir, destCrossDir],
        { move: true, compareMethod: "none" }
      );

      expect(result.itemsFailed).toBe(1);
      expect(renameSpy).not.toHaveBeenCalled();
      expect(await fs.readFile(sourceFile, "utf-8")).toBe("preserve me");
    } finally {
      statSpy.mockRestore();
      copySpy.mockRestore();
      renameSpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_OPERATIONS] [IMPL-MOVE_EXECUTOR] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: EXDEV on rename leg despite dev match falls back to copy+delete
  it("rename leg falls back to copy+delete when renameOrMove simulates EXDEV fallback", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "exdev fallback");

    const destSameFile = path.join(destSameDir, "file.txt");
    const destCrossFile = path.join(destCrossDir, "file.txt");

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp === sourceFile || fp.startsWith(sourceDir) || fp.startsWith(destSameDir)) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const renameOrMoveSpy = vi
      .spyOn(moveExecutor, "renameOrMove")
      .mockImplementation(async (src, dest, deps) => {
        await deps.copyFile(src, dest);
        await deps.deleteFile(src);
      });

    const copySpy = vi.spyOn(operations, "copyFile");

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destSameDir, destCrossDir],
        { move: true, compareMethod: "none" }
      );

      expect(result.itemsCompleted).toBe(1);
      expect(renameOrMoveSpy).toHaveBeenCalledTimes(1);
      expect(renameOrMoveSpy.mock.calls[0]![1]).toBe(destSameFile);
      // copyFile spy sees cross-volume leg only; EXDEV fallback uses module-internal copyFile ref
      expect(copySpy).toHaveBeenCalledTimes(1);
      expect(copySpy.mock.calls[0]![1]).toBe(destCrossFile);

      expect(await fs.readFile(destCrossFile, "utf-8")).toBe("exdev fallback");
      expect(await fs.readFile(destSameFile, "utf-8")).toBe("exdev fallback");
      await expect(fs.access(sourceFile)).rejects.toThrow();
    } finally {
      statSpy.mockRestore();
      renameOrMoveSpy.mockRestore();
      copySpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_ENGINE] [REQ-VERIFY_DEST] [REQ-NSYNC_HYBRID_MOVE]: skip post-rename verify on atomic same-volume rename leg
  it("skips verifyDestination after successful rename leg when verify enabled", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "verify skip rename");

    const destSameFile = path.join(destSameDir, "file.txt");
    const destCrossFile = path.join(destCrossDir, "file.txt");

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp === sourceFile || fp.startsWith(sourceDir) || fp.startsWith(destSameDir)) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const hashSpy = vi.spyOn(hash, "computeFileHash").mockResolvedValue("abc123hash");
    const verifySpy = vi.spyOn(verify, "verifyDestination").mockResolvedValue(true);

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destSameDir, destCrossDir],
        { move: true, compareMethod: "none", verifyDestination: true }
      );

      expect(result.itemsCompleted).toBe(1);
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0]![1]).toBe(destCrossFile);
      expect(await fs.readFile(destSameFile, "utf-8")).toBe("verify skip rename");
    } finally {
      statSpy.mockRestore();
      hashSpy.mockRestore();
      verifySpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_ENGINE] [REQ-VERIFY_DEST] [REQ-NSYNC_HYBRID_MOVE]: cross-volume copy legs still verify when enabled
  it("still verifies cross-volume copy legs when verify enabled", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "verify copy legs");

    const destCross2Dir = path.join(tempDir, "volC", "destCross2");
    await fs.mkdir(destCross2Dir, { recursive: true });

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp === sourceFile || fp.startsWith(sourceDir)) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      if (fp.startsWith(destCross2Dir) || fp === destCross2Dir) {
        return Object.assign(realStat, { dev: 3 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const hashSpy = vi.spyOn(hash, "computeFileHash").mockResolvedValue("abc123hash");
    const verifySpy = vi.spyOn(verify, "verifyDestination").mockResolvedValue(true);

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destCrossDir, destCross2Dir],
        { move: true, compareMethod: "none", verifyDestination: true }
      );

      expect(result.itemsCompleted).toBe(1);
      expect(verifySpy).toHaveBeenCalledTimes(2);
    } finally {
      statSpy.mockRestore();
      hashSpy.mockRestore();
      verifySpy.mockRestore();
    }
  });

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_HYBRID_MOVE]: all cross-volume — deferred delete still runs
  it("all cross-volume destinations still use deferred delete", async () => {
    const sourceFile = path.join(sourceDir, "file.txt");
    await fs.writeFile(sourceFile, "cross only");

    const destCross2Dir = path.join(tempDir, "volC", "destCross2");
    await fs.mkdir(destCross2Dir, { recursive: true });

    const statSpy = vi.spyOn(fs, "stat").mockImplementation(async (p) => {
      const realStat = await (await import("fs/promises")).stat(String(p));
      const fp = String(p);
      if (fp === sourceFile || fp.startsWith(sourceDir)) {
        return Object.assign(realStat, { dev: 1 });
      }
      if (fp.startsWith(destCrossDir) || fp === destCrossDir) {
        return Object.assign(realStat, { dev: 2 });
      }
      if (fp.startsWith(destCross2Dir) || fp === destCross2Dir) {
        return Object.assign(realStat, { dev: 3 });
      }
      return Object.assign(realStat, { dev: 1 });
    });

    const copySpy = vi.spyOn(operations, "copyFile");
    const renameSpy = vi.spyOn(operations, "renameFile");
    const deleteSpy = vi.spyOn(operations, "deleteFile");

    try {
      const engine = new SyncEngine();
      const result = await engine.sync(
        [sourceFile],
        [destCrossDir, destCross2Dir],
        { move: true, compareMethod: "none" }
      );

      expect(result.itemsCompleted).toBe(1);
      expect(copySpy).toHaveBeenCalledTimes(2);
      expect(renameSpy).not.toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy.mock.calls[0]![0]).toBe(sourceFile);
      await expect(fs.access(sourceFile)).rejects.toThrow();
    } finally {
      statSpy.mockRestore();
      copySpy.mockRestore();
      renameSpy.mockRestore();
      deleteSpy.mockRestore();
    }
  });
});
