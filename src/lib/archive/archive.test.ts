// [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Archive domain unit tests — Tranches 1–2
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ArchiveError,
  ARCHIVE_LIMITS,
  decodeVirtualArchivePath,
  detectArchiveFormat,
  encodeVirtualArchivePath,
  extractArchiveEntry,
  isVirtualArchivePath,
  normalizeArchiveEntryPath,
  projectArchiveDirectory,
  readArchiveManifest,
  validateArchiveEntryPath,
} from "./index";
import {
  cleanupArchiveFixtures,
  createArchiveFixtures,
  type FixturePaths,
} from "./test-fixtures";

describe("virtual archive path [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  it("round-trips root and nested entry paths", () => {
    const archivePath = "/tmp/data/archive.zip";
    const root = encodeVirtualArchivePath(archivePath, "");
    expect(root.startsWith("@archive/v1/")).toBe(true);
    expect(decodeVirtualArchivePath(root)).toEqual({
      archivePath,
      entryPath: "",
    });

    const nested = encodeVirtualArchivePath(archivePath, "docs/guide.txt");
    expect(decodeVirtualArchivePath(nested)).toEqual({
      archivePath,
      entryPath: "docs/guide.txt",
    });
  });

  it("rejects malformed prefix and invalid payload", () => {
    expect(() => decodeVirtualArchivePath("/ordinary/path")).toThrow(ArchiveError);
    expect(() => decodeVirtualArchivePath("@archive/v1/not-valid-base64!!!")).toThrow(
      ArchiveError,
    );
    const badPayload = encodeVirtualArchivePath("/safe/archive.zip", "").replace(
      "@archive/v1/",
      "@archive/v1/",
    );
    const tampered = `@archive/v1_${badPayload.slice("@archive/v1/".length)}`;
    expect(() => decodeVirtualArchivePath(tampered)).toThrow(ArchiveError);
  });

  it("rejects archive path containing ..", () => {
    expect(() => encodeVirtualArchivePath("/tmp/../etc/passwd.zip", "")).toThrow(
      ArchiveError,
    );
  });

  it("normalizes entry path separators", () => {
    expect(normalizeArchiveEntryPath("\\docs\\guide.txt")).toBe("docs/guide.txt");
    expect(isVirtualArchivePath("@archive/v1/abc")).toBe(true);
    expect(isVirtualArchivePath("/tmp/file.zip")).toBe(false);
  });
});

describe("format registry [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  it("detects supported v1 formats", () => {
    expect(detectArchiveFormat("/data/file.zip").canList).toBe(true);
    expect(detectArchiveFormat("/data/file.tar").formatKey).toBe("tar");
    expect(detectArchiveFormat("/data/file.tar.gz").formatKey).toBe("tar.gz");
    expect(detectArchiveFormat("/data/file.tgz").formatKey).toBe("tar.gz");
  });

  it("returns FORMAT_UNSUPPORTED for deferred formats without throwing", () => {
    for (const file of ["/a.7z", "/a.rar", "/a.tar.bz2", "/a.tbz2"]) {
      const result = detectArchiveFormat(file);
      expect(result.canList).toBe(false);
      expect(result.errorCode).toBe("FORMAT_UNSUPPORTED");
    }
  });
});

describe("entry path safety [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  it("rejects traversal and absolute paths", () => {
    expect(() => validateArchiveEntryPath("../outside")).toThrow(ArchiveError);
    expect(() => validateArchiveEntryPath("/etc/passwd")).toThrow(ArchiveError);
    expect(() => validateArchiveEntryPath("C:\\Windows\\file.txt")).toThrow(ArchiveError);
  });
});

describe("archive manifest and projection [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  let fixtures: FixturePaths;

  beforeAll(async () => {
    fixtures = await createArchiveFixtures();
  }, 30_000);

  afterAll(() => {
    cleanupArchiveFixtures(fixtures);
  });

  it("lists ZIP entries with archiveSource metadata", async () => {
    const files = await projectArchiveDirectory(fixtures.sampleZip, "");
    const names = files.map((f) => f.name).sort();
    expect(names).toContain("readme.txt");
    expect(names).toContain("docs");
    expect(names).toContain("nested.zip");

    const readme = files.find((f) => f.name === "readme.txt");
    expect(readme?.archiveSource).toMatchObject({
      archivePath: fixtures.sampleZip,
      entryPath: "readme.txt",
      isArchiveRoot: true,
      readOnly: true,
      format: "zip",
    });
    expect(readme?.path.startsWith("@archive/v1/")).toBe(true);
  });

  it("projects nested ZIP directory entries", async () => {
    const files = await projectArchiveDirectory(fixtures.sampleZip, "docs");
    expect(files.map((f) => f.name)).toEqual(["guide.txt"]);
  });

  it("lists TAR and TAR.GZ fixtures", async () => {
    const tarFiles = await projectArchiveDirectory(fixtures.sampleTar, "");
    expect(tarFiles.map((f) => f.name).sort()).toEqual(["alpha.txt", "link", "subdir"]);

    const tarGzFiles = await projectArchiveDirectory(fixtures.sampleTarGz, "");
    expect(tarGzFiles.map((f) => f.name).sort()).toEqual(["folder", "gzip.txt"]);
  });

  it("lists symlink entries and keeps nested zip opaque", async () => {
    const manifest = await readArchiveManifest(fixtures.sampleTar);
    const link = manifest.find((e) => e.path === "link");
    expect(link?.isSymlink).toBe(true);

    const nested = (await projectArchiveDirectory(fixtures.sampleZip, "")).find(
      (f) => f.name === "nested.zip",
    );
    expect(nested?.isDirectory).toBe(false);
  });

  it("throws FORMAT_UNSUPPORTED for deferred adapters", async () => {
    await expect(readArchiveManifest(fixtures.unsupported7z)).rejects.toMatchObject({
      code: "FORMAT_UNSUPPORTED",
    });
    await expect(readArchiveManifest(fixtures.unsupportedRar)).rejects.toMatchObject({
      code: "FORMAT_UNSUPPORTED",
    });
    await expect(readArchiveManifest(fixtures.unsupportedTarBz2)).rejects.toMatchObject({
      code: "FORMAT_UNSUPPORTED",
    });
  });
});

