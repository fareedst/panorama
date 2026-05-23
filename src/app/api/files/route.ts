// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: Top-level File Operations API Routes: GET /api/files for directory listing, POST /api/files for operations (copy, move, delete, rename, bulk-*, sync-all), operation-specific validation, integrated with session logger
// API routes for file operations

import { NextRequest, NextResponse } from "next/server";
import { listDirectory, getUserHomeDirectory, sortFiles } from "@/lib/files.data";
import { filterFileStats } from "@/lib/display-filter-engine";
import { validateOperationSourcesForDisplaySpec } from "@/lib/display-filter-api-validate";
import { serverGetDisplaySpec } from "@/lib/display-spec-store-server";
import { logger } from "@/lib/logger";

/**
 * GET /api/files - List directory contents
 * [IMPL-FILES_API] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dirPath = searchParams.get("path") || getUserHomeDirectory();
    const displaySpecId = searchParams.get("displaySpecId");
    
    logger.debug(["IMPL-FILES_API", "REQ-DIRECTORY_NAVIGATION"], `API request to list directory: ${dirPath}`);
    
    // Validate path (prevent directory traversal)
    if (dirPath.includes("..")) {
      logger.warn(["IMPL-FILES_API", "REQ-DIRECTORY_NAVIGATION"], `Invalid path detected: ${dirPath}`);
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }
    
    const rawFiles = await listDirectory(dirPath);
    const spec = displaySpecId ? await serverGetDisplaySpec(displaySpecId) : null;
    if (displaySpecId && !spec) {
      return NextResponse.json(
        { error: "Display spec not found", specError: true },
        { status: 400 },
      );
    }
    const { files: filtered, hiddenCount } = filterFileStats(rawFiles, spec);
    const sortedFiles = sortFiles(filtered, "Name", true);
    
    logger.info(["IMPL-FILES_API", "REQ-DIRECTORY_NAVIGATION"], `Successfully returned ${sortedFiles.length} files for ${dirPath}`);
    if (displaySpecId) {
      return NextResponse.json({
        files: sortedFiles,
        hiddenCount,
        totalCount: rawFiles.length,
      });
    }
    return NextResponse.json(sortedFiles);
  } catch (error) {
    logger.error(["IMPL-FILES_API", "REQ-DIRECTORY_NAVIGATION"], `Failed to list directory`, { error: String(error) });
    console.error("Error listing directory:", error);
    return NextResponse.json(
      { error: "Failed to list directory" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files - File operations
 * [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]
 *
 * Operations: copy, move, delete, rename (require src/dest per operation);
 * bulk-copy, bulk-move, bulk-delete (require sources array);
 * sync-all [IMPL-NSYNC_ENGINE] (requires sources + destinations; no src).
 */
