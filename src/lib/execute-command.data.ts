// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: Server shell spawn for execute-command API

import { spawn } from "child_process";
import { access } from "fs/promises";
import path from "path";

export interface ExecuteCommandEnv {
  panePath: string;
  filePath: string;
  markedPaths: readonly string[];
}

export interface ExecuteCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function validateCwd(cwd: string): void {
  if (!cwd || typeof cwd !== "string") {
    throw new Error("Invalid cwd");
  }
  if (cwd.includes("..")) {
    throw new Error("Invalid cwd");
  }
  if (!path.isAbsolute(cwd)) {
    throw new Error("Invalid cwd");
  }
}

/** [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — spawn shell with cwd and PANORAMA_* env vars */
export async function executeCommandInDirectory(
  cwd: string,
  command: string,
  envContext: ExecuteCommandEnv,
): Promise<ExecuteCommandResult> {
  validateCwd(cwd);
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error("Command required");
  }

  try {
    await access(cwd);
  } catch {
    throw new Error("Invalid cwd");
  }

  const env = {
    ...process.env,
    PANORAMA_PANE_PATH: envContext.panePath,
    PANORAMA_FILE_PATH: envContext.filePath,
    PANORAMA_MARKED_PATHS: envContext.markedPaths.join("\n"),
  };

  return new Promise((resolve, reject) => {
    const child = spawn(trimmed, {
      cwd,
      env,
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export interface ExecuteCommandEntry {
  paneIndex: number;
  cwd: string;
  command: string;
  filePath?: string;
  markedPaths?: string[];
}

export interface ExecuteCommandBatchResult {
  results: Array<{
    paneIndex: number;
    exitCode: number;
    error?: string;
  }>;
  successCount: number;
  errorCount: number;
}

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — run entries sequentially; tally successCount and errorCount from exit codes
export async function executeCommandBatch(
  entries: ExecuteCommandEntry[],
): Promise<ExecuteCommandBatchResult> {
  const results: ExecuteCommandBatchResult["results"] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    try {
      const result = await executeCommandInDirectory(entry.cwd, entry.command, {
        panePath: entry.cwd,
        filePath: entry.filePath ?? "",
        markedPaths: entry.markedPaths ?? [],
      });
      results.push({ paneIndex: entry.paneIndex, exitCode: result.exitCode });
      if (result.exitCode === 0) {
        successCount += 1;
      } else {
        errorCount += 1;
      }
    } catch (error) {
      results.push({
        paneIndex: entry.paneIndex,
        exitCode: 1,
        error: error instanceof Error ? error.message : String(error),
      });
      errorCount += 1;
    }
  }

  return { results, successCount, errorCount };
}
