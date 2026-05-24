// [TEST-MOUSE_INTERACTION] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]
// FILE_COLUMN_CLIPBOARD — how: unit tests for formatters and cross-pane path resolution by cursor filename

import { describe, it, expect } from "vitest";
import type { FileStat } from "@/lib/files.types";
import {
  formatAbsolutePathForClipboard,
  formatCursorFilenameForClipboard,
  formatCrossPanePathsForClipboard,
  resolveCrossPanePathsForFilename,
} from "./file-column-clipboard";

function file(
  name: string,
  filePath: string,
  extension = "",
): FileStat {
  return {
    name,
    path: filePath,
    isDirectory: false,
    size: 0,
    mtime: new Date(),
    extension,
  };
}

describe("[TEST-MOUSE_INTERACTION] FILE_COLUMN_CLIPBOARD", () => {
  it("formatCursorFilenameForClipboard returns cursor filename (file.name)", () => {
    expect(
      formatCursorFilenameForClipboard(
        file("report.pdf", "/a/report.pdf", ".pdf"),
      ),
    ).toBe("report.pdf");
  });

  it("formatAbsolutePathForClipboard returns absolute path for clicked row", () => {
    expect(
      formatAbsolutePathForClipboard(
        file("report.pdf", "/workspace/docs/report.pdf", ".pdf"),
      ),
    ).toBe("/workspace/docs/report.pdf");
  });

  it("resolveCrossPanePathsForFilename finds matching name in each pane listing", () => {
    const panes: FileStat[][] = [
      [file("shared.txt", "/left/shared.txt", ".txt")],
      [
        file("other.md", "/right/other.md", ".md"),
        file("shared.txt", "/right/shared.txt", ".txt"),
      ],
      [file("unique.log", "/third/unique.log", ".log")],
    ];

    expect(resolveCrossPanePathsForFilename(panes, "shared.txt")).toEqual([
      { paneIndex: 0, path: "/left/shared.txt" },
      { paneIndex: 1, path: "/right/shared.txt" },
    ]);
  });

  it("resolveCrossPanePathsForFilename returns empty when basename missing from all listings", () => {
    const panes: FileStat[][] = [
      [file("alpha.txt", "/a/alpha.txt")],
      [file("beta.txt", "/b/beta.txt")],
    ];

    expect(resolveCrossPanePathsForFilename(panes, "missing.txt")).toEqual([]);
  });

  it("resolveCrossPanePathsForFilename returns single pane when name exists in one listing only", () => {
    const panes: FileStat[][] = [
      [file("only.here", "/a/only.here")],
      [file("other", "/b/other")],
    ];

    expect(resolveCrossPanePathsForFilename(panes, "only.here")).toEqual([
      { paneIndex: 0, path: "/a/only.here" },
    ]);
  });

  it("formatCrossPanePathsForClipboard joins pane-labeled paths", () => {
    expect(
      formatCrossPanePathsForClipboard([
        { paneIndex: 0, path: "/left/shared.txt" },
        { paneIndex: 2, path: "/right/shared.txt" },
      ]),
    ).toBe("Pane 1: /left/shared.txt\nPane 3: /right/shared.txt");
  });

  it("formatCrossPanePathsForClipboard returns empty string when no matches", () => {
    expect(formatCrossPanePathsForClipboard([])).toBe("");
  });
});
