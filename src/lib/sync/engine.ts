// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
// Core sync engine - orchestrates multi-destination sync with observer pattern

import path from "path";
import { computeFileHash } from "./hash";
import { verifyDestination } from "./verify";
import { compareFiles } from "./compare";
import { copyFile, moveFile, deleteFile, getFileStat } from "./operations";
import { StoreMonitor } from "./store";
import { ErrorClass, NoopObserver } from "../sync.types";
import type {
  SyncOptions,
  SyncResult,
  SyncPlan,
  ItemInfo,
  ItemResult,
  DestResult,
  SyncStats,
  SyncObserver,
} from "../sync.types";
import { logger } from "../logger";

/**
 * Sync engine - orchestrates multi-destination file synchronization
 * [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
 */
export class SyncEngine {
  private observer: SyncObserver;
  private storeMonitor: StoreMonitor;
  
  constructor(observer?: SyncObserver) {
    this.observer = observer || NoopObserver;
    this.storeMonitor = new StoreMonitor(3); // 3 errors before marking unavailable
    
    logger.debug(["IMPL-NSYNC_ENGINE", "REQ-NSYNC_MULTI_TARGET"], "SyncEngine initialized");
  }
  
  /**
   * Sync files from sources to multiple destinations
   * [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET]
   * 
   * @param sources - Array of source file paths
   * @param destinations - Array of destination directory paths
   * @param options - Sync options
   * @returns Sync result with statistics
   */
  async sync(
    sources: string[],
    destinations: string[],
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Defaults
    const {
      move = false,
      compareMethod = "size-mtime",
      hashAlgorithm = "blake3",
      verifyDestination: verify = false,
      observer,
      signal,
    } = options;
    
    logger.info(["IMPL-NSYNC_ENGINE", "REQ-NSYNC_MULTI_TARGET"], 
      `Starting sync: ${sources.length} sources to ${destinations.length} destinations`, 
      { move, compareMethod, verify });
    
    // If observer provided in options, use it
    if (observer) {
      this.observer = observer;
    }
    
    // Build plan
    const plan: SyncPlan = {
      totalBytes: 0,
      totalItems: sources.length,
      totalDestinations: destinations.length,
      sources,
      destinations,
    };
    
    // Calculate total bytes
    for (const source of sources) {
      const stat = await getFileStat(source);
      if (stat) {
        // Convert bigint to number if needed (Node.js stat.size can be bigint for large files)
        plan.totalBytes += typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;
      }
    }
    
    // Notify observer
    this.observer.onStart(plan);
    
    // Initialize result
    const result: SyncResult = {
      cancelled: false,
      storeFailureAbort: false,
      itemsCompleted: 0,
      itemsFailed: 0,
      itemsSkipped: 0,
      bytesCopied: 0,
      durationMs: 0,
      errors: [],
    };
    
    // Track which sources should be deleted (for move)
    const sourcesToDelete = new Set<string>();
    
    // Sync each source to all destinations
    for (const source of sources) {
      // Check for cancellation
      if (signal?.aborted) {
        logger.info(["IMPL-NSYNC_ENGINE"], "Sync cancelled by user");
        result.cancelled = true;
        break;
      }
      
      // Check for store failure
      if (this.storeMonitor.hasUnavailableStore()) {
        logger.error(["IMPL-NSYNC_ENGINE", "REQ-STORE_FAILURE_ABORT"], "Store failure detected, aborting sync");
        result.storeFailureAbort = true;
        break;
      }
      
      // Sync this item to all destinations
      const itemResult = await this.syncItem(
        source,
        destinations,
        {
          compareMethod,
          hashAlgorithm,
          verify,
          move,
        },
        signal
      );
      
      // Update result
      if (itemResult.error) {
        result.itemsFailed++;
        result.errors.push(...itemResult.destResults
          .filter((dr) => dr.error)
          .map((dr) => ({
            item: source,
            error: dr.error!.message,
            errorClass: ErrorClass.FileSpecific,
          })));
      } else {
        // Check if all destinations succeeded
        const allSucceeded = itemResult.destResults.every((dr) => !dr.error);
        const allSkipped = itemResult.destResults.every((dr) => dr.skipped);
        
        if (allSkipped) {
          result.itemsSkipped++;
        } else if (allSucceeded) {
          result.itemsCompleted++;
          
          // For move, mark source for deletion only if ALL destinations succeeded
          if (move) {
            sourcesToDelete.add(source);
          }
          
          // Count bytes copied (only from non-skipped destinations)
          const stat = await getFileStat(source);
          if (stat) {
            const copiedCount = itemResult.destResults.filter((dr) => !dr.skipped && !dr.error).length;
            const size = typeof stat.size === 'bigint' ? Number(stat.size) : stat.size;
            result.bytesCopied += size * copiedCount;
          }
        } else {
          // Partial success - some destinations failed
          result.itemsFailed++;
        }
      }
      
      // Update stats and notify observer
      const stats: SyncStats = {
        bytesCopied: result.bytesCopied,
        itemsCompleted: result.itemsCompleted,
        itemsFailed: result.itemsFailed,
        itemsSkipped: result.itemsSkipped,
      };
      this.observer.onProgress(stats);
    }
    
    // Delete sources (if move and all destinations succeeded)
    if (move && !result.cancelled && !result.storeFailureAbort) {
      for (const source of sourcesToDelete) {
        try {
          await deleteFile(source);
          logger.info(["IMPL-NSYNC_ENGINE", "REQ-MOVE_SEMANTICS"], `Deleted source after successful move: ${source}`);
        } catch (error) {
          logger.error(["IMPL-NSYNC_ENGINE", "REQ-MOVE_SEMANTICS"], `Failed to delete source: ${source}`, { error: String(error) });
          result.errors.push({
            item: source,
            error: `Failed to delete source: ${String(error)}`,
            errorClass: ErrorClass.FileSpecific,
          });
        }
      }
    }
    
    // Calculate duration
    result.durationMs = Date.now() - startTime;
    
    // Notify observer of completion
    this.observer.onFinish(result);
    
    logger.info(["IMPL-NSYNC_ENGINE"], `Sync completed`, {
      itemsCompleted: result.itemsCompleted,
      itemsFailed: result.itemsFailed,
      itemsSkipped: result.itemsSkipped,
      durationMs: result.durationMs,
    });
    
    return result;
  }
  
