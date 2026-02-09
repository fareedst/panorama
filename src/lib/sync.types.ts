// [IMPL-NSYNC_TYPES] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
// TypeScript types for multi-destination sync engine (mirrors Go nsync.Observer)

/**
 * Sync plan details provided at the start of a sync operation
 * [IMPL-NSYNC_TYPES]
 */
export interface SyncPlan {
  /** Total bytes to be copied across all items and destinations */
  totalBytes: number;
  /** Total number of items (files/directories) to sync */
  totalItems: number;
  /** Total number of destination directories */
  totalDestinations: number;
  /** Source paths */
  sources: string[];
  /** Destination directory paths */
  destinations: string[];
}

/**
 * Information about a single item being synced
 * [IMPL-NSYNC_TYPES]
 */
export interface ItemInfo {
  /** Full path to source file or directory */
  sourcePath: string;
  /** Size in bytes (0 for directories) */
  size: number;
  /** Whether this is a directory */
  isDirectory: boolean;
}

/**
 * Result for syncing one item to one destination
 * [IMPL-NSYNC_TYPES]
 */
export interface DestResult {
  /** Full path where item was copied/moved */
  destPath: string;
  /** Error if sync to this destination failed */
  error?: Error;
  /** Whether file was skipped (unchanged) */
  skipped?: boolean;
}

/**
 * Result for syncing one item to all destinations
 * [IMPL-NSYNC_TYPES]
 */
export interface ItemResult {
  /** Overall error if item sync failed */
  error?: Error;
  /** Per-destination results */
  destResults: DestResult[];
}

/**
 * Aggregate statistics during sync operation
 * [IMPL-NSYNC_TYPES]
 */
export interface SyncStats {
  /** Total bytes copied so far */
  bytesCopied: number;
  /** Number of items successfully completed */
  itemsCompleted: number;
  /** Number of items that failed */
  itemsFailed: number;
  /** Number of items skipped (unchanged) */
  itemsSkipped: number;
}

/**
 * Error classification for store monitoring
 * [IMPL-NSYNC_TYPES]
 */
export enum ErrorClass {
  /** File-specific error (permissions, not found, etc.) */
  FileSpecific = 'file_specific',
  /** Store unavailable (drive detached, network down) */
  StoreUnavailable = 'store_unavailable',
  /** Hash verification failed */
  VerifyFailed = 'verify_failed',
  /** Operation cancelled by user */
  Cancelled = 'cancelled',
  /** Unknown error */
  Unknown = 'unknown',
}

/**
 * Final result of sync operation
 * [IMPL-NSYNC_TYPES]
 */
export interface SyncResult {
  /** Whether operation was cancelled */
  cancelled: boolean;
  /** Whether operation was aborted due to store failure */
  storeFailureAbort: boolean;
  /** Number of items successfully synced */
  itemsCompleted: number;
  /** Number of items that failed */
  itemsFailed: number;
  /** Number of items skipped */
  itemsSkipped: number;
  /** Total bytes copied */
  bytesCopied: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Errors encountered */
  errors: Array<{ item: string; error: string; errorClass: ErrorClass }>;
}

/**
 * Observer interface for sync progress callbacks
 * Mirrors Go nsync.Observer
 * [IMPL-NSYNC_TYPES] [ARCH-NSYNC_INTEGRATION]
 */
export interface SyncObserver {
  /**
   * Called once at the start of sync with the plan
   */
  onStart(plan: SyncPlan): void;

  /**
   * Called when starting to sync an item
   */
  onItemStart(item: ItemInfo): void;

  /**
   * Called periodically during item sync with progress
   */
  onItemProgress(item: ItemInfo, bytesCopied: number): void;

  /**
   * Called when an item sync completes (success or failure)
   */
  onItemComplete(item: ItemInfo, result: ItemResult): void;

  /**
   * Called periodically with aggregate statistics
   */
  onProgress(stats: SyncStats): void;

  /**
   * Called once at the end of sync with final result
   */
  onFinish(result: SyncResult): void;
}

/**
 * Comparison method for determining if files should be skipped
 * [IMPL-NSYNC_TYPES]
 */
export type CompareMethod = 
  | 'none'           // Always copy
  | 'size'           // Skip if size matches
  | 'mtime'          // Skip if mtime matches
  | 'size-mtime'     // Skip if both size and mtime match
  | 'hash';          // Skip if hash matches (most accurate, slowest)

/**
 * Hash algorithm for file verification
 * [IMPL-NSYNC_TYPES]
 */
export type HashAlgorithm = 
  | 'blake3'         // BLAKE3 (default, fast and secure)
  | 'sha256'         // SHA-256 (widely used, slower)
  | 'xxh3';          // XXH3 (fastest, non-cryptographic)

/**
 * Options for sync operation
 * [IMPL-NSYNC_TYPES]
 */
export interface SyncOptions {
  /** Whether to move (delete source after copy) instead of copy */
  move?: boolean;
  /** Whether to sync directories recursively */
  recursive?: boolean;
  /** Maximum concurrent file operations (default: 5) */
  jobs?: number;
  /** Comparison method to skip unchanged files (default: 'size-mtime') */
  compareMethod?: CompareMethod;
  /** Hash algorithm to use (default: 'blake3') */
  hashAlgorithm?: HashAlgorithm;
  /** Whether to verify destination by recomputing hash after copy (default: false) */
  verifyDestination?: boolean;
  /** Observer for progress callbacks */
  observer?: SyncObserver;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Noop observer for when no observer is provided
 * [IMPL-NSYNC_TYPES]
 */
export const NoopObserver: SyncObserver = {
  onStart: () => {},
  onItemStart: () => {},
  onItemProgress: () => {},
  onItemComplete: () => {},
  onProgress: () => {},
  onFinish: () => {},
};
