// [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: Top-level — pane-target path resolution for Make directory dialog

import path from "path";
import { validateRenameBasename } from "@/lib/rename-regex";

export type MakeDirectoryPaneTarget = "thisPane" | "allPanes";

export interface MakeDirectoryPaneState {
  path: string;
}

export interface MakeDirectoryEntry {
  paneIndex: number;
  path: string;
}

/** [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — join pane.path with trimmed dirname; thisPane or all panes */
export function buildMakeDirectoryEntries(
  paneTarget: MakeDirectoryPaneTarget,
  dirname: string,
  initiatingPaneIndex: number,
  panes: readonly MakeDirectoryPaneState[],
): MakeDirectoryEntry[] {
  const trimmed = dirname.trim();
  if (!validateRenameBasename(trimmed)) {
    return [];
  }

  if (paneTarget === "thisPane") {
    const pane = panes[initiatingPaneIndex];
    if (!pane) {
      return [];
    }
    return [
      {
        paneIndex: initiatingPaneIndex,
        path: path.join(pane.path, trimmed),
      },
    ];
  }

  // [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — allPanes — one entry per pane current path (not cross-pane basename lookup)
  return panes.map((pane, paneIndex) => ({
    paneIndex,
    path: path.join(pane.path, trimmed),
  }));
}
