// [IMPL-DIRECTORY_TREE] [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-DIRECTORY_TREE] [REQ-PANE_DISPLAY_FILTER]

import { filterFileStats } from "./display-filter-engine";
import type { DisplayFilterSpec } from "./display-filter.types";
import type { FileStat } from "./files.types";
import { sortFiles } from "./files.utils";
import {
  createInitialTreeState,
  flattenVisibleRows,
  paneSortOptions,
  reconcileTreeSelection,
  reflattenTree,
  type FileTreeSortOptions,
  type FileTreeState,
} from "./file-tree";
import type { PaneWithDisplayFilter } from "./pane-display-filter";

export type PaneWithTree = PaneWithDisplayFilter & {
  treeState: FileTreeState;
};

/** [IMPL-DIRECTORY_TREE] [IMPL-PANE_DISPLAY_FILTER_UI] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-PANE_DISPLAY_FILTER]: how — filter and sort one directory level before setChildren cache */
export function processListingForTreeLevel(
  rawFiles: FileStat[],
  spec: DisplayFilterSpec | null,
  serverPreFiltered: boolean,
  sortOptions: FileTreeSortOptions,
): { files: FileStat[]; hiddenCount: number; totalCount: number } {
  let files = rawFiles;
  let hiddenCount = 0;
  const totalCount = rawFiles.length;
  if (!serverPreFiltered && spec) {
    const filtered = filterFileStats(rawFiles, spec);
    files = filtered.files;
    hiddenCount = filtered.hiddenCount;
  }
  files = sortFiles(
    files,
    sortOptions.sortBy,
    sortOptions.sortDirection,
    sortOptions.sortDirsFirst,
  );
  return { files, hiddenCount, totalCount };
}

/** [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-FILE_MARKING_WEB]: how — flatten treeState to pane.files and RECONCILE_TREE_SELECTION on marks/cursor */
export function syncPaneFromTree(pane: PaneWithTree): PaneWithTree {
  const sortOptions = paneSortOptions(pane);
  const rows = flattenVisibleRows(pane.treeState, sortOptions);
  const { marks, cursor } = reconcileTreeSelection(rows, pane.marks, pane.cursor);
  return {
    ...pane,
    files: rows,
    marks,
    cursor,
    rawFileCount: pane.treeState.childrenByPath.get(pane.path)?.length ?? rows.length,
  };
}

/** [IMPL-DIRECTORY_TREE] [IMPL-WORKSPACE_VIEW] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how — HANDLE_NAVIGATE_TREE_RESET seeds treeState from root listing */
export function createPaneTreeFromRootListing(
  pane: PaneWithDisplayFilter,
  rootChildren: FileStat[],
): PaneWithTree {
  const treeState = createInitialTreeState(pane.path, rootChildren);
  return syncPaneFromTree({ ...pane, treeState });
}

/** [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_TREE]: how — re-flatten after sort change preserving expandedPaths */
export function reflattenPaneTree(pane: PaneWithTree): PaneWithTree {
  const { treeState, rows } = reflattenTree(pane.treeState, paneSortOptions(pane));
  const { marks, cursor } = reconcileTreeSelection(rows, pane.marks, pane.cursor);
  return { ...pane, treeState, files: rows, marks, cursor };
}
