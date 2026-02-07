// [IMPL-FILES_DATA] [IMPL-SORT_FILTER] [REQ-FILE_LISTING] [REQ-FILE_SORTING_ADVANCED]
// Client-safe file utilities (no Node.js dependencies)

import type { FileStat } from "./files.types";

/**
 * Sort criterion for file listing
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 */
export type SortCriterion = "name" | "size" | "mtime" | "extension";

/**
 * Sort direction
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 */
export type SortDirection = "asc" | "desc";

/**
 * Format file size for display
 * [IMPL-FILES_DATA] [REQ-FILE_LISTING]
 * 
 * Client-safe utility - no Node.js dependencies
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i === 0) {
    return `${bytes} B`;
  }
  
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(1)} ${units[i]}`;
}

/**
 * Sort files by multiple criteria
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 * 
 * Implements composable sort pipeline with:
 * - Optional directory priority (directories always first)
 * - Primary sort criterion (name, size, time, extension)
 * - Sort direction (ascending/descending)
 * 
 * @param files - Array of files to sort
 * @param sortBy - Sort criterion
 * @param direction - Sort direction
 * @param dirsFirst - Whether to prioritize directories
 * @returns New sorted array (does not mutate input)
 */
export function sortFiles(
  files: FileStat[],
  sortBy: SortCriterion = "name",
  direction: SortDirection = "asc",
  dirsFirst: boolean = true
): FileStat[] {
  const sorted = [...files];
  const ascending = direction === "asc";
  
  sorted.sort((a, b) => {
    // [ARCH-SORT_PIPELINE] Directory priority layer
    if (dirsFirst && a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    
    // [ARCH-SORT_PIPELINE] Primary sort criterion
    let result = 0;
    switch (sortBy) {
      case "name":
        result = compareName(a, b);
        break;
      case "size":
        result = compareSize(a, b);
        break;
      case "mtime":
        result = compareMtime(a, b);
        break;
      case "extension":
        result = compareExtension(a, b);
        break;
    }
    
    // [ARCH-SORT_PIPELINE] Apply sort direction
    return ascending ? result : -result;
  });
  
  return sorted;
}

/**
 * Compare files by name (case-insensitive)
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 */
function compareName(a: FileStat, b: FileStat): number {
  return a.name.localeCompare(b.name, undefined, { 
    sensitivity: "base", // case-insensitive
    numeric: true         // natural number sorting (file10 after file2)
  });
}

/**
 * Compare files by size (bytes)
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 */
function compareSize(a: FileStat, b: FileStat): number {
  return a.size - b.size;
}

/**
 * Compare files by modification time
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 * 
 * Handles both Date objects and ISO string dates (from JSON serialization)
 */
function compareMtime(a: FileStat, b: FileStat): number {
  const timeA = typeof a.mtime === "string" ? new Date(a.mtime).getTime() : a.mtime.getTime();
  const timeB = typeof b.mtime === "string" ? new Date(b.mtime).getTime() : b.mtime.getTime();
  return timeA - timeB;
}

/**
 * Compare files by extension
 * [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
 * 
 * Files without extensions sort before files with extensions.
 * Within same extension, sorts by name as secondary criterion.
 */
function compareExtension(a: FileStat, b: FileStat): number {
  // Empty extensions sort first
  if (!a.extension && !b.extension) return compareName(a, b);
  if (!a.extension) return -1;
  if (!b.extension) return 1;
  
  // Compare extensions
  const extResult = a.extension.localeCompare(b.extension, undefined, { sensitivity: "base" });
  
  // If extensions equal, use name as tiebreaker
  return extResult !== 0 ? extResult : compareName(a, b);
}

/**
 * Get display label for sort criterion
 * [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED]
 */
export function getSortLabel(sortBy: SortCriterion): string {
  switch (sortBy) {
    case "name":
      return "Name";
    case "size":
      return "Size";
    case "mtime":
      return "Time";
    case "extension":
      return "Extension";
  }
}

/**
 * Get display symbol for sort direction
 * [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED]
 */
export function getSortDirectionSymbol(direction: SortDirection): string {
  return direction === "asc" ? "↑" : "↓";
}
