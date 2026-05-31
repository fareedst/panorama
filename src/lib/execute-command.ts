// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: Top-level — pane target resolution and placeholder expansion for Execute dialog

import { resolveCrossPanePathsForFilename } from "@/lib/file-column-clipboard";
import { resolveTouchBasenames } from "@/lib/touch-file";
import type { FileStat } from "@/lib/files.types";

export type ExecuteFilePaneTarget = "thisPane" | "allPanes";

export interface ExecutePaneState {
  path: string;
  files: readonly FileStat[];
}

export interface ExecuteTarget {
  paneIndex: number;
  cwd: string;
  filePath: string;
  markedPaths: string[];
}

export interface ExecuteApiEntry {
  paneIndex: number;
  cwd: string;
  command: string;
  filePath: string;
  markedPaths: string[];
}

/** [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — replace $FILE and $MARKED placeholders */
export function expandCommandPlaceholders(
  command: string,
  filePath: string,
  markedPaths: readonly string[],
): string {
  return command
    .replaceAll("$FILE", filePath)
    .replaceAll("$MARKED", markedPaths.join("\n"));
}

function resolveMarkedPathsInPane(
  paneFiles: readonly FileStat[] | undefined,
  basenames: readonly string[],
): string[] {
  if (!paneFiles) {
    return [];
  }
  const paths: string[] = [];
  for (const basename of basenames) {
    const match = paneFiles.find((f) => f.name === basename);
    if (match) {
      paths.push(match.path);
    }
  }
  return paths;
}

function resolveContextFilePathInPane(
  paneFiles: readonly FileStat[] | undefined,
  contextFile: FileStat,
): string {
  const match = paneFiles?.find((f) => f.name === contextFile.name);
  return match?.path ?? "";
}

/** [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — thisPane once; allPanes once per pane with per-pane file/mark context */
export function resolveExecuteTargets(
  paneTarget: ExecuteFilePaneTarget,
  initiatingPaneIndex: number,
  panes: readonly ExecutePaneState[],
  marks: Set<string>,
  contextFile: FileStat,
): ExecuteTarget[] {
  const basenames = marks.size > 0 ? resolveTouchBasenames(marks, contextFile) : [];

  if (paneTarget === "thisPane") {
    const pane = panes[initiatingPaneIndex];
    if (!pane) {
      return [];
    }
    return [
      {
        paneIndex: initiatingPaneIndex,
        cwd: pane.path,
        filePath: contextFile.path,
        markedPaths: resolveMarkedPathsInPane(pane.files, basenames),
      },
    ];
  }

  return panes.map((pane, paneIndex) => ({
    paneIndex,
    cwd: pane.path,
    filePath:
      marks.size > 0
        ? resolveContextFilePathInPane(pane.files, contextFile)
        : resolveCrossPanePathsForFilename(
            panes.map((p) => p.files),
            contextFile.name,
          ).find((entry) => entry.paneIndex === paneIndex)?.path ?? "",
    markedPaths: resolveMarkedPathsInPane(pane.files, basenames),
  }));
}

/** [IMPL-PANE_COMMAND_EXEC] [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — assemble API payload with expanded commands */
export function buildExecuteEntries(
  paneTarget: ExecuteFilePaneTarget,
  command: string,
  initiatingPaneIndex: number,
  panes: readonly ExecutePaneState[],
  marks: Set<string>,
  contextFile: FileStat,
): ExecuteApiEntry[] {
  const trimmed = command.trim();
  if (!trimmed) {
    return [];
  }

  return resolveExecuteTargets(
    paneTarget,
    initiatingPaneIndex,
    panes,
    marks,
    contextFile,
  ).map((target) => ({
    paneIndex: target.paneIndex,
    cwd: target.cwd,
    command: expandCommandPlaceholders(
      trimmed,
      target.filePath,
      target.markedPaths,
    ),
    filePath: target.filePath,
    markedPaths: target.markedPaths,
  }));
}
