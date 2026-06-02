// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]

import type { FileStat } from "./files.types";
import { sortFiles, type SortCriterion, type SortDirection } from "./files.utils";

export interface FileTreeSortOptions {
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
}

export interface FileTreeState {
  basePath: string;
  expandedPaths: Set<string>;
  childrenByPath: Map<string, FileStat[]>;
}

export interface FileTreeRow extends FileStat {
  depth: number;
  hasLoadedChildren: boolean;
  isExpanded: boolean;
}

/** Test / flat-list compatibility — tree metadata optional on rows */
export type FileTreeRowLike = FileStat &
  Partial<Pick<FileTreeRow, "depth" | "hasLoadedChildren" | "isExpanded">>;

/** [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how — CREATE_INITIAL_TREE_STATE seeds root children; expandedPaths empty */
export function createInitialTreeState(
  basePath: string,
  rootChildren: FileStat[],
): FileTreeState {
  const childrenByPath = new Map<string, FileStat[]>();
  childrenByPath.set(basePath, [...rootChildren]);
  return {
    basePath,
    expandedPaths: new Set<string>(),
    childrenByPath,
  };
}

/** [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how — TOGGLE_EXPANDED add/remove dirPath from expandedPaths */
export function toggleExpanded(state: FileTreeState, dirPath: string): FileTreeState {
  const expandedPaths = new Set(state.expandedPaths);
  if (expandedPaths.has(dirPath)) {
    expandedPaths.delete(dirPath);
  } else {
    expandedPaths.add(dirPath);
  }
  return { ...state, expandedPaths };
}

/** [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how — SET_CHILDREN cache sorted children after lazy fetch */
export function setChildren(
  state: FileTreeState,
  dirPath: string,
  children: FileStat[],
  sortOptions: FileTreeSortOptions,
): FileTreeState {
  const childrenByPath = new Map(state.childrenByPath);
  childrenByPath.set(
    dirPath,
    sortFiles(children, sortOptions.sortBy, sortOptions.sortDirection, sortOptions.sortDirsFirst),
  );
  return { ...state, childrenByPath };
}

function sortedChildren(
  state: FileTreeState,
  dirPath: string,
  sortOptions: FileTreeSortOptions,
): FileStat[] {
  const cached = state.childrenByPath.get(dirPath);
  if (!cached) return [];
  return sortFiles(
    cached,
    sortOptions.sortBy,
    sortOptions.sortDirection,
    sortOptions.sortDirsFirst,
  );
}

/** [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-FILE_LISTING]: how — FLATTEN_VISIBLE_ROWS pre-order walk from base with depth metadata */
export function flattenVisibleRows(
  state: FileTreeState,
  sortOptions: FileTreeSortOptions,
): FileTreeRow[] {
  const rows: FileTreeRow[] = [];

  function walk(dirPath: string, depth: number): void {
    const children = sortedChildren(state, dirPath, sortOptions);
    for (const child of children) {
      const hasLoadedChildren = state.childrenByPath.has(child.path);
      const isExpanded =
        child.isDirectory && hasLoadedChildren && state.expandedPaths.has(child.path);
      rows.push({
        ...child,
        depth,
        hasLoadedChildren,
        isExpanded,
      });
      if (isExpanded) {
        walk(child.path, depth + 1);
      }
    }
  }

  walk(state.basePath, 0);
  return rows;
}

/** [IMPL-DIRECTORY_TREE] collectLoadedPaths — paths to refresh after mutations */
export function collectLoadedPaths(state: FileTreeState): string[] {
  const paths = new Set<string>([state.basePath]);
  for (const expanded of state.expandedPaths) {
    if (state.childrenByPath.has(expanded)) {
      paths.add(expanded);
    }
  }
  return [...paths];
}

/** [IMPL-DIRECTORY_TREE] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how — RECONCILE_TREE_SELECTION path-keyed marks; clamp cursor */
export function reconcileTreeSelection(
  visibleRows: FileTreeRow[],
  marks: Set<string>,
  cursor: number,
): { marks: Set<string>; cursor: number } {
  const visiblePaths = new Set(visibleRows.map((r) => r.path));
  const nextMarks = new Set<string>();
  for (const markPath of marks) {
    if (visiblePaths.has(markPath)) {
      nextMarks.add(markPath);
    }
  }
  let nextCursor = cursor;
  if (visibleRows.length === 0) {
    nextCursor = 0;
  } else if (nextCursor < 0 || nextCursor >= visibleRows.length) {
    nextCursor = Math.min(Math.max(0, nextCursor), visibleRows.length - 1);
  }
  return { marks: nextMarks, cursor: nextCursor };
}

/** Apply tree state to derive pane.files rows (without tree metadata fields in FileStat storage) */
export function filesFromTreeState(
  state: FileTreeState,
  sortOptions: FileTreeSortOptions,
): FileStat[] {
  return flattenVisibleRows(state, sortOptions);
}

export function paneSortOptions(pane: {
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
}): FileTreeSortOptions {
  return {
    sortBy: pane.sortBy,
    sortDirection: pane.sortDirection,
    sortDirsFirst: pane.sortDirsFirst,
  };
}

export function isDirectoryExpanded(state: FileTreeState, dirPath: string): boolean {
  return state.expandedPaths.has(dirPath);
}

export function hasLoadedChildren(state: FileTreeState, dirPath: string): boolean {
  return state.childrenByPath.has(dirPath);
}

/** Re-flatten after sort change without losing expand state */
export function reflattenTree(
  state: FileTreeState,
  sortOptions: FileTreeSortOptions,
): { treeState: FileTreeState; rows: FileTreeRow[] } {
  const childrenByPath = new Map<string, FileStat[]>();
  for (const [dirPath, children] of state.childrenByPath) {
    childrenByPath.set(
      dirPath,
      sortFiles(children, sortOptions.sortBy, sortOptions.sortDirection, sortOptions.sortDirsFirst),
    );
  }
  const treeState = { ...state, childrenByPath };
  return { treeState, rows: flattenVisibleRows(treeState, sortOptions) };
}
