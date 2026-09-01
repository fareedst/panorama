// [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA] [IMPL-NSYNC_OPERATIONS] [REQ-FILE_OPERATIONS] [REQ-NSYNC_HYBRID_MOVE]: Shared rename with EXDEV copy+delete fallback for files.data and NSYNC operations

import fs from "fs/promises";
import path from "path";
import { logger } from "./logger";

export interface RenameOrMoveDeps {
  copyFile: (src: string, dest: string) => Promise<void>;
  deleteFile: (src: string) => Promise<void>;
}

// [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS]: how — detect Node ErrnoException code EXDEV for cross-device rename
export function isExdevError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EXDEV"
  );
}

// [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA] [IMPL-NSYNC_OPERATIONS] [REQ-FILE_OPERATIONS] [REQ-NSYNC_HYBRID_MOVE]: how — try fs.rename; on EXDEV delegate copy then delete via injected deps
/**
 * Rename or move a file, falling back to copy+delete on EXDEV
 * [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA]
 */
export async function renameOrMove(
  src: string,
  dest: string,
  deps: RenameOrMoveDeps,
  logTokens: string[] = ["ARCH-FILESYSTEM_ABSTRACTION", "IMPL-FILES_DATA"]
): Promise<void> {
  logger.debug(logTokens, `Renaming ${src} -> ${dest}`);

  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
    logger.trace(logTokens, `Rename completed: ${dest}`);
  } catch (error) {
    if (!isExdevError(error)) {
      logger.error(logTokens, `Rename failed: ${src} -> ${dest}`, { error: String(error) });
      throw error;
    }

    logger.debug(
      logTokens,
      `DIAGNOSTIC: EXDEV fallback copy+delete: ${src} -> ${dest}`
    );

    try {
      await deps.copyFile(src, dest);
      await deps.deleteFile(src);
      logger.trace(logTokens, `Move via copy+delete completed: ${dest}`);
    } catch (fallbackError) {
      logger.error(
        logTokens,
        `EXDEV fallback failed: ${src} -> ${dest}`,
        { error: String(fallbackError) }
      );
      throw fallbackError;
    }
  }
}
