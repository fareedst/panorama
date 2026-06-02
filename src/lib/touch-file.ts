// [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: Top-level — path and mtime resolution for Touch dialog apply

import { resolveCrossPanePathsForFilename } from "@/lib/file-column-clipboard";
import {
  getSharedCompareState,
  resolveAggregateMtime,
} from "@/lib/files.comparison";
import type { CompareState, FileStat } from "@/lib/files.types";

export type TouchFilePaneTarget = "thisPane" | "allPanes";

export type TouchMtimeMode = "now" | "specified" | "earliest" | "latest";

export interface TouchPathEntry {
  path: string;
  basename: string;
}

export interface TouchApplyEntry {
  path: string;
  mtime: Date;
}

/** [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-FILE_MARKING_WEB]: how — marked absolute paths when marks non-empty; else context file path */
export function resolveTouchBasenames(
  marks: Set<string>,
  fallbackFile: FileStat,
): string[] {
  if (marks.size > 0) {
    return [...marks];
  }
  return [fallbackFile.path];
}

/** [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — thisPane from initiating listing; allPanes via cross-pane path resolver */
export function resolveTouchPaths(
  paneTarget: TouchFilePaneTarget,
  initiatingPaneIndex: number,
  paneFilesList: readonly (readonly FileStat[])[],
  basenames: readonly string[],
): TouchPathEntry[] {
  const entries: TouchPathEntry[] = [];

  for (const selected of basenames) {
    if (paneTarget === "thisPane") {
      const paneFiles = paneFilesList[initiatingPaneIndex];
      const match = paneFiles?.find((f) => f.path === selected || f.name === selected);
      if (match) {
        entries.push({ path: match.path, basename: match.name });
      }
    } else {
      const basename = selected.includes("/") ? selected.split("/").pop()! : selected;
      for (const { path: filePath } of resolveCrossPanePathsForFilename(
        paneFilesList,
        basename,
      )) {
        entries.push({ path: filePath, basename });
      }
    }
  }

  return entries;
}

/** [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-CROSS_PANE_COMPARISON]: how — per-basename mtime from mode and shared CompareState */
export function resolveTouchMtimeForBasename(
  mode: TouchMtimeMode,
  specifiedDate: Date | null,
  compareState: CompareState | null,
): Date | null {
  switch (mode) {
    case "now":
      return new Date();
    case "specified":
      return specifiedDate;
    case "earliest":
      return compareState
        ? resolveAggregateMtime(compareState.mtimes, "earliest")
        : null;
    case "latest":
      return compareState
        ? resolveAggregateMtime(compareState.mtimes, "latest")
        : null;
    default:
      return null;
  }
}

/** [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — true when any basename in scope has shared compare state (2+ panes) */
export function isEarliestLatestModeAvailable(
  paneFilesList: readonly (readonly FileStat[])[],
  basenames: readonly string[],
): boolean {
  return basenames.some(
    (basename) => getSharedCompareState(paneFilesList, basename) !== null,
  );
}

/** [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — flatten paths with per-basename resolved mtime */
export function buildTouchEntries(
  paneTarget: TouchFilePaneTarget,
  mtimeMode: TouchMtimeMode,
  specifiedDate: Date | null,
  initiatingPaneIndex: number,
  paneFilesList: readonly (readonly FileStat[])[],
  marks: Set<string>,
  fallbackFile: FileStat,
): TouchApplyEntry[] {
  const basenames = resolveTouchBasenames(marks, fallbackFile);
  const paths = resolveTouchPaths(
    paneTarget,
    initiatingPaneIndex,
    paneFilesList,
    basenames,
  );
  const result: TouchApplyEntry[] = [];
  const seen = new Set<string>();

  for (const { path, basename } of paths) {
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);

    const compareState = getSharedCompareState(paneFilesList, basename);
    const mtime = resolveTouchMtimeForBasename(
      mtimeMode,
      specifiedDate,
      compareState,
    );
    if (mtime !== null && !Number.isNaN(mtime.getTime())) {
      result.push({ path, mtime });
    }
  }

  return result;
}
