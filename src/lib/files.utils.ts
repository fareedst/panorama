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
 * Format date and time for display in YYYY-MM-DD HH:MM:SS format
 * [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
 * 
 * Client-safe utility - no Node.js dependencies
 * 
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "2024-01-15 14:30:45")
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/**
 * Format date as relative age with two significant units
 * [IMPL-FILE_AGE_DISPLAY] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
 * 
 * Client-safe utility - no Node.js dependencies
 * 
 * Examples:
 *   - 4 days 23 hours old → "4 day 23 hr"
 *   - 2 years 3 months old → "2 yr 3 mo"
 *   - 45 minutes 30 seconds old → "45 min 30 sec"
 * 
 * @param date - Date object or ISO string
 * @returns Formatted age string with two significant units
 */
export function formatAge(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  // Handle future dates (show as 0 sec)
  if (diffSec < 0) return "0 sec";
  
  // Time unit thresholds (in seconds)
  const units = [
    { name: "yr", seconds: 31536000 },   // 365 days
    { name: "mo", seconds: 2592000 },    // 30 days
    { name: "wk", seconds: 604800 },     // 7 days
    { name: "day", seconds: 86400 },     // 1 day
    { name: "hr", seconds: 3600 },       // 1 hour
    { name: "min", seconds: 60 },        // 1 minute
    { name: "sec", seconds: 1 },         // 1 second
  ];
  
  // Find first two significant units
  let remaining = diffSec;
  const parts: string[] = [];
  
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (remaining >= unit.seconds) {
      const value = Math.floor(remaining / unit.seconds);
      parts.push(`${value} ${unit.name}`);
      remaining -= value * unit.seconds;
      
      // If we have one unit and there's remaining time, try to find the next unit
      if (parts.length === 1 && remaining > 0 && i < units.length - 1) {
        // Look for next significant unit
        for (let j = i + 1; j < units.length; j++) {
          const nextUnit = units[j];
          if (remaining >= nextUnit.seconds) {
            const nextValue = Math.floor(remaining / nextUnit.seconds);
            parts.push(`${nextValue} ${nextUnit.name}`);
            break;
          }
        }
      }
      
      // Stop once we have two units
      if (parts.length === 2) break;
    }
  }
  
  return parts.length > 0 ? parts.join(" ") : "0 sec";
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

/**
 * Compare two files and describe their size and time differences
 * [IMPL-OVERWRITE_PROMPT] [REQ-BULK_FILE_OPS]
 * 
 * Used to inform user about overwrite consequences in copy/move operations.
 * 
 * @param source - Source file stat
 * @param existing - Existing file stat (in target directory)
 * @returns Object with formatted summaries and comparison text
 */
export function describeFileComparison(
  source: FileStat,
  existing: FileStat
): {
  sourceSummary: string;
  existingSummary: string;
  comparison: string;
} {
  // Format source file
  const sourceSummary = `${formatSize(source.size)}, ${formatDateTime(source.mtime)}`;
  
  // Format existing file
  const existingSummary = `${formatSize(existing.size)}, ${formatDateTime(existing.mtime)}`;
  
  // Compare size
  let sizeComparison: string;
  if (source.size === existing.size) {
    sizeComparison = "Same size";
  } else if (source.size > existing.size) {
    const diff = source.size - existing.size;
    sizeComparison = `Source larger (by ${formatSize(diff)})`;
  } else {
    const diff = existing.size - source.size;
    sizeComparison = `Source smaller (by ${formatSize(diff)})`;
  }
  
  // Compare time
  const sourceTime = typeof source.mtime === "string" ? new Date(source.mtime).getTime() : source.mtime.getTime();
  const existingTime = typeof existing.mtime === "string" ? new Date(existing.mtime).getTime() : existing.mtime.getTime();
  
  let timeComparison: string;
  const timeDiff = Math.abs(sourceTime - existingTime);
  // Consider times equal if within 1 second (filesystem precision)
  if (timeDiff < 1000) {
    timeComparison = "same date";
  } else if (sourceTime > existingTime) {
    timeComparison = "source newer";
  } else {
    timeComparison = "source older";
  }
  
  // Combine comparisons
  const comparison = `${sizeComparison}, ${timeComparison}`;
  
  return {
    sourceSummary,
    existingSummary,
    comparison,
  };
}
