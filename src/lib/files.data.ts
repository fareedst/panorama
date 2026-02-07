// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]
// Server-side filesystem data layer using Node.js fs/promises API

import fs from "fs/promises";
import path from "path";
import os from "os";
import type { FileStat, SortType, CompareState, ComparisonIndex } from "./files.types";
import { formatSize } from "./files.utils";
import { logger } from "./logger";

// Re-export formatSize for backward compatibility
export { formatSize };

/**
 * List directory contents and return file stats
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]
 * 
 * @param dirPath - Absolute path to directory
 * @returns Array of file stats, sorted by name
 */
export async function listDirectory(dirPath: string): Promise<FileStat[]> {
  logger.debug(["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"], `Listing directory: ${dirPath}`);
  
  try {
    // Validate and normalize path
    const normalizedPath = path.normalize(dirPath);
    
    // Read directory entries
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
    
    logger.trace(["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"], `Found ${entries.length} entries in ${dirPath}`);
    
    // Convert to FileStat objects
    const fileStats: FileStat[] = [];
    
    for (const entry of entries) {
      try {
        const entryPath = path.join(normalizedPath, entry.name);
        const stats = await fs.stat(entryPath);
        
        fileStats.push({
          name: entry.name,
          path: entryPath,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
          extension: entry.isDirectory() ? "" : path.extname(entry.name),
        });
      } catch (err) {
        // Skip files we can't stat (permissions, broken symlinks, etc.)
        logger.warn(["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"], `Cannot stat ${entry.name}`, { error: String(err) });
      }
    }
    
    logger.info(["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"], `Successfully listed ${fileStats.length} files from ${dirPath}`);
    return fileStats;
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"], `Failed to list directory ${dirPath}`, { error: String(error) });
    return [];
  }
}

/**
 * Get parent directory path
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]
 * 
 * @param dirPath - Current directory path
 * @returns Parent directory path, or same path if already at root
 */
export function getParentDirectory(dirPath: string): string {
  const parent = path.dirname(dirPath);
  // If dirname returns same path, we're at root
  return parent === dirPath ? dirPath : parent;
}

/**
 * Join path components safely
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]
 * 
 * @param parts - Path components to join
 * @returns Normalized joined path
 */
export function joinPath(...parts: string[]): string {
  return path.normalize(path.join(...parts));
}

/**
 * Get file information for a single file
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]
 * 
 * @param filePath - Absolute path to file
 * @returns FileStat object or null if file doesn't exist
 */
export async function getFileInfo(filePath: string): Promise<FileStat | null> {
  try {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    
    return {
      name,
      path: filePath,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime,
      extension: stats.isDirectory() ? "" : path.extname(name),
    };
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-FILE_LISTING"], `Failed to get file info for ${filePath}`, { error: String(error) });
    return null;
  }
}

/**
 * Get user's home directory
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]
 */
export function getUserHomeDirectory(): string {
  return os.homedir();
}

/**
 * Copy file from source to destination
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
 * 
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Copying file: ${src} -> ${dest}`);
  try {
    await fs.copyFile(src, dest);
    logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Successfully copied file: ${src} -> ${dest}`);
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Failed to copy file: ${src} -> ${dest}`, { error: String(error) });
    throw error;
  }
}

/**
 * Move/rename file from source to destination
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
 * 
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function moveFile(src: string, dest: string): Promise<void> {
  logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Moving file: ${src} -> ${dest}`);
  try {
    await fs.rename(src, dest);
    logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Successfully moved file: ${src} -> ${dest}`);
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Failed to move file: ${src} -> ${dest}`, { error: String(error) });
    throw error;
  }
}

/**
 * Delete file or directory
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
 * 
 * @param filePath - Path to file or directory
 */
export async function deleteFile(filePath: string): Promise<void> {
  logger.warn(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Deleting: ${filePath}`);
  
  try {
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
      logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Successfully deleted directory: ${filePath}`);
    } else {
      await fs.unlink(filePath);
      logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Successfully deleted file: ${filePath}`);
    }
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Failed to delete: ${filePath}`, { error: String(error) });
    throw error;
  }
}

/**
 * Rename file (convenience wrapper for moveFile)
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
 * 
 * @param oldPath - Current file path
 * @param newPath - New file path
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  logger.debug(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Renaming file: ${oldPath} -> ${newPath}`);
  await moveFile(oldPath, newPath);
}

/**
 * Copy multiple files with progress tracking
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 * 
 * @param sources - Array of source file paths
 * @param destDir - Destination directory path
 * @param onProgress - Optional progress callback
 * @returns Operation result with success/error counts
 */
export async function bulkCopy(
  sources: string[],
  destDir: string,
  onProgress?: (progress: import("./files.types").OperationProgress) => void
): Promise<import("./files.types").OperationResult> {
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy: ${sources.length} files to ${destDir}`);
  
  const errors: Array<{ file: string; error: string }> = [];
  let completed = 0;
  
  // Execute copies in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const filename = path.basename(src);
        const dest = path.join(destDir, filename);
        
        // Report progress
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        await copyFile(src, dest);
        completed++;
        
        // Report progress after completion
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        logger.debug(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Copied: ${src} -> ${dest}`);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: src, error: errMsg });
        logger.error(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Failed to copy ${src}`, { error: errMsg });
        throw error;
      }
    })
  );
  
  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;
  
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy completed`, { successCount, errorCount });
  
  return {
    successCount,
    errorCount,
    errors,
  };
}

