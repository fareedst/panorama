// [TEST-MAKE_DIRECTORY] [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]

import { describe, it, expect } from "vitest";
import { buildMakeDirectoryEntries } from "./make-directory";

describe("[TEST-MAKE_DIRECTORY] buildMakeDirectoryEntries [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]", () => {
  const panes = [{ path: "/left" }, { path: "/right" }];

  it("creates one entry under initiating pane for thisPane", () => {
    const entries = buildMakeDirectoryEntries("thisPane", "newdir", 0, panes);
    expect(entries).toEqual([{ paneIndex: 0, path: "/left/newdir" }]);
  });

  it("creates entry per pane for allPanes", () => {
    const entries = buildMakeDirectoryEntries("allPanes", "shared", 1, panes);
    expect(entries).toEqual([
      { paneIndex: 0, path: "/left/shared" },
      { paneIndex: 1, path: "/right/shared" },
    ]);
  });

  it("returns empty when dirname invalid", () => {
    expect(buildMakeDirectoryEntries("thisPane", "", 0, panes)).toEqual([]);
    expect(buildMakeDirectoryEntries("thisPane", ".", 0, panes)).toEqual([]);
    expect(buildMakeDirectoryEntries("thisPane", "..", 0, panes)).toEqual([]);
    expect(buildMakeDirectoryEntries("thisPane", "a/b", 0, panes)).toEqual([]);
  });

  it("returns empty when initiating pane missing for thisPane", () => {
    expect(buildMakeDirectoryEntries("thisPane", "dir", 5, panes)).toEqual([]);
  });

  it("trims dirname before validation", () => {
    const entries = buildMakeDirectoryEntries("thisPane", "  mydir  ", 0, panes);
    expect(entries).toEqual([{ paneIndex: 0, path: "/left/mydir" }]);
  });
});
