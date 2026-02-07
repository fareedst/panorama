// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_LISTING]
// TypeScript interfaces for file manager data structures

/**
 * File/directory stat information
 * Note: When received from API, mtime will be a string (JSON serialized Date)
 */
export interface FileStat {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date | string;
  extension: string;
}

/**
 * Sort types for file listing
 * [IMPL-FILES_DATA] [REQ-FILE_LISTING]
 */
export type SortType =
  | "Name"
  | "NameRev"
  | "Size"
  | "SizeRev"
  | "Mtime"
  | "MtimeRev"
  | "Ext"
  | "ExtRev";

/**
 * Comparison state for a file across panes
 * [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]
 */
export interface CompareState {
  /** Pane indices where file exists */
  panes: number[];
  /** File sizes in each pane (parallel to panes array) */
  sizes: number[];
  /** Modification times in each pane (parallel to panes array) - may be string from JSON */
  mtimes: (Date | string)[];
}

/**
 * Size comparison classification
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
 */
export type SizeComparison = "equal" | "smallest" | "largest" | null;

/**
 * Time comparison classification
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
 */
export type TimeComparison = "equal" | "earliest" | "latest" | null;

/**
 * Comparison mode for visual display
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
 */
export type ComparisonMode = "off" | "name" | "size" | "time";

/**
 * Enhanced comparison state with size/time analysis
 * [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
 */
export interface EnhancedCompareState extends CompareState {
  /** Size comparison for each pane (parallel to panes array) */
  sizeComparison: SizeComparison[];
  /** Time comparison for each pane (parallel to panes array) */
  timeComparison: TimeComparison[];
}

/**
 * Comparison index for cross-pane file comparison
 * [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]
 */
export interface ComparisonIndex {
  /**
   * Get comparison state for a file in a specific pane
   * Returns null if file doesn't exist in multiple panes
   */
  get(paneIndex: number, filename: string): CompareState | null;
  
  /**
   * Get all filenames that exist in multiple panes
   */
  getSharedFilenames(): string[];
}

/**
 * Progress callback interface for bulk operations
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 */
export interface OperationProgress {
  /** Total number of files in operation */
  total: number;
  /** Number of files completed */
  completed: number;
  /** Current file being processed */
  currentFile: string;
  /** Array of errors encountered */
  errors: Array<{ file: string; error: string }>;
}

/**
 * Result of a bulk operation
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 */
export interface OperationResult {
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  errorCount: number;
  /** Array of errors encountered */
  errors: Array<{ file: string; error: string }>;
}