/**
 * Move multiple files with progress tracking
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 * 
 * @param sources - Array of source file paths
 * @param destDir - Destination directory path
 * @param onProgress - Optional progress callback
 * @returns Operation result with success/error counts
 */
export async function bulkMove(
  sources: string[],
  destDir: string,
  onProgress?: (progress: import("./files.types").OperationProgress) => void
): Promise<import("./files.types").OperationResult> {
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move: ${sources.length} files to ${destDir}`);
  
  const errors: Array<{ file: string; error: string }> = [];
  let completed = 0;
  
  // Execute moves in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const filename = path.basename(src);
        const dest = path.join(destDir, filename);
        
        // Report progress
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        await moveFile(src, dest);
        completed++;
        
        // Report progress after completion
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        logger.debug(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Moved: ${src} -> ${dest}`);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: src, error: errMsg });
        logger.error(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Failed to move ${src}`, { error: errMsg });
        throw error;
      }
    })
  );
  
  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;
  
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move completed`, { successCount, errorCount });
  
  return {
    successCount,
    errorCount,
    errors,
  };
}

/**
 * Delete multiple files with progress tracking
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 * 
 * @param sources - Array of file paths to delete
 * @param onProgress - Optional progress callback
 * @returns Operation result with success/error counts
 */
export async function bulkDelete(
  sources: string[],
  onProgress?: (progress: import("./files.types").OperationProgress) => void
): Promise<import("./files.types").OperationResult> {
  logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk delete: ${sources.length} files`);
  
  const errors: Array<{ file: string; error: string }> = [];
  let completed = 0;
  
  // Execute deletes in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const filename = path.basename(src);
        
        // Report progress
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        await deleteFile(src);
        completed++;
        
        // Report progress after completion
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: filename,
            errors,
          });
        }
        
        logger.debug(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Deleted: ${src}`);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: src, error: errMsg });
        logger.error(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Failed to delete ${src}`, { error: errMsg });
        throw error;
      }
    })
  );
  
  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;
  
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk delete completed`, { successCount, errorCount });
  
  return {
    successCount,
    errorCount,
    errors,
  };
}

/**
 * Sort files by specified sort type
 * [IMPL-FILES_DATA] [REQ-FILE_LISTING]
 * 
 * Ported from Goful's sorting logic
 * 
 * @param files - Array of file stats to sort
 * @param sortType - Sort criterion
 * @param priorityDir - Whether to prioritize directories first (default: true)
 * @returns Sorted array (modifies in place and returns)
 */
export function sortFiles(
  files: FileStat[],
  sortType: SortType,
  priorityDir: boolean = true
): FileStat[] {
  files.sort((a, b) => {
    // Prioritize directories if enabled
    if (priorityDir) {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
    }
    
    // Sort by criterion
    switch (sortType) {
      case "Name":
        return a.name.localeCompare(b.name);
      case "NameRev":
        return b.name.localeCompare(a.name);
      case "Size":
        return a.size - b.size;
      case "SizeRev":
        return b.size - a.size;
      case "Mtime":
        return new Date(a.mtime).getTime() - new Date(b.mtime).getTime();
      case "MtimeRev":
        return new Date(b.mtime).getTime() - new Date(a.mtime).getTime();
      case "Ext":
        return a.extension.localeCompare(b.extension);
      case "ExtRev":
        return b.extension.localeCompare(a.extension);
      default:
        return 0;
    }
  });
  
  return files;
}

/**
 * Build comparison index from multiple pane contents
 * [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]
 * 
 * Ported from Goful's comparison index logic
 * 
 * @param panes - Array of file lists, one per pane
 * @returns ComparisonIndex for querying file states
 */
export function buildComparisonIndex(panes: FileStat[][]): ComparisonIndex {
  // Map: filename -> CompareState
  const index = new Map<string, CompareState>();
  
  // Build index
  for (let paneIndex = 0; paneIndex < panes.length; paneIndex++) {
    const paneFiles = panes[paneIndex];
    
    for (const file of paneFiles) {
      const existing = index.get(file.name);
      
      if (existing) {
        // File exists in multiple panes - add this pane's data
        existing.panes.push(paneIndex);
        existing.sizes.push(file.size);
        existing.mtimes.push(file.mtime);
      } else {
        // First occurrence of this filename
        index.set(file.name, {
          panes: [paneIndex],
          sizes: [file.size],
          mtimes: [file.mtime],
        });
      }
    }
  }
  
  // Return ComparisonIndex interface
  return {
    get(paneIndex: number, filename: string): CompareState | null {
      const state = index.get(filename);
      
      // Only return if file exists in multiple panes
      if (!state || state.panes.length < 2) {
        return null;
      }
      
      // Only return if this pane has the file
      if (!state.panes.includes(paneIndex)) {
        return null;
      }
      
      return state;
    },
    
    getSharedFilenames(): string[] {
      const shared: string[] = [];
      
      for (const [filename, state] of index.entries()) {
        if (state.panes.length >= 2) {
          shared.push(filename);
        }
      }
      
      return shared.sort();
    },
  };
}