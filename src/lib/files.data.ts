// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: Top-level Filesystem Data Layer: Server-only module wraps Node.js fs/promises API with validation
// Server-side filesystem data layer using Node.js fs/promises API

import fs from "fs/promises";
import path from "path";
import os from "os";
import type { FileStat, SortType, CompareState, ComparisonIndex } from "./files.types";
import { formatSize } from "./files.utils";
import { logger } from "./logger";
import { preserveCopyAttributes } from "./copyAttributes";
import { resolveCrossPaneDestPath } from "./cross-pane-path";

// Re-export formatSize for backward compatibility
export { formatSize };

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: normalize path, readdir withFileTypes, stat each entry into FileStat, skip unstatable entries, return array (empty on top-level failure)
/**
 * List directory contents and return file stats
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
 * Copy file or directory from source to destination
 * [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]
 * 
 * @param src - Source file or directory path
 * @param dest - Destination file or directory path
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Copying file: ${src} -> ${dest}`);
  try {
    // [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: destination parent creation — mkdir dest parent so cross-pane and nested dest paths succeed
    await fs.mkdir(path.dirname(dest), { recursive: true });

    const srcStat = await fs.stat(src);
    if (srcStat.isDirectory()) {
      // [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: branch copy mechanism — fs.cp recursive for directories; fs.copyFile is files-only
      await fs.cp(src, dest, { recursive: true });
    } else {
      await fs.copyFile(src, dest);
    }
    // [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy apply utimes and chmod from source stat; ignore per-step failures
    await preserveCopyAttributes(src, dest);
    logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Successfully copied file: ${src} -> ${dest}`);
  } catch (error) {
    logger.error(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Failed to copy file: ${src} -> ${dest}`, { error: String(error) });
    throw error;
  }
}

// [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS]: how — detect Node ErrnoException code EXDEV for cross-device rename
function isExdevError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EXDEV"
  );
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
    if (!isExdevError(error)) {
      logger.error(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Failed to move file: ${src} -> ${dest}`, {
        error: String(error),
      });
      throw error;
    }

    logger.debug(
      ["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"],
      `Cross-volume move fallback (EXDEV): ${src} -> ${dest}`,
    );

    try {
      await copyFile(src, dest);
      await deleteFile(src);
      logger.info(
        ["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"],
        `Successfully moved file via copy+delete: ${src} -> ${dest}`,
      );
    } catch (fallbackError) {
      logger.error(
        ["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"],
        `Failed cross-volume move: ${src} -> ${dest}`,
        { error: String(fallbackError) },
      );
      throw fallbackError;
    }
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
 * [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-FILE_OPERATIONS]: how — stat then utimes preserving atime; files and directories
 */
export async function setFileMtime(filePath: string, mtime: Date): Promise<void> {
  logger.debug(
    ["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME", "REQ-FILE_OPERATIONS"],
    `Setting mtime: ${filePath}`,
    { mtime: mtime.toISOString() },
  );

  try {
    const stats = await fs.stat(filePath);
    await fs.utimes(filePath, stats.atime, mtime);
    logger.info(
      ["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"],
      `Successfully set mtime: ${filePath}`,
    );
  } catch (error) {
    logger.error(
      ["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"],
      `Failed to set mtime: ${filePath}`,
      { error: String(error) },
    );
    throw error;
  }
}

/**
 * [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — Promise.allSettled per entry like bulkDelete
 */
export async function bulkTouch(
  entries: Array<{ path: string; mtime: Date }>,
): Promise<import("./files.types").OperationResult> {
  logger.warn(
    ["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"],
    `Bulk touch: ${entries.length} paths`,
  );

  const errors: Array<{ file: string; error: string }> = [];

  const results = await Promise.allSettled(
    entries.map(async ({ path, mtime }) => {
      try {
        await setFileMtime(path, mtime);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: path, error: errMsg });
        throw error;
      }
    }),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;

  logger.info(
    ["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"],
    `Bulk touch completed`,
    { successCount, errorCount },
  );

  return {
    successCount,
    errorCount,
    errors,
  };
}

/**
 * [IMPL-RENAME_REGEX] [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — Promise.allSettled per entry like bulkTouch
 */
export async function bulkRename(
  entries: Array<{ src: string; dest: string }>,
): Promise<import("./files.types").OperationResult> {
  logger.warn(
    ["IMPL-RENAME_REGEX", "IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"],
    `Bulk rename: ${entries.length} paths`,
  );

  const errors: Array<{ file: string; error: string }> = [];

  const results = await Promise.allSettled(
    entries.map(async ({ src, dest }) => {
      try {
        await renameFile(src, dest);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: src, error: errMsg });
        throw error;
      }
    }),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;

  logger.info(
    ["IMPL-RENAME_REGEX", "IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"],
    `Bulk rename completed`,
    { successCount, errorCount },
  );

  return {
    successCount,
    errorCount,
    errors,
  };
}

