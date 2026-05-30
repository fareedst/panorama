// [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]

import type { FileStat } from "./files.types";
import { filterFileStats, reconcilePaneSelection } from "./display-filter-engine";
import type { DisplayFilterSpec } from "./display-filter.types";
import type { DisplaySpecStore } from "./display-spec-store";
import { sortFiles, type SortCriterion, type SortDirection } from "./files.utils";

export interface PaneDisplayFilterFields {
  activeDisplaySpecId: string | null;
  loadedSpecVersion: number | null;
  hiddenCount: number;
  rawFileCount: number;
}

export type PaneWithDisplayFilter = PaneDisplayFilterFields & {
  path: string;
  files: FileStat[];
  cursor: number;
  marks: Set<string>;
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
};

export function getActiveSpec(
  store: DisplaySpecStore,
  specId: string | null,
): DisplayFilterSpec | null {
  if (!specId) return null;
  return store.get(specId) ?? null;
}

/** [IMPL-DISPLAY_FILTER_API] SERVER_FILTER_LISTING — client fetch; wrapped JSON when displaySpecId set */
export type DirectoryListingResponse = {
  files: FileStat[];
  serverPreFiltered: boolean;
  hiddenCount: number;
  totalCount: number;
};

export async function fetchDirectoryListing(
  dirPath: string,
  displaySpecId: string | null,
): Promise<DirectoryListingResponse> {
  let url = `/api/files?path=${encodeURIComponent(dirPath)}`;
  if (displaySpecId) {
    url += `&displaySpecId=${encodeURIComponent(displaySpecId)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to list directory: ${dirPath}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return {
      files: data,
      serverPreFiltered: false,
      hiddenCount: 0,
      totalCount: data.length,
    };
  }
  return {
    files: data.files ?? [],
    serverPreFiltered: Boolean(displaySpecId),
    hiddenCount: data.hiddenCount ?? 0,
    totalCount: data.totalCount ?? data.files?.length ?? 0,
  };
}

/** [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: client-side filter when server did not pre-filter; sort visible files; reconcile or clear marks per preserveMarks flag */
export function buildPaneFromRawListing(
  rawFiles: FileStat[],
  pane: PaneWithDisplayFilter,
  store: DisplaySpecStore,
  options?: {
    preserveMarks?: boolean;
    serverPreFiltered?: boolean;
    hiddenCount?: number;
    totalCount?: number;
  },
): PaneWithDisplayFilter {
  const spec = getActiveSpec(store, pane.activeDisplaySpecId);
  let visible = rawFiles;
  let hiddenCount = options?.hiddenCount ?? 0;
  const totalCount = options?.totalCount ?? rawFiles.length;

  if (!options?.serverPreFiltered) {
    const filtered = filterFileStats(rawFiles, spec);
    visible = filtered.files;
    hiddenCount = filtered.hiddenCount;
  }

  const sorted = sortFiles(
    visible,
    pane.sortBy,
    pane.sortDirection,
    pane.sortDirsFirst,
  );
  let next: PaneWithDisplayFilter = {
    ...pane,
    files: sorted,
    hiddenCount,
    rawFileCount: totalCount,
    loadedSpecVersion: spec?.version ?? null,
  };
  if (!options?.preserveMarks) {
    next = { ...next, marks: new Set<string>() };
  } else {
    next = reconcilePaneSelection(next);
  }
  return next;
}

export function refilterPaneInPlace(
  pane: PaneWithDisplayFilter,
  store: DisplaySpecStore,
  rawFiles: FileStat[],
): PaneWithDisplayFilter {
  return buildPaneFromRawListing(rawFiles, pane, store, { preserveMarks: true });
}
