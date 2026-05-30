// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how — pure helpers format clipboard text and resolve cross-pane paths by cursor filename across workspace pane listings

import type { FileStat } from "@/lib/files.types";

export interface CrossPanePathEntry {
  paneIndex: number;
  path: string;
}

/** FILE_COLUMN_CLIPBOARD — [REQ-LINKED_PANES] cursor filename match key returns listing basename (`file.name`). */
export function formatCursorFilenameForClipboard(file: FileStat): string {
  return file.name;
}

/** FILE_COLUMN_CLIPBOARD — [REQ-DIRECTORY_NAVIGATION] absolute path for the row in the pane that received the click. */
export function formatAbsolutePathForClipboard(file: FileStat): string {
  return file.path;
}

/**
 * FILE_COLUMN_CLIPBOARD — [REQ-LINKED_PANES] [REQ-MOUSE_INTERACTION]
 * how: resolve `FileStat.path` in each workspace pane listing where `file.name` matches (basename, not full-path equality).
 */
export function resolveCrossPanePathsForFilename(
  paneFilesList: readonly (readonly FileStat[])[],
  filename: string,
): CrossPanePathEntry[] {
  const entries: CrossPanePathEntry[] = [];
  paneFilesList.forEach((files, paneIndex) => {
    const match = files.find((f) => f.name === filename);
    if (match) {
      entries.push({ paneIndex, path: match.path });
    }
  });
  return entries;
}

/** FILE_COLUMN_CLIPBOARD — [REQ-LINKED_PANES] newline-separated paths labeled by 1-based pane index for UI clipboard. */
export function formatCrossPanePathsForClipboard(
  entries: readonly CrossPanePathEntry[],
): string {
  return entries
    .map(({ paneIndex, path }) => `Pane ${paneIndex + 1}: ${path}`)
    .join("\n");
}

/** FILE_COLUMN_CLIPBOARD — [REQ-MOUSE_INTERACTION] how: write formatted text via Clipboard API or throw when unavailable. */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard API unavailable");
}
