// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: buildEnhancedComparisonIndex classifies size/time deltas; FilePane applies mode-specific CSS classes from classifications
// Enhanced comparison index logic (client-safe, no Node.js imports)

import type {
  FileStat,
  CompareState,
  EnhancedCompareState,
  SizeComparison,
  TimeComparison,
} from "./files.types";

/**
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: scan panes for shared filenames; attach sizeComparison and timeComparison arrays per pane entry
 * Build enhanced comparison index with size/time analysis
 * 
 * @param panes - Array of file lists, one per pane
 * @returns Enhanced comparison data with size/time classifications
 */
export function buildEnhancedComparisonIndex(
  panes: FileStat[][]
): Map<string, Map<number, EnhancedCompareState>> {
  // Map: filename -> Map<paneIndex, EnhancedCompareState>
  const result = new Map<string, Map<number, EnhancedCompareState>>();
  
  // First, build basic comparison index
  const basicIndex = new Map<string, CompareState>();
  
  for (let paneIndex = 0; paneIndex < panes.length; paneIndex++) {
    const paneFiles = panes[paneIndex];
    
    for (const file of paneFiles) {
      const existing = basicIndex.get(file.name);
      
      if (existing) {
        existing.panes.push(paneIndex);
        existing.sizes.push(file.size);
        existing.mtimes.push(file.mtime);
      } else {
        basicIndex.set(file.name, {
          panes: [paneIndex],
          sizes: [file.size],
          mtimes: [file.mtime],
        });
      }
    }
  }
  
  // Now enhance with size/time analysis for files in multiple panes
  for (const [filename, state] of basicIndex.entries()) {
    // Skip files that only exist in one pane
    if (state.panes.length < 2) {
      continue;
    }
    
    // Analyze sizes
    const sizeComparisons = analyzeSizes(state.sizes);
    
    // Analyze times
    const timeComparisons = analyzeTimes(state.mtimes);
    
    // Build per-pane enhanced states
    const paneMap = new Map<number, EnhancedCompareState>();
    
    for (let i = 0; i < state.panes.length; i++) {
      const paneIndex = state.panes[i];
      
      paneMap.set(paneIndex, {
        ...state,
        sizeComparison: [sizeComparisons[i]],
        timeComparison: [timeComparisons[i]],
      });
    }
    
    result.set(filename, paneMap);
  }
  
  return result;
}

/**
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: equal when min=max; else smallest/largest/null for middle values in 3+ panes
 * Analyze size differences across panes
 * 
 * @param sizes - Array of file sizes
 * @returns Size classification for each file
 */
function analyzeSizes(sizes: number[]): SizeComparison[] {
  if (sizes.length < 2) {
    return sizes.map(() => null);
  }
  
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  
  // All sizes equal
  if (minSize === maxSize) {
    return sizes.map(() => "equal");
  }
  
  // Classify each size
  return sizes.map((size) => {
    if (size === minSize) return "smallest";
    if (size === maxSize) return "largest";
    return null; // Middle values in 3+ pane comparison
  });
}

/**
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: parse string or Date mtimes; equal within 1 second; else earliest/latest/null for middle
 * Analyze time differences across panes
 * 
 * @param mtimes - Array of modification times (Date or string)
 * @returns Time classification for each file
 */
function analyzeTimes(mtimes: (Date | string)[]): TimeComparison[] {
  if (mtimes.length < 2) {
    return mtimes.map(() => null);
  }
  
  // Convert all to timestamps
  const timestamps = mtimes.map((t) =>
    typeof t === "string" ? new Date(t).getTime() : t.getTime()
  );
  
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  
  // All times equal (within 1 second for filesystem precision)
  if (maxTime - minTime < 1000) {
    return mtimes.map(() => "equal");
  }
  
  // Classify each time
  return timestamps.map((time) => {
    if (time === minTime) return "earliest";
    if (time === maxTime) return "latest";
    return null; // Middle values in 3+ pane comparison
  });
}
