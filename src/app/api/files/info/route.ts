// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
// API route for file info (detailed metadata)

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * GET /api/files/info?path=...
 * Returns detailed file metadata
 * [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");
    
    if (!filePath) {
      logger.warn(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], "Missing path parameter");
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      );
    }
    
    // Validate path (prevent directory traversal)
    if (filePath.includes("..")) {
      logger.warn(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Invalid path detected: ${filePath}`);
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }
    
    logger.debug(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Getting file info for: ${filePath}`);
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Get additional metadata
    const name = path.basename(filePath);
    const extension = path.extname(filePath);
    const directory = path.dirname(filePath);
    
    // Build detailed metadata response
    const info = {
      name,
      path: filePath,
      directory,
      extension: extension || "(none)",
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      isSymbolicLink: stats.isSymbolicLink(),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
      mode: stats.mode.toString(8), // Octal permissions
      uid: stats.uid,
      gid: stats.gid,
      // Platform-specific fields (Unix/Linux only)
      blocks: "blocks" in stats ? (stats.blocks as number) : null,
      blksize: "blksize" in stats ? (stats.blksize as number) : null,
    };
    
    logger.info(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Successfully returned info for ${filePath}`);
    return NextResponse.json(info);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Failed to get file info`, { error: errorMessage });
    
    // Check for specific error types
    if (errorMessage.includes("ENOENT")) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes("EACCES")) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to get file info" },
      { status: 500 }
    );
  }
}

/**
 * Format bytes as human-readable string
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
