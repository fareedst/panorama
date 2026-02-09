// [IMPL-NSYNC_OPERATIONS] [ARCH-COPY_ENGINE] [REQ-COPY_OPERATIONS]
// File operation wrappers - copy and move

import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";

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
    
    logger.trace(["IMPL-NSYNC_OPERATIONS"], `Copy completed: ${destPath}`);
  } catch (error) {
    logger.error(["IMPL-NSYNC_OPERATIONS"], `Copy failed: ${sourcePath} -> ${destPath}`, 
      { error: String(error) });
    throw error;
  }
}

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
