// [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]
// Simplified store monitoring - track error streaks to detect drive failures

import path from "path";
import { ErrorClass } from "../sync.types";
import { logger } from "../logger";

/**
 * Store monitoring state for tracking error streaks
 * [IMPL-NSYNC_STORE]
 */
interface StoreState {
  /** Error streak count (sequential errors) */
  errorStreak: number;
  /** Whether this store is considered unavailable */
  unavailable: boolean;
  /** Last error timestamp */
  lastError?: number;
}

/**
 * Simplified store monitor - tracks error streaks to detect drive failures
 * [IMPL-NSYNC_STORE] [ARCH-STORE_MONITORING] [REQ-STORE_FAILURE_DETECT]
 * 
 * Unlike the Go nsync which tracks device IDs and probes stores,
 * this simplified version tracks error streaks per destination path.
 */
export class StoreMonitor {
  /** Threshold for marking store as unavailable (default: 3 errors) */
  private threshold: number;
  
  /** Map of destination directory -> store state */
  private stores: Map<string, StoreState>;
  
  /**
   * Create a new store monitor
   * @param threshold - Number of sequential errors before marking unavailable (default: 3)
   */
  constructor(threshold: number = 3) {
    this.threshold = threshold;
    this.stores = new Map();
    
    logger.debug(["IMPL-NSYNC_STORE", "REQ-STORE_FAILURE_DETECT"], `Store monitor created with threshold ${threshold}`);
  }
  
  /**
   * Record a successful operation for a destination
   * [IMPL-NSYNC_STORE]
   * 
   * @param destPath - Destination file path
   */
  recordSuccess(destPath: string): void {
    const storeKey = this.getStoreKey(destPath);
    const state = this.stores.get(storeKey);
    
    if (state) {
      // Reset error streak on success
      state.errorStreak = 0;
      logger.trace(["IMPL-NSYNC_STORE"], `Success recorded for ${storeKey}, streak reset`);
    }
  }
  
  /**
   * Record an error for a destination
   * [IMPL-NSYNC_STORE] [REQ-STORE_FAILURE_DETECT]
   * 
   * @param destPath - Destination file path
   * @param errorClass - Classification of the error
   * @returns True if store should be considered unavailable
   */
  recordError(destPath: string, errorClass: ErrorClass): boolean {
    const storeKey = this.getStoreKey(destPath);
    let state = this.stores.get(storeKey);
    
    if (!state) {
      state = { errorStreak: 0, unavailable: false };
      this.stores.set(storeKey, state);
    }
    
    // Only count StoreUnavailable errors toward the streak
    // File-specific errors (permissions, not found) don't indicate store failure
    if (errorClass === ErrorClass.StoreUnavailable) {
      state.errorStreak++;
      state.lastError = Date.now();
      
      logger.warn(["IMPL-NSYNC_STORE", "REQ-STORE_FAILURE_DETECT"], 
        `Store error streak ${state.errorStreak}/${this.threshold} for ${storeKey}`);
      
      // Mark as unavailable if threshold reached
      if (state.errorStreak >= this.threshold && !state.unavailable) {
        state.unavailable = true;
        logger.error(["IMPL-NSYNC_STORE", "REQ-STORE_FAILURE_ABORT"], 
          `Store marked unavailable: ${storeKey} (${state.errorStreak} sequential errors)`);
      }
    } else {
      // File-specific errors don't count toward streak
      logger.trace(["IMPL-NSYNC_STORE"], `File-specific error for ${storeKey}, streak not incremented`);
    }
    
    return state.unavailable;
  }
  
  /**
   * Check if any store is unavailable
   * [IMPL-NSYNC_STORE] [REQ-STORE_FAILURE_ABORT]
   * 
   * @returns True if any store is marked unavailable
   */
  hasUnavailableStore(): boolean {
    for (const [storeKey, state] of this.stores.entries()) {
      if (state.unavailable) {
        logger.debug(["IMPL-NSYNC_STORE", "REQ-STORE_FAILURE_ABORT"], `Store unavailable: ${storeKey}`);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get list of unavailable stores
   * [IMPL-NSYNC_STORE]
   * 
   * @returns Array of store keys (destination directories) that are unavailable
   */
  getUnavailableStores(): string[] {
    const unavailable: string[] = [];
    for (const [storeKey, state] of this.stores.entries()) {
      if (state.unavailable) {
        unavailable.push(storeKey);
      }
    }
    return unavailable;
  }
  
  /**
   * Get store key from destination path
   * [IMPL-NSYNC_STORE]
   * 
   * For simplicity, we use the destination directory as the store key.
   * The Go version uses device IDs from filesystem stats.
   * 
   * @param destPath - Destination file path
   * @returns Store key (destination directory)
   */
  private getStoreKey(destPath: string): string {
    // Use directory as store key
    return path.dirname(destPath);
  }
  
  /**
   * Classify an error based on error message
   * [IMPL-NSYNC_STORE]
   * 
   * Heuristic: certain error codes suggest store unavailability
   * 
   * @param error - Error object
   * @returns Error classification
   */
  static classifyError(error: Error): ErrorClass {
    const message = error.message.toLowerCase();
    
    // Store unavailable indicators
    if (
      message.includes("enoent") || // No such file or directory (drive detached)
      message.includes("enotdir") || // Not a directory
      message.includes("erofs") || // Read-only filesystem
      message.includes("eio") || // I/O error
      message.includes("ebusy") || // Device busy
      message.includes("eagain") // Resource temporarily unavailable
    ) {
      return ErrorClass.StoreUnavailable;
    }
    
    // Permission errors are file-specific
    if (message.includes("eacces") || message.includes("eperm")) {
      return ErrorClass.FileSpecific;
    }
    
    // Default to file-specific (not a store failure)
    return ErrorClass.FileSpecific;
  }
}
