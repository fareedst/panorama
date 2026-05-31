// [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: Top-level — path resolution and basename regex rename for Rename Regex dialog

import path from "path";
import type { FileStat } from "@/lib/files.types";
import { validateRegex } from "@/lib/regex-validation";
import {
  resolveTouchBasenames,
  resolveTouchPaths,
  type TouchFilePaneTarget,
} from "@/lib/touch-file";

export type RenameRegexPaneTarget = TouchFilePaneTarget;

export interface RenameRegexApplyEntry {
  src: string;
  dest: string;
}

/** [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — re-export touch-file basename resolution */
export function resolveRenameRegexBasenames(
  marks: Set<string>,
  fallbackFile: FileStat,
): string[] {
  return resolveTouchBasenames(marks, fallbackFile);
}

/** [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — re-export touch-file path resolution for thisPane/allPanes */
export function resolveRenameRegexPaths(
  paneTarget: RenameRegexPaneTarget,
  initiatingPaneIndex: number,
  paneFilesList: readonly (readonly FileStat[])[],
  basenames: readonly string[],
) {
  return resolveTouchPaths(
    paneTarget,
    initiatingPaneIndex,
    paneFilesList,
    basenames,
  );
}

/** [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — reject empty, dot names, or path separators in result basename */
export function validateRenameBasename(name: string): boolean {
  if (!name || name === "." || name === "..") {
    return false;
  }
  return !name.includes("/") && !name.includes("\\");
}

/** [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — String.replace(RegExp); null when invalid, no match, or bad result */
export function computeRenamedBasename(
  name: string,
  pattern: string,
  replacement: string,
): string | null {
  const validation = validateRegex(pattern);
  if (!validation.valid) {
    return null;
  }

  let newName: string;
  try {
    newName = name.replace(new RegExp(pattern), replacement);
  } catch {
    return null;
  }

  if (newName === name || !validateRenameBasename(newName)) {
    return null;
  }

  return newName;
}

/** [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — resolve paths, apply regex per basename, dedupe by src */
export function buildRenameRegexEntries(
  paneTarget: RenameRegexPaneTarget,
  pattern: string,
  replacement: string,
  initiatingPaneIndex: number,
  paneFilesList: readonly (readonly FileStat[])[],
  marks: Set<string>,
  fallbackFile: FileStat,
): RenameRegexApplyEntry[] {
  const basenames = resolveRenameRegexBasenames(marks, fallbackFile);
  const pathEntries = resolveRenameRegexPaths(
    paneTarget,
    initiatingPaneIndex,
    paneFilesList,
    basenames,
  );

  const result: RenameRegexApplyEntry[] = [];
  const seen = new Set<string>();

  for (const { path: filePath } of pathEntries) {
    if (seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);

    const basename = path.basename(filePath);
    const newBasename = computeRenamedBasename(basename, pattern, replacement);
    if (newBasename === null) {
      continue;
    }

    result.push({
      src: filePath,
      dest: path.join(path.dirname(filePath), newBasename),
    });
  }

  return result;
}