export async function POST(request: NextRequest) {
  let operation: string | undefined;
  let src: string | undefined;
  let dest: string | undefined;
  
  try {
    const body = await request.json();
    operation = body.operation;
    src = body.src;
    dest = body.dest;
    const displaySpecId = body.displaySpecId as string | undefined;
    
    logger.debug(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `API file operation request`, { operation, src, dest });
    
    // Validate inputs: operation required; src required only for copy/move/delete/rename [IMPL-FILES_API] [IMPL-NSYNC_ENGINE]
    if (!operation) {
      logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Missing operation`);
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    const needsSrc = ["copy", "move", "delete", "rename"].includes(operation);
    if (needsSrc && !src) {
      logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Missing required parameters`, { operation, src });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Validate paths (prevent directory traversal) when present
    if ((src && src.includes("..")) || (dest && dest.includes(".."))) {
      logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Invalid path detected`, { src, dest });
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }
    
    // Import operations dynamically to avoid loading on GET
    const { copyFile, moveFile, deleteFile, renameFile, bulkCopy, bulkMove, bulkDelete } = await import("@/lib/files.data");

    const assertSourcesVisible = async (sources: string[]) => {
      const err = await validateOperationSourcesForDisplaySpec(sources, displaySpecId);
      if (err) {
        logger.warn(["IMPL-DISPLAY_FILTER_API", "REQ-PANE_DISPLAY_FILTER"], err);
        return NextResponse.json({ error: err }, { status: 400 });
      }
      return null;
    };
    
    switch (operation) {
      case "copy": {
        const blocked = await assertSourcesVisible([src!]);
        if (blocked) return blocked;
        if (!dest) {
          logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Copy operation missing destination`, { src });
          return NextResponse.json({ error: "Destination required" }, { status: 400 });
        }
        await copyFile(src!, dest);
        logger.info(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Successfully copied file`, { src, dest });
        break;
      }
      
      case "move": {
        const blocked = await assertSourcesVisible([src!]);
        if (blocked) return blocked;
        if (!dest) {
          logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Move operation missing destination`, { src });
          return NextResponse.json({ error: "Destination required" }, { status: 400 });
        }
        await moveFile(src!, dest);
        logger.info(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Successfully moved file`, { src, dest });
        break;
      }
      
      case "delete": {
        const blocked = await assertSourcesVisible([src!]);
        if (blocked) return blocked;
        await deleteFile(src!);
        logger.info(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Successfully deleted file`, { src });
        break;
      }
      
      case "rename": {
        const blocked = await assertSourcesVisible([src!]);
        if (blocked) return blocked;
        if (!dest) {
          logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Rename operation missing new name`, { src });
          return NextResponse.json({ error: "New name required" }, { status: 400 });
        }
        await renameFile(src!, dest);
        logger.info(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Successfully renamed file`, { src, dest });
        break;
      }
      
      case "bulk-copy": {
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
        const sources = body.sources as string[];
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
          logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy missing sources`);
          return NextResponse.json({ error: "Sources array required" }, { status: 400 });
        }
        if (!dest) {
          logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy missing destination`);
          return NextResponse.json({ error: "Destination directory required" }, { status: 400 });
        }
        const blocked = await assertSourcesVisible(sources);
        if (blocked) return blocked;
        
        const result = await bulkCopy(sources, dest);
        logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy completed`, { 
          successCount: result.successCount, 
          errorCount: result.errors.length 
        });
        return NextResponse.json(result);
      }
      
      case "bulk-move": {
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
        const sources = body.sources as string[];
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
          logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move missing sources`);
          return NextResponse.json({ error: "Sources array required" }, { status: 400 });
        }
        if (!dest) {
          logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move missing destination`);
          return NextResponse.json({ error: "Destination directory required" }, { status: 400 });
        }
        const blockedMove = await assertSourcesVisible(sources);
        if (blockedMove) return blockedMove;
        
        const result = await bulkMove(sources, dest);
        logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move completed`, {
          successCount: result.successCount,
          errorCount: result.errors.length
        });
        return NextResponse.json(result);
      }
      
      case "bulk-delete": {
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
        const sources = body.sources as string[];
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
          logger.warn(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk delete missing sources`);
          return NextResponse.json({ error: "Sources array required" }, { status: 400 });
        }
        const blockedDel = await assertSourcesVisible(sources);
        if (blockedDel) return blockedDel;
        
        const result = await bulkDelete(sources);
        logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk delete completed`, {
          successCount: result.successCount,
          errorCount: result.errors.length
        });
        return NextResponse.json(result);
      }
      
      case "sync-all": {
        // [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
        const sources = body.sources as string[];
        const destinations = body.destinations as string[];
        const move = body.move === true;
        const verify = body.verify === true;
        const hashAlgorithm = body.hashAlgorithm as "blake3" | "sha256" | "xxh3" | undefined;
        const compareMethod = body.compareMethod as "size" | "mtime" | "size-mtime" | "hash" | "none" | undefined;
        
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
          logger.warn(["IMPL-NSYNC_ENGINE", "REQ-NSYNC_MULTI_TARGET"], `Sync-all missing sources`);
          return NextResponse.json({ error: "Sources array required" }, { status: 400 });
        }
        
        if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
          logger.warn(["IMPL-NSYNC_ENGINE", "REQ-NSYNC_MULTI_TARGET"], `Sync-all missing destinations`);
          return NextResponse.json({ error: "Destinations array required" }, { status: 400 });
        }
        const blockedSync = await assertSourcesVisible(sources);
        if (blockedSync) return blockedSync;
        
        // Import SyncEngine dynamically
        const { SyncEngine } = await import("@/lib/sync");
        
        // Create engine and run sync
        const engine = new SyncEngine();
        const result = await engine.sync(sources, destinations, {
          move,
          compareMethod: compareMethod || "size-mtime",
          hashAlgorithm: hashAlgorithm || "blake3",
          verifyDestination: verify,
        });
        
        logger.info(["IMPL-NSYNC_ENGINE", "REQ-NSYNC_MULTI_TARGET"], `Sync-all completed`, {
          itemsCompleted: result.itemsCompleted,
          itemsFailed: result.itemsFailed,
          itemsSkipped: result.itemsSkipped,
          durationMs: result.durationMs,
        });
        
        return NextResponse.json(result);
      }
      
      default:
        logger.warn(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `Unknown operation`, { operation });
        return NextResponse.json(
          { error: "Unknown operation" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(["IMPL-FILES_API", "REQ-FILE_OPERATIONS"], `File operation failed`, { operation, src, dest, error: String(error) });
    console.error("Error performing file operation:", error);
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
