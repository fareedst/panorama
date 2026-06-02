// [IMPL-DIRECTORY_TREE] [IMPL-PANE_DISPLAY_FILTER_UI] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-PANE_DISPLAY_FILTER]

import { describe, expect, it } from "vitest";
import type { FileStat } from "./files.types";
import type { DisplayFilterSpec } from "./display-filter.types";
import {
  createPaneTreeFromRootListing,
  processListingForTreeLevel,
  reflattenPaneTree,
  syncPaneFromTree,
  type PaneWithTree,
} from "./pane-file-tree";
import type { FileTreeRow } from "./file-tree";

function file(name: string, dirPath: string, isDirectory = false): FileStat {
  const path = `${dirPath}/${name}`.replace(/\/+/g, "/");
  return {
    name,
    path,
    isDirectory,
    size: isDirectory ? 0 : 100,
    mtime: new Date("2026-01-01"),
    extension: isDirectory ? "" : name.includes(".") ? name.slice(name.lastIndexOf(".")) : "",
  };
}

function basePane(path: string): PaneWithTree {
  return {
    path,
    files: [],
    cursor: 0,
    marks: new Set<string>(),
    sortBy: "name",
    sortDirection: "asc",
    sortDirsFirst: true,
    activeDisplaySpecId: null,
    loadedSpecVersion: null,
    hiddenCount: 0,
    rawFileCount: 0,
    treeState: {
      basePath: path,
      expandedPaths: new Set<string>(),
      childrenByPath: new Map(),
    },
  };
}

const sortOptions = {
  sortBy: "name" as const,
  sortDirection: "asc" as const,
  sortDirsFirst: true,
};

describe("pane-file-tree [IMPL-DIRECTORY_TREE]", () => {
  // [IMPL-DIRECTORY_TREE] processListingForTreeLevel — filter one tree level when spec active
  it("processListingForTreeLevel applies display spec client-side [REQ-PANE_DISPLAY_FILTER]", () => {
    const base = "/home/user";
    const raw = [file("keep.txt", base), file("skip.tmp", base)];
    const spec: DisplayFilterSpec = {
      id: "spec-1",
      name: "No tmp",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      rules: [
        {
          id: "r1",
          action: "exclude",
          target: "file",
          pattern: "*.tmp",
          order: 0,
          enabled: true,
        },
      ],
    };
    const result = processListingForTreeLevel(raw, spec, false, sortOptions);
    expect(result.files.map((f) => f.name)).toEqual(["keep.txt"]);
    expect(result.hiddenCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  // [IMPL-DIRECTORY_TREE] createPaneTreeFromRootListing — HANDLE_NAVIGATE_TREE_RESET seeds visible root rows
  it("createPaneTreeFromRootListing — first level visible, nothing expanded [REQ-DIRECTORY_TREE]", () => {
    const base = "/home/user";
    const pane = basePane(base);
    const rootChildren = [file("Docs", base, true), file("readme.txt", base)];
    const withTree = createPaneTreeFromRootListing(pane, rootChildren);
    expect(withTree.files).toHaveLength(2);
    expect(withTree.treeState.expandedPaths.size).toBe(0);
    expect(withTree.files.every((r) => (r as FileTreeRow).depth === 0)).toBe(true);
  });

  // [IMPL-DIRECTORY_TREE] syncPaneFromTree — RECONCILE_TREE_SELECTION drops marks not in visible rows
  it("syncPaneFromTree reconciles path-keyed marks [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]", () => {
    const base = "/home/user";
    let pane = createPaneTreeFromRootListing(basePane(base), [
      file("a.txt", base),
      file("b.txt", base),
    ]);
    pane = {
      ...pane,
      marks: new Set(["/home/user/a.txt", "/home/user/gone.txt"]),
      cursor: 5,
    };
    const synced = syncPaneFromTree(pane);
    expect(synced.marks).toEqual(new Set(["/home/user/a.txt"]));
    expect(synced.cursor).toBe(1);
  });

  // [IMPL-DIRECTORY_TREE] reflattenPaneTree — sort change re-flattens without losing expandedPaths
  it("reflattenPaneTree preserves expanded tree after sort change [REQ-DIRECTORY_TREE]", () => {
    const base = "/home/user";
    const docsPath = "/home/user/Docs";
    let pane = createPaneTreeFromRootListing(basePane(base), [file("Docs", base, true)]);
    pane.treeState.childrenByPath.set(docsPath, [file("z.txt", docsPath), file("a.txt", docsPath)]);
    pane.treeState.expandedPaths.add(docsPath);
    pane = syncPaneFromTree(pane);
    expect(pane.files.map((r) => r.name)).toEqual(["Docs", "a.txt", "z.txt"]);

    const resorted = reflattenPaneTree({
      ...pane,
      sortBy: "name",
      sortDirection: "desc",
    });
    expect(resorted.treeState.expandedPaths.has(docsPath)).toBe(true);
    expect(
      (resorted.files as FileTreeRow[])
        .filter((r) => r.depth === 1)
        .map((r) => r.name),
    ).toEqual(["z.txt", "a.txt"]);
  });
});