/**
 * [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: how — fs.mkdir non-recursive single level
 */
export async function makeDirectory(dirPath: string): Promise<void> {
  logger.debug(
    ["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"],
    `Creating directory: ${dirPath}`,
  );

  try {
    await fs.mkdir(dirPath, { recursive: false });
    logger.info(
      ["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"],
      `Successfully created directory: ${dirPath}`,
    );
  } catch (error) {
    logger.error(
      ["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"],
      `Failed to create directory: ${dirPath}`,
      { error: String(error) },
    );
    throw error;
  }
}

/**
 * [IMPL-MAKE_DIRECTORY] [IMPL-FILES_DATA] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: how — Promise.allSettled per entry like bulkTouch
 */
export async function bulkMakeDirectory(
  entries: Array<{ path: string }>,
): Promise<import("./files.types").OperationResult> {
  logger.warn(
    ["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"],
    `Bulk mkdir: ${entries.length} paths`,
  );

  const errors: Array<{ file: string; error: string }> = [];

  const results = await Promise.allSettled(
    entries.map(async ({ path: dirPath }) => {
      try {
        await makeDirectory(dirPath);
      } catch (error) {
        const errMsg = String(error);
        errors.push({ file: dirPath, error: errMsg });
        throw error;
      }
    }),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;

  logger.info(
    ["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"],
    `Bulk mkdir completed`,
    { successCount, errorCount },
  );

  return {
    successCount,
    errorCount,
    errors,
  };
}

export interface BulkOperationOptions {
  /** Source pane base directory for relative destination mapping */
  sourceBase?: string;
  onProgress?: (progress: import("./files.types").OperationProgress) => void;
}

// [IMPL-BULK_OPS] [IMPL-NSYNC_ENGINE] [ARCH-BATCH_OPERATIONS] [REQ-DIRECTORY_TREE] [REQ-BULK_FILE_OPS]: how — MAP_SOURCE_TO_DEST via resolveCrossPaneDestPath when sourceBase set
function resolveBulkDestPath(src: string, destDir: string, sourceBase?: string): string {
  if (sourceBase) {
    return resolveCrossPaneDestPath(src, sourceBase, destDir);
  }
  return path.join(destDir, path.basename(src));
}

/**
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] [REQ-DIRECTORY_TREE]: how — bulkCopy with optional sourceBase relative dest mapping; Promise.allSettled per source
 * Copy multiple files with progress tracking
 * 
 * @param sources - Array of source file paths
 * @param destDir - Destination directory path
 * @param options - Optional sourceBase for relative mapping and progress callback
 * @returns Operation result with success/error counts
 */
export async function bulkCopy(
  sources: string[],
  destDir: string,
  options?: BulkOperationOptions,
): Promise<import("./files.types").OperationResult> {
  const { sourceBase, onProgress } = options ?? {};
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy: ${sources.length} files to ${destDir}`);

  const errors: Array<{ file: string; error: string }> = [];
  let completed = 0;
  
  // Execute copies in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const dest = resolveBulkDestPath(src, destDir, sourceBase);
        const displayName = path.basename(dest);

        // Report progress
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: displayName,
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
            currentFile: displayName,
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
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] [REQ-DIRECTORY_TREE]: how — bulkMove with optional sourceBase relative dest mapping; Promise.allSettled per source
 * Move multiple files with progress tracking
 * 
 * @param sources - Array of source file paths
 * @param destDir - Destination directory path
 * @param options - Optional sourceBase for relative mapping and progress callback
 * @returns Operation result with success/error counts
 */
export async function bulkMove(
  sources: string[],
  destDir: string,
  options?: BulkOperationOptions,
): Promise<import("./files.types").OperationResult> {
  const { sourceBase, onProgress } = options ?? {};
  logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move: ${sources.length} files to ${destDir}`);
  
  const errors: Array<{ file: string; error: string }> = [];
  let completed = 0;
  
  // Execute moves in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const dest = resolveBulkDestPath(src, destDir, sourceBase);
        const displayName = path.basename(dest);
        
        // Report progress
        if (onProgress) {
          onProgress({
            total: sources.length,
            completed,
            currentFile: displayName,
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
            currentFile: displayName,
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
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: bulkCopy bulkMove bulkDelete in files.data.ts run Promise.allSettled per source without stopping on first failure
 * Delete multiple files with progress tracking
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
 * [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: single pass over pane file lists building Map filename to parallel panes/sizes/mtimes arrays
 * Build comparison index from multiple pane contents
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
    // [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: return CompareState only when filename exists in 2+ panes AND requested paneIndex is among them
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
    
    // [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: sorted list of filenames appearing in two or more panes
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