describe("archive extraction [REQ-ARCHIVE_DIRECTORY_PANES] [REQ-COPY_OPERATIONS]", () => {
  let fixtures: FixturePaths;
  let extractDir: string;

  beforeAll(async () => {
    fixtures = await createArchiveFixtures();
    extractDir = path.join(fixtures.root, "extract-out");
    fs.mkdirSync(extractDir, { recursive: true });
  }, 30_000);

  afterAll(() => {
    cleanupArchiveFixtures(fixtures);
  });

  function sha256File(filePath: string): string {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  }

  function archiveFingerprint(archivePath: string): { size: number; mtimeMs: number } {
    const stat = fs.statSync(archivePath);
    return { size: stat.size, mtimeMs: stat.mtimeMs };
  }

  it("extracts ZIP file entry with matching bytes and preserves archive immutability", async () => {
    const dest = path.join(extractDir, "readme-from-zip.txt");
    const before = archiveFingerprint(fixtures.sampleZip);

    await extractArchiveEntry(fixtures.sampleZip, "readme.txt", dest);

    expect(fs.readFileSync(dest, "utf8")).toBe("hello zip");
    expect(sha256File(dest)).toBe(
      crypto.createHash("sha256").update("hello zip").digest("hex"),
    );
    const after = archiveFingerprint(fixtures.sampleZip);
    expect(after).toEqual(before);
  });

  it("extracts TAR and TAR.GZ file entries", async () => {
    const tarDest = path.join(extractDir, "alpha-from-tar.txt");
    await extractArchiveEntry(fixtures.sampleTar, "alpha.txt", tarDest);
    expect(fs.readFileSync(tarDest, "utf8")).toBe("tar file");

    const gzDest = path.join(extractDir, "gzip-from-tar.gz.txt");
    await extractArchiveEntry(fixtures.sampleTarGz, "gzip.txt", gzDest);
    expect(fs.readFileSync(gzDest, "utf8")).toBe("tar gz content");
  });

  it("rejects directory and symlink entries", async () => {
    await expect(
      extractArchiveEntry(fixtures.sampleZip, "docs", path.join(extractDir, "docs-out")),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_ENTRY_TYPE" });

    await expect(
      extractArchiveEntry(fixtures.sampleTar, "link", path.join(extractDir, "link-out")),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_ENTRY_TYPE" });
  });

  it("applies entry mtime best-effort after extract", async () => {
    const dest = path.join(extractDir, "mtime-readme.txt");
    const manifest = await readArchiveManifest(fixtures.sampleZip);
    const readme = manifest.find((e) => e.path === "readme.txt");
    expect(readme).toBeDefined();

    await extractArchiveEntry(fixtures.sampleZip, "readme.txt", dest);

    const destStat = fs.statSync(dest);
    expect(Math.abs(destStat.mtimeMs - (readme?.mtime.getTime() ?? 0))).toBeLessThan(2000);
  });

  it("cleans up temp file on extract failure without leaving dest", async () => {
    const dest = path.join(extractDir, "missing-entry.txt");
    await expect(
      extractArchiveEntry(fixtures.sampleZip, "no-such-file.txt", dest),
    ).rejects.toBeDefined();
    expect(fs.existsSync(dest)).toBe(false);
    expect(fs.existsSync(`${dest}.extract-tmp`)).toBe(false);
  });

  it("aborts oversized entry without writing dest", async () => {
    const dest = path.join(extractDir, "oversized.txt");
    const limits = ARCHIVE_LIMITS as { maxSingleEntryUncompressedSize: number };
    const saved = limits.maxSingleEntryUncompressedSize;
    limits.maxSingleEntryUncompressedSize = 4;

    try {
      await expect(
        extractArchiveEntry(fixtures.sampleZip, "readme.txt", dest),
      ).rejects.toMatchObject({ code: "ENTRY_TOO_LARGE" });
      expect(fs.existsSync(dest)).toBe(false);
    } finally {
      limits.maxSingleEntryUncompressedSize = saved;
    }
  });
});
