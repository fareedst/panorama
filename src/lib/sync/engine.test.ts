// [TEST-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET]
// SyncEngine tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { SyncEngine } from "./engine";
import type { SyncObserver } from "../sync.types";

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

  it("should sync a file to multiple destinations [REQ-NSYNC_MULTI_TARGET]", async () => {
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

  it("should handle move semantics [REQ-MOVE_SEMANTICS]", async () => {
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
});
