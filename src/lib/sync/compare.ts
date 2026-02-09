// [IMPL-NSYNC_COMPARE] [ARCH-COPY_POLICY] [REQ-COMPARE_METHODS]
// File comparison module with multiple comparison methods

import fs from "fs/promises";
import { computeFileHash, verifyHash } from "./hash";
import type { CompareMethod, HashAlgorithm } from "../sync.types";
import { logger } from "../logger";

/**
 * Compare two files to determine if they should be considered equivalent
 * [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]
 * 
 * @param sourcePath - Source file path
 * @param destPath - Destination file path
 * @param method - Comparison method
 * @param hashAlgorithm - Hash algorithm (used if method is 'hash')
 * @returns True if files are equivalent (skip copy), false otherwise
 */
export async function compareFiles(
  sourcePath: string,
  destPath: string,
  method: CompareMethod,
  hashAlgorithm?: HashAlgorithm
): Promise<boolean> {
  logger.debug(["IMPL-NSYNC_COMPARE", "REQ-COMPARE_METHODS"], 
    `Comparing ${sourcePath} to ${destPath} using method: ${method}`);
  
  try {
    // Get stats for both files
    const [sourceStat, destStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(destPath),
    ]);
    
    // If destination doesn't exist, files are not equivalent
    if (!destStat) {
      return false;
    }
    
    // Compare based on method
    switch (method) {
      case "none":
        // Always copy (never equivalent)
        return false;
      
      case "size":
        return compareSize(sourceStat, destStat);
      
      case "mtime":
        return compareMtime(sourceStat, destStat);
      
      case "size-mtime":
        return compareSize(sourceStat, destStat) && compareMtime(sourceStat, destStat);
      
      case "hash":
        // Hash comparison requires computing hashes
        if (!hashAlgorithm) {
          logger.warn(["IMPL-NSYNC_COMPARE"], "Hash comparison requested but no algorithm provided, falling back to size+mtime");
          return compareSize(sourceStat, destStat) && compareMtime(sourceStat, destStat);
        }
        return await compareHash(sourcePath, destPath, hashAlgorithm);
      
      default:
        logger.warn(["IMPL-NSYNC_COMPARE"], `Unknown compare method: ${method}, falling back to size+mtime`);
        return compareSize(sourceStat, destStat) && compareMtime(sourceStat, destStat);
    }
  } catch (error) {
    // If destination doesn't exist or other error, files are not equivalent
    logger.debug(["IMPL-NSYNC_COMPARE"], `Comparison error: ${error}`, { sourcePath, destPath });
    return false;
  }
}

/**
 * Compare file sizes
 * [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]
 * 
 * @param sourceStat - Source file stats
 * @param destStat - Destination file stats
 * @returns True if sizes match
 */
function compareSize(
  sourceStat: Awaited<ReturnType<typeof fs.stat>>,
  destStat: Awaited<ReturnType<typeof fs.stat>>
): boolean {
  const match = sourceStat.size === destStat.size;
  logger.trace(["IMPL-NSYNC_COMPARE"], `Size comparison: ${match} (src: ${sourceStat.size}, dest: ${destStat.size})`);
  return match;
}

/**
 * Compare file modification times
 * [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]
 * 
 * @param sourceStat - Source file stats
 * @param destStat - Destination file stats
 * @returns True if mtimes match (within 1 second tolerance)
 */
function compareMtime(
  sourceStat: Awaited<ReturnType<typeof fs.stat>>,
  destStat: Awaited<ReturnType<typeof fs.stat>>
): boolean {
  // Allow 1 second tolerance for mtime comparison
  // (filesystem timestamp resolution varies)
  const tolerance = 1000; // 1 second in milliseconds
  const srcTime = sourceStat.mtime.getTime();
  const destTime = destStat.mtime.getTime();
  const diff = Math.abs(srcTime - destTime);
  const match = diff <= tolerance;
  
  logger.trace(["IMPL-NSYNC_COMPARE"], `Mtime comparison: ${match} (diff: ${diff}ms)`);
  return match;
}

/**
 * Compare files by hash
 * [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS] [REQ-HASH_COMPUTATION]
 * 
 * @param sourcePath - Source file path
 * @param destPath - Destination file path
 * @param algorithm - Hash algorithm to use
 * @returns True if hashes match
 */
async function compareHash(
  sourcePath: string,
  destPath: string,
  algorithm: HashAlgorithm
): Promise<boolean> {
  logger.debug(["IMPL-NSYNC_COMPARE", "REQ-HASH_COMPUTATION"], 
    `Computing ${algorithm} hashes for comparison`);
  
  try {
    // Compute hashes in parallel
    const [sourceHash, destHash] = await Promise.all([
      computeFileHash(sourcePath, algorithm),
      computeFileHash(destPath, algorithm),
    ]);
    
    const match = verifyHash(sourceHash, destHash);
    logger.debug(["IMPL-NSYNC_COMPARE"], `Hash comparison: ${match}`);
    return match;
  } catch (error) {
    logger.error(["IMPL-NSYNC_COMPARE"], `Hash comparison failed: ${error}`);
    return false;
  }
}
