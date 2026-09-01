// [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Client-safe archive locator codec tests
import { describe, it, expect } from "vitest";
import {
  ArchivePathClientError,
  decodeVirtualArchivePath,
  encodeVirtualArchivePath,
  isHostArchiveFilePath,
  isOpenableHostArchiveFile,
  isVirtualArchivePath,
} from "./archive-path-client";

describe("archive-path-client [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
  it("round-trips root and nested entry paths", () => {
    const archivePath = "/data/sample.zip";
    const root = encodeVirtualArchivePath(archivePath, "");
    expect(isVirtualArchivePath(root)).toBe(true);
    expect(decodeVirtualArchivePath(root)).toEqual({
      archivePath,
      entryPath: "",
    });

    const nested = encodeVirtualArchivePath(archivePath, "docs/readme.txt");
    expect(decodeVirtualArchivePath(nested)).toEqual({
      archivePath,
      entryPath: "docs/readme.txt",
    });
  });

  it("rejects malformed locators", () => {
    expect(() => decodeVirtualArchivePath("/ordinary/path")).toThrow(
      ArchivePathClientError,
    );
    expect(() => encodeVirtualArchivePath("/tmp/../secret.zip", "")).toThrow(
      ArchivePathClientError,
    );
  });

  it("detects host archive file extensions", () => {
    expect(isHostArchiveFilePath("/tmp/a.zip")).toBe(true);
    expect(isHostArchiveFilePath("/tmp/a.tar.gz")).toBe(true);
    expect(isHostArchiveFilePath("/tmp/a.tgz")).toBe(true);
    expect(isHostArchiveFilePath("/tmp/a.tar")).toBe(true);
    expect(isHostArchiveFilePath("/tmp/a.txt")).toBe(false);
  });

  it("isOpenableHostArchiveFile rejects directories and virtual paths", () => {
    const locator = encodeVirtualArchivePath("/tmp/nested.zip", "inner.zip");
    expect(
      isOpenableHostArchiveFile({
        path: "/tmp/sample.zip",
        isDirectory: false,
      }),
    ).toBe(true);
    expect(
      isOpenableHostArchiveFile({
        path: locator,
        isDirectory: false,
      }),
    ).toBe(false);
    expect(
      isOpenableHostArchiveFile({
        path: "/tmp/dir",
        isDirectory: true,
      }),
    ).toBe(false);
  });
});
