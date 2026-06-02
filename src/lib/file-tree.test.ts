// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]

import { describe, expect, it } from "vitest";
import type { FileStat } from "./files.types";
import {
  collectLoadedPaths,
  createInitialTreeState,
  flattenVisibleRows,
  reconcileTreeSelection,
  setChildren,
  toggleExpanded,
  type FileTreeRow,
  type FileTreeSortOptions,
} from "./file-tree";

function file(
  name: string,
  dirPath: string,
  isDirectory = false,
): FileStat {
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

const sortOptions: FileTreeSortOptions = {
  sortBy: "name",
  sortDirection: "asc",
  sortDirsFirst: true,
};

describe("file-tree [IMPL-DIRECTORY_TREE]", () => {
  it("CREATE_INITIAL_TREE_STATE — root children loaded, nothing expanded", () => {
    const base = "/home/user";
    const rootChildren = [
      file("Docs", base, true),
      file("readme.txt", base),
    ];
    const state = createInitialTreeState(base, rootChildren);
    expect(state.basePath).toBe(base);
    expect(state.expandedPaths.size).toBe(0);
    expect(state.childrenByPath.get(base)).toHaveLength(2);
  });

  it("FLATTEN_VISIBLE_ROWS — first level only when collapsed", () => {
    const base = "/home/user";
    const state = createInitialTreeState(base, [
      file("Docs", base, true),
      file("readme.txt", base),
    ]);
    const rows = flattenVisibleRows(state, sortOptions);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name)).toEqual(["Docs", "readme.txt"]);
    expect(rows.every((r) => r.depth === 0)).toBe(true);
  });

  it("TOGGLE_EXPANDED and FLATTEN — multi-level when expanded", () => {
    const base = "/home/user";
    const docsPath = "/home/user/Docs";
    let state = createInitialTreeState(base, [file("Docs", base, true)]);
    state = setChildren(state, docsPath, [
      file("nested.txt", docsPath),
      file("Sub", docsPath, true),
    ], sortOptions);
    state = toggleExpanded(state, docsPath);
    const rows = flattenVisibleRows(state, sortOptions);
    expect(rows.map((r) => `${r.depth}:${r.name}`)).toEqual([
      "0:Docs",
      "1:Sub",
      "1:nested.txt",
    ]);
    expect(rows[0].isExpanded).toBe(true);
    expect(rows[0].hasLoadedChildren).toBe(true);
  });

  it("TOGGLE_EXPANDED — collapse removes descendants from visible rows", () => {
    const base = "/home/user";
    const docsPath = "/home/user/Docs";
    let state = createInitialTreeState(base, [file("Docs", base, true)]);
    state = setChildren(state, docsPath, [file("nested.txt", docsPath)], sortOptions);
    state = toggleExpanded(state, docsPath);
    state = toggleExpanded(state, docsPath);
    const rows = flattenVisibleRows(state, sortOptions);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Docs");
    expect(rows[0].isExpanded).toBe(false);
  });

  it("duplicate basenames under different parents produce distinct paths", () => {
    const base = "/home/user";
    const aPath = "/home/user/A";
    const bPath = "/home/user/B";
    let state = createInitialTreeState(base, [
      file("A", base, true),
      file("B", base, true),
    ]);
    state = setChildren(state, aPath, [file("same.txt", aPath)], sortOptions);
    state = setChildren(state, bPath, [file("same.txt", bPath)], sortOptions);
    state = toggleExpanded(state, aPath);
    state = toggleExpanded(state, bPath);
    const rows = flattenVisibleRows(state, sortOptions);
    const sameRows = rows.filter((r) => r.name === "same.txt");
    expect(sameRows).toHaveLength(2);
    expect(sameRows[0].path).not.toBe(sameRows[1].path);
  });

  it("RECONCILE_TREE_SELECTION — path-based marks and cursor clamp", () => {
    const rows: FileTreeRow[] = [
      { ...file("a.txt", "/tmp"), depth: 0, isExpanded: false, hasLoadedChildren: false },
      { ...file("b.txt", "/tmp"), depth: 0, isExpanded: false, hasLoadedChildren: false },
    ];
    const result = reconcileTreeSelection(rows, new Set(["/tmp/a.txt", "/tmp/gone"]), 5);
    expect(result.marks).toEqual(new Set(["/tmp/a.txt"]));
    expect(result.cursor).toBe(1);
  });

  it("collectLoadedPaths — base plus expanded dirs with cached children", () => {
    const base = "/home/user";
    const docsPath = "/home/user/Docs";
    let state = createInitialTreeState(base, [file("Docs", base, true)]);
    state = setChildren(state, docsPath, [file("x.txt", docsPath)], sortOptions);
    state = toggleExpanded(state, docsPath);
    const paths = collectLoadedPaths(state);
    expect(paths).toContain(base);
    expect(paths).toContain(docsPath);
  });
});
