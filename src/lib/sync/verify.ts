// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]
// Destination verification module - recompute hash and verify

import { computeFileHash, verifyHash } from "./hash";
import type { HashAlgorithm } from "../sync.types";
import { logger } from "../logger";

/**
 * Verify destination file matches source hash
 * [IMPL-NSYNC_VERIFY] [REQ-VERIFY_DEST]
 * 
 * @param sourceHash - Hash computed from source file
 * @param destPath - Path to destination file
 * @param algorithm - Hash algorithm used
 * @returns True if destination hash matches source hash
 */
export async function verifyDestination(
  sourceHash: string,
  destPath: string,
  algorithm: HashAlgorithm
): Promise<boolean> {
  logger.debug(["IMPL-NSYNC_VERIFY", "REQ-VERIFY_DEST"], `Verifying destination ${destPath}`);
  
  try {
    // Recompute hash on destination
    const destHash = await computeFileHash(destPath, algorithm);
    
    // Compare hashes
    const matches = verifyHash(destHash, sourceHash);
    
    if (matches) {
      logger.debug(["IMPL-NSYNC_VERIFY", "REQ-VERIFY_DEST"], `Destination verified: ${destPath}`);
    } else {
      logger.warn(["IMPL-NSYNC_VERIFY", "REQ-VERIFY_DEST"], `Verification failed for ${destPath}`, {
        sourceHash,
        destHash,
      });
    }
    
    return matches;
  } catch (error) {
    logger.error(["IMPL-NSYNC_VERIFY", "REQ-VERIFY_DEST"], `Failed to verify ${destPath}`, { error: String(error) });
    return false;
  }
}

/**
 * Verify multiple destinations match source hash
 * [IMPL-NSYNC_VERIFY]
 * 
 * @param sourceHash - Hash from source
 * @param destPaths - Array of destination paths
 * @param algorithm - Hash algorithm
 * @returns Array of booleans indicating which destinations verified
 */
export async function verifyMultipleDestinations(
  sourceHash: string,
  destPaths: string[],
  algorithm: HashAlgorithm
): Promise<boolean[]> {
  logger.debug(["IMPL-NSYNC_VERIFY"], `Verifying ${destPaths.length} destinations`);
  
  // Verify all destinations in parallel
  const results = await Promise.all(
    destPaths.map((destPath) => verifyDestination(sourceHash, destPath, algorithm))
  );
  
  const successCount = results.filter((r) => r).length;
  logger.info(["IMPL-NSYNC_VERIFY"], `Verified ${successCount}/${destPaths.length} destinations`);
  
  return results;
}
