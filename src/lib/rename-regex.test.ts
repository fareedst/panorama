// [TEST-RENAME_REGEX] [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]

import { describe, it, expect } from "vitest";
import {
  buildRenameRegexEntries,
  computeRenamedBasename,
  resolveRenameRegexBasenames,
  resolveRenameRegexPaths,
  validateRenameBasename,
} from "./rename-regex";
import type { FileStat } from "./files.types";

function file(
  name: string,
  filePath: string,
  isDirectory = false,
): FileStat {
  return {
    name,
    path: filePath,
    isDirectory,
    size: 100,
    mtime: new Date("2024-01-01T00:00:00.000Z"),
    extension: isDirectory ? "" : ".txt",
  };
}

describe("[TEST-RENAME_REGEX] validateRenameBasename [IMPL-RENAME_REGEX]", () => {
  // [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — reject empty, dot names, and path separators in result basename
  it("rejects empty and dot names", () => {
    expect(validateRenameBasename("")).toBe(false);
    expect(validateRenameBasename(".")).toBe(false);
    expect(validateRenameBasename("..")).toBe(false);
  });

  it("rejects path separators", () => {
    expect(validateRenameBasename("a/b")).toBe(false);
    expect(validateRenameBasename("a\\b")).toBe(false);
  });

  it("accepts normal basenames", () => {
    expect(validateRenameBasename("hello.txt")).toBe(true);
  });
});

describe("[TEST-RENAME_REGEX] computeRenamedBasename [IMPL-RENAME_REGEX]", () => {
  // [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — String.replace(RegExp); skip invalid pattern, no match, or unchanged result
  it("replaces first match with replacement", () => {
    expect(computeRenamedBasename("foo.txt", "\\.txt$", ".bak")).toBe(
      "foo.bak",
    );
  });

  it("returns null when pattern does not match", () => {
    expect(computeRenamedBasename("foo.txt", "^nomatch", "x")).toBeNull();
  });

  it("returns null for invalid regex", () => {
    expect(computeRenamedBasename("foo.txt", "(", "x")).toBeNull();
  });

  it("allows empty replacement", () => {
    expect(computeRenamedBasename("foo.txt", "\\.txt$", "")).toBe("foo");
  });
});

// [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — resolve basenames/paths via touch-file helpers; dedupe src; build { src, dest }
describe("[TEST-RENAME_REGEX] path resolution [IMPL-RENAME_REGEX]", () => {
  const panes: FileStat[][] = [
    [file("shared.txt", "/left/shared.txt"), file("other.log", "/left/other.log")],
    [file("shared.txt", "/right/shared.txt")],
  ];

  it("resolveRenameRegexBasenames uses marks when non-empty", () => {
    expect(
      resolveRenameRegexBasenames(new Set(["a", "b"]), panes[0][0]),
    ).toEqual(["a", "b"]);
  });

  it("resolveRenameRegexPaths allPanes returns cross-pane paths", () => {
    expect(
      resolveRenameRegexPaths("allPanes", 0, panes, ["shared.txt"]),
    ).toEqual([
      { path: "/left/shared.txt", basename: "shared.txt" },
      { path: "/right/shared.txt", basename: "shared.txt" },
    ]);
  });

  it("buildRenameRegexEntries skips non-matching files", () => {
    const entries = buildRenameRegexEntries(
      "thisPane",
      "^nomatch",
      "x",
      0,
      panes,
      new Set(["other.log"]),
      panes[0][0],
    );
    expect(entries).toEqual([]);
  });

  it("buildRenameRegexEntries renames marked files in this pane", () => {
    const entries = buildRenameRegexEntries(
      "thisPane",
      "\\.log$",
      ".bak",
      0,
      panes,
      new Set(["other.log"]),
      panes[0][0],
    );
    expect(entries).toEqual([
      { src: "/left/other.log", dest: "/left/other.bak" },
    ]);
  });

  it("buildRenameRegexEntries dedupes and handles allPanes", () => {
    const entries = buildRenameRegexEntries(
      "allPanes",
      "\\.txt$",
      ".bak",
      0,
      panes,
      new Set(),
      panes[0][0],
    );
    expect(entries).toEqual([
      { src: "/left/shared.txt", dest: "/left/shared.bak" },
      { src: "/right/shared.txt", dest: "/right/shared.bak" },
    ]);
  });
});
