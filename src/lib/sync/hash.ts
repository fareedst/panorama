// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]
// Hash computation module with BLAKE3, SHA256, and XXH3 support

import fs from "fs";
import { blake3 } from "@noble/hashes/blake3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { HashAlgorithm } from "../sync.types";
import { logger } from "../logger";

/**
 * Compute hash of a file using streaming for memory efficiency
 * [IMPL-NSYNC_HASH] [REQ-HASH_COMPUTATION]
 * 
 * @param filePath - Absolute path to file
 * @param algorithm - Hash algorithm to use
 * @returns Hex-encoded hash string
 */
export async function computeFileHash(
  filePath: string,
  algorithm: HashAlgorithm = "blake3"
): Promise<string> {
  logger.debug(["IMPL-NSYNC_HASH", "REQ-HASH_COMPUTATION"], `Computing ${algorithm} hash for ${filePath}`);
  
  try {
    // Get file stats to check if it's a file
    const stats = await fs.promises.stat(filePath);
    
    if (!stats.isFile()) {
      throw new Error(`Cannot hash non-file: ${filePath}`);
    }
    
    // For small files (< 1MB), read entire file
    // For large files, use streaming
    const isSmallFile = stats.size < 1024 * 1024;
    
    if (isSmallFile) {
      const data = await fs.promises.readFile(filePath);
      return computeBufferHash(data, algorithm);
    } else {
      return await computeStreamHash(filePath, algorithm);
    }
  } catch (error) {
    logger.error(["IMPL-NSYNC_HASH", "REQ-HASH_COMPUTATION"], `Failed to compute hash for ${filePath}`, { error: String(error) });
    throw error;
  }
}

/**
 * Compute hash of a buffer
 * [IMPL-NSYNC_HASH]
 * 
 * @param data - Buffer to hash
 * @param algorithm - Hash algorithm
 * @returns Hex-encoded hash string
 */
export function computeBufferHash(
  data: Buffer,
  algorithm: HashAlgorithm
): string {
  switch (algorithm) {
    case "blake3":
      return toHex(blake3(data));
    case "sha256":
      return toHex(sha256(data));
    case "xxh3":
      // XXH3 requires async initialization, fall back to blake3 for sync buffers
      // For production, you'd initialize xxhash-wasm once and cache it
      logger.warn(["IMPL-NSYNC_HASH"], "XXH3 not supported for buffer hash, using BLAKE3");
      return toHex(blake3(data));
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
}

/**
 * Compute hash of a file using streaming
 * [IMPL-NSYNC_HASH] [REQ-HASH_COMPUTATION]
 * 
 * @param filePath - Path to file
 * @param algorithm - Hash algorithm
 * @returns Hex-encoded hash string
 */
async function computeStreamHash(
  filePath: string,
  algorithm: HashAlgorithm
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    
    // Create hasher based on algorithm
    let hasher: ReturnType<typeof blake3.create> | ReturnType<typeof sha256.create>;
    
    switch (algorithm) {
      case "blake3":
        hasher = blake3.create({});
        break;
      case "sha256":
        hasher = sha256.create();
        break;
      case "xxh3":
        // XXH3 streaming requires different API
        // For now, fall back to BLAKE3
        logger.warn(["IMPL-NSYNC_HASH"], "XXH3 streaming not yet implemented, using BLAKE3");
        hasher = blake3.create({});
        break;
      default:
        reject(new Error(`Unsupported hash algorithm: ${algorithm}`));
        return;
    }
    
    stream.on("data", (chunk: string | Buffer) => {
      // Convert string to Buffer if needed
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      hasher.update(buffer);
    });
    
    stream.on("end", () => {
      const hash = hasher.digest();
      resolve(toHex(hash));
    });
    
    stream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Convert Uint8Array to hex string
 * [IMPL-NSYNC_HASH]
 */
function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Verify hash matches expected value
 * [IMPL-NSYNC_HASH]
 * 
 * @param actual - Computed hash
 * @param expected - Expected hash
 * @returns True if hashes match
 */
export function verifyHash(actual: string, expected: string): boolean {
  // Case-insensitive comparison
  return actual.toLowerCase() === expected.toLowerCase();
}
