// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: File operation wrappers — copy with mkdir and attribute preservation; move delegates copy; delete via unlink

import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";
import { preserveCopyAttributes } from "../copyAttributes";

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-COPY_OPERATIONS]: how: ensure dest directory exists recursively, copy bytes, then preserve mtime/mode via preserveCopyAttributes
/**
 * Copy a file from source to destination
 * [IMPL-NSYNC_OPERATIONS] [REQ-COPY_OPERATIONS]
 * 
 * @param sourcePath - Source file path
 * @param destPath - Destination file path
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<void> {
  logger.debug(["IMPL-NSYNC_OPERATIONS", "REQ-COPY_OPERATIONS"], 
    `Copying ${sourcePath} to ${destPath}`);
  
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy the file
    await fs.copyFile(sourcePath, destPath);
    // [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy apply utimes and chmod from source stat; ignore per-step failures
    await preserveCopyAttributes(sourcePath, destPath);

    logger.trace(["IMPL-NSYNC_OPERATIONS"], `Copy completed: ${destPath}`);
  } catch (error) {
    logger.error(["IMPL-NSYNC_OPERATIONS"], `Copy failed: ${sourcePath} -> ${destPath}`, 
      { error: String(error) });
    throw error;
  }
}

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: move is copy only — SyncEngine deletes source after all destinations succeed
/**
 * Move a file from source to destination (copy + delete)
 * [IMPL-NSYNC_OPERATIONS] [REQ-MOVE_SEMANTICS]
 * 
 * Note: This function only performs the copy.
 * Deletion of source is handled by SyncEngine after verifying all destinations succeeded.
 * 
 * @param sourcePath - Source file path
 * @param destPath - Destination file path
 */
export async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  logger.debug(["IMPL-NSYNC_OPERATIONS", "REQ-MOVE_SEMANTICS"], 
    `Moving ${sourcePath} to ${destPath}`);
  
  // Move is just copy for now - source deletion handled by SyncEngine
  await copyFile(sourcePath, destPath);
}

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: unlink source after successful move to all destinations
/**
 * Delete a file (used after successful move to all destinations)
 * [IMPL-NSYNC_OPERATIONS] [REQ-MOVE_SEMANTICS]
 * 
 * @param filePath - File path to delete
 */
export async function deleteFile(filePath: string): Promise<void> {
  logger.debug(["IMPL-NSYNC_OPERATIONS", "REQ-MOVE_SEMANTICS"], `Deleting ${filePath}`);
  
  try {
    await fs.unlink(filePath);
    logger.trace(["IMPL-NSYNC_OPERATIONS"], `Deleted: ${filePath}`);
  } catch (error) {
    logger.error(["IMPL-NSYNC_OPERATIONS"], `Delete failed: ${filePath}`, 
      { error: String(error) });
    throw error;
  }
}

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.access probe returns boolean without throwing
/**
 * Check if a file exists
 * [IMPL-NSYNC_OPERATIONS]
 * 
 * @param filePath - File path to check
 * @returns True if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.stat or null when file missing — used by SyncEngine for plan bytes and ItemInfo
/**
 * Get file stats
 * [IMPL-NSYNC_OPERATIONS]
 * 
 * @param filePath - File path
 * @returns File stats or null if file doesn't exist
 */
export async function getFileStat(filePath: string): Promise<Awaited<ReturnType<typeof fs.stat>> | null> {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}