  /**
   * Sync a single item to all destinations
   * [IMPL-NSYNC_ENGINE]
   */
  private async syncItem(
    source: string,
    destinations: string[],
    options: {
      compareMethod: NonNullable<SyncOptions["compareMethod"]>;
      hashAlgorithm: NonNullable<SyncOptions["hashAlgorithm"]>;
      verify: boolean;
      move: boolean;
    },
    signal?: AbortSignal
  ): Promise<ItemResult> {
    const { compareMethod, hashAlgorithm, verify, move } = options;
    
    // Get source info
    const sourceStat = await getFileStat(source);
    if (!sourceStat) {
      const error = new Error(`Source file not found: ${source}`);
      this.observer.onItemComplete(
        {
          sourcePath: source,
          size: 0,
          isDirectory: false,
        },
        {
          error,
          destResults: [],
        }
      );
      return {
        error,
        destResults: [],
      };
    }
    
    const item: ItemInfo = {
      sourcePath: source,
      size: typeof sourceStat.size === 'bigint' ? Number(sourceStat.size) : sourceStat.size,
      isDirectory: sourceStat.isDirectory(),
    };
    
    // Notify observer
    this.observer.onItemStart(item);
    
    // Compute source hash if needed (for verify or hash comparison)
    let sourceHash: string | undefined;
    if (verify || compareMethod === "hash") {
      try {
        sourceHash = await computeFileHash(source, hashAlgorithm);
        logger.debug(["IMPL-NSYNC_ENGINE"], `Source hash: ${sourceHash}`);
      } catch (error) {
        logger.error(["IMPL-NSYNC_ENGINE"], `Failed to compute source hash`, { error: String(error) });
      }
    }
    
    // Sync to each destination
    const destResults: DestResult[] = await Promise.all(
      destinations.map((dest) =>
        this.syncToDestination(source, dest, item, sourceHash, options, signal)
      )
    );
    
    const itemResult: ItemResult = {
      destResults,
    };
    
    // Check if any destination failed
    const anyFailed = destResults.some((dr) => dr.error);
    if (anyFailed) {
      itemResult.error = new Error("One or more destinations failed");
    }
    
    // Notify observer
    this.observer.onItemComplete(item, itemResult);
    
    return itemResult;
  }
  
  /**
   * Sync to a single destination
   * [IMPL-NSYNC_ENGINE]
   */
  private async syncToDestination(
    source: string,
    destDir: string,
    item: ItemInfo,
    sourceHash: string | undefined,
    options: {
      compareMethod: NonNullable<SyncOptions["compareMethod"]>;
      hashAlgorithm: NonNullable<SyncOptions["hashAlgorithm"]>;
      verify: boolean;
      move: boolean;
    },
    signal?: AbortSignal
  ): Promise<DestResult> {
    const { compareMethod, hashAlgorithm, verify, move } = options;
    
    // Build destination path
    const filename = path.basename(source);
    const destPath = path.join(destDir, filename);
    
    const result: DestResult = {
      destPath,
    };
    
    try {
      // Check for cancellation
      if (signal?.aborted) {
        result.error = new Error("Cancelled");
        return result;
      }
      
      // Compare files to see if we should skip
      const filesEquivalent = await compareFiles(source, destPath, compareMethod, hashAlgorithm);
      
      if (filesEquivalent) {
        logger.debug(["IMPL-NSYNC_ENGINE"], `Skipping (files equivalent): ${destPath}`);
        result.skipped = true;
        this.storeMonitor.recordSuccess(destPath);
        return result;
      }
      
      // Copy or move the file
      if (move) {
        await moveFile(source, destPath);
      } else {
        await copyFile(source, destPath);
      }
      
      // Verify destination if requested
      if (verify && sourceHash) {
        const verified = await verifyDestination(sourceHash, destPath, hashAlgorithm);
        if (!verified) {
          result.error = new Error("Verification failed: hash mismatch");
          this.storeMonitor.recordError(destPath, ErrorClass.VerifyFailed);
          return result;
        }
        logger.debug(["IMPL-NSYNC_ENGINE", "REQ-VERIFY_DEST"], `Destination verified: ${destPath}`);
      }
      
      // Success
      this.storeMonitor.recordSuccess(destPath);
      logger.debug(["IMPL-NSYNC_ENGINE"], `Synced successfully: ${destPath}`);
      
      // Report progress
      this.observer.onItemProgress(item, item.size);
      
    } catch (error) {
      result.error = error as Error;
      
      // Classify error and record with store monitor
      const errorClass = StoreMonitor.classifyError(error as Error);
      const storeUnavailable = this.storeMonitor.recordError(destPath, errorClass);
      
      logger.error(["IMPL-NSYNC_ENGINE"], `Sync failed: ${destPath}`, {
        error: String(error),
        errorClass,
        storeUnavailable,
      });
    }
    
    return result;
  }
}
