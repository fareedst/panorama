// [IMPL-BULK_OPS] [IMPL-NSYNC_ENGINE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_TREE] [REQ-BULK_FILE_OPS] [REQ-NSYNC_MULTI_TARGET]

import { describe, it, expect } from "vitest";
import { isPathUnderBase, resolveCrossPaneDestPath } from "./cross-pane-path";

describe("resolveCrossPaneDestPath [REQ-DIRECTORY_TREE] [REQ-BULK_FILE_OPS]", () => {
  it("maps nested source under base to matching path under dest base", () => {
    expect(
      resolveCrossPaneDestPath("/alpha/sub/file.txt", "/alpha", "/beta"),
    ).toBe("/beta/sub/file.txt");
  });

  it("maps source at base root to dest base root", () => {
    expect(
      resolveCrossPaneDestPath("/alpha/file.txt", "/alpha", "/beta"),
    ).toBe("/beta/file.txt");
  });

  it("handles root source base with slice(1) rule", () => {
    expect(
      resolveCrossPaneDestPath("/Users/foo/bar.txt", "/", "/backup"),
    ).toBe("/backup/Users/foo/bar.txt");
  });

  it("normalizes trailing slashes on bases", () => {
    expect(
      resolveCrossPaneDestPath("/alpha/a/b.txt", "/alpha/", "/beta/"),
    ).toBe("/beta/a/b.txt");
  });

  it("throws when source is not under source base", () => {
    expect(() =>
      resolveCrossPaneDestPath("/other/file.txt", "/alpha", "/beta"),
    ).toThrow(/not under source base/i);
  });
});

describe("isPathUnderBase [REQ-DIRECTORY_TREE]", () => {
  it("returns true for source at or under base", () => {
    expect(isPathUnderBase("/alpha", "/alpha")).toBe(true);
    expect(isPathUnderBase("/alpha/sub", "/alpha")).toBe(true);
  });

  it("returns false when source is outside base", () => {
    expect(isPathUnderBase("/beta/file.txt", "/alpha")).toBe(false);
  });
});
