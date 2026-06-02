// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: Top-level File Operations API Routes: GET /api/files for directory listing, POST /api/files for operations (copy, move, delete, rename, bulk-*, sync-all), operation-specific validation, integrated with session logger
// API routes for file operations

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { listDirectory, getUserHomeDirectory, sortFiles } from "@/lib/files.data";
import { filterFileStats } from "@/lib/display-filter-engine";
import { validateOperationSourcesForDisplaySpec } from "@/lib/display-filter-api-validate";
import { serverGetDisplaySpec } from "@/lib/display-spec-store-server";
import { logger } from "@/lib/logger";

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: GET reads path (default home), rejects .. traversal, lists directory, optionally filters by display spec, sorts by Name with dirs first, returns legacy array or enriched object
/**
 * GET /api/files - List directory contents
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
    // [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
    // how: GET /api/files lists directory then filterFileStats when displaySpecId resolves on server store; legacy array when omitted.
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

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: POST parses JSON body; operation required; src required only for copy/move/delete/rename; reject .. in src/dest when present
/**
 * POST /api/files - File operations
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
    const { copyFile, moveFile, deleteFile, renameFile, bulkCopy, bulkMove, bulkDelete, bulkTouch, bulkRename } = await import("@/lib/files.data");
    const { validateRenameBasename } = await import("@/lib/rename-regex");

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
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: POST /api/files cases bulk-copy bulk-move bulk-delete validate sources and dest then delegate to files.data bulk functions
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
        
        const sourceBase = body.sourceBase as string | undefined;
        const result = await bulkCopy(sources, dest, { sourceBase });
        logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk copy completed`, { 
          successCount: result.successCount, 
          errorCount: result.errors.length 
        });
        return NextResponse.json(result);
      }
      
      case "bulk-move": {
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: POST /api/files cases bulk-copy bulk-move bulk-delete validate sources and dest then delegate to files.data bulk functions
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
        
        const sourceBase = body.sourceBase as string | undefined;
        const result = await bulkMove(sources, dest, { sourceBase });
        logger.info(["IMPL-BULK_OPS", "REQ-BULK_FILE_OPS"], `Bulk move completed`, {
          successCount: result.successCount,
          errorCount: result.errors.length
        });
        return NextResponse.json(result);
      }
      
      case "bulk-delete": {
        // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: POST /api/files cases bulk-copy bulk-move bulk-delete validate sources and dest then delegate to files.data bulk functions
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

      case "bulk-touch": {
        // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — validate entries array; assertSourcesVisible; delegate to bulkTouch
        const entries = body.entries as Array<{ path?: string; mtime?: string }>;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
          logger.warn(["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"], `Bulk touch missing entries`);
          return NextResponse.json({ error: "Entries array required" }, { status: 400 });
        }

        const parsed: Array<{ path: string; mtime: Date }> = [];
        for (const entry of entries) {
          // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — reject missing path, traversal, missing/invalid mtime per entry
          if (!entry.path || typeof entry.path !== "string") {
            return NextResponse.json({ error: "Each entry requires path" }, { status: 400 });
          }
          if (entry.path.includes("..")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
          }
          if (!entry.mtime || typeof entry.mtime !== "string") {
            return NextResponse.json({ error: "Each entry requires mtime" }, { status: 400 });
          }
          const mtime = new Date(entry.mtime);
          if (Number.isNaN(mtime.getTime())) {
            return NextResponse.json({ error: "Invalid mtime" }, { status: 400 });
          }
          parsed.push({ path: entry.path, mtime });
        }

        const blockedTouch = await assertSourcesVisible(parsed.map((e) => e.path));
        if (blockedTouch) return blockedTouch;

        const touchResult = await bulkTouch(parsed);
        logger.info(["IMPL-TOUCH_MTIME", "REQ-TOUCH_MTIME"], `Bulk touch completed`, {
          successCount: touchResult.successCount,
          errorCount: touchResult.errors.length,
        });
        return NextResponse.json(touchResult);
      }

      case "bulk-rename": {
        // [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — validate entries; same-dir rename; delegate to bulkRename
        const renameEntries = body.entries as Array<{ src?: string; dest?: string }>;
        if (!renameEntries || !Array.isArray(renameEntries) || renameEntries.length === 0) {
          logger.warn(["IMPL-RENAME_REGEX", "REQ-BULK_FILE_OPS"], `Bulk rename missing entries`);
          return NextResponse.json({ error: "Entries array required" }, { status: 400 });
        }

        const parsedRename: Array<{ src: string; dest: string }> = [];
        for (const entry of renameEntries) {
          if (!entry.src || typeof entry.src !== "string") {
            return NextResponse.json({ error: "Each entry requires src" }, { status: 400 });
          }
          if (!entry.dest || typeof entry.dest !== "string") {
            return NextResponse.json({ error: "Each entry requires dest" }, { status: 400 });
          }
          if (entry.src.includes("..") || entry.dest.includes("..")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
          }
          if (path.dirname(entry.src) !== path.dirname(entry.dest)) {
            return NextResponse.json({ error: "Rename must stay in same directory" }, { status: 400 });
          }
          const destBasename = path.basename(entry.dest);
          if (!validateRenameBasename(destBasename)) {
            return NextResponse.json({ error: "Invalid destination name" }, { status: 400 });
          }
          parsedRename.push({ src: entry.src, dest: entry.dest });
        }

        const blockedRename = await assertSourcesVisible(parsedRename.map((e) => e.src));
        if (blockedRename) return blockedRename;

        const renameResult = await bulkRename(parsedRename);
        logger.info(["IMPL-RENAME_REGEX", "REQ-BULK_FILE_OPS"], `Bulk rename completed`, {
          successCount: renameResult.successCount,
          errorCount: renameResult.errors.length,
        });
        return NextResponse.json(renameResult);
      }

      case "bulk-mkdir": {
        // [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: how — validate entries array; validateRenameBasename; delegate to bulkMakeDirectory
        const mkdirEntries = body.entries as Array<{ path?: string }>;
        if (!mkdirEntries || !Array.isArray(mkdirEntries) || mkdirEntries.length === 0) {
          logger.warn(["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"], `Bulk mkdir missing entries`);
          return NextResponse.json({ error: "Entries array required" }, { status: 400 });
        }

        const parsedMkdir: Array<{ path: string }> = [];
        for (const entry of mkdirEntries) {
          if (!entry.path || typeof entry.path !== "string") {
            return NextResponse.json({ error: "Each entry requires path" }, { status: 400 });
          }
          if (entry.path.includes("..")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
          }
          const dirBasename = path.basename(entry.path);
          if (!validateRenameBasename(dirBasename)) {
            return NextResponse.json({ error: "Invalid directory name" }, { status: 400 });
          }
          parsedMkdir.push({ path: entry.path });
        }

        const { bulkMakeDirectory } = await import("@/lib/files.data");
        const mkdirResult = await bulkMakeDirectory(parsedMkdir);
        logger.info(["IMPL-MAKE_DIRECTORY", "REQ-DIRECTORY_NAVIGATION"], `Bulk mkdir completed`, {
          successCount: mkdirResult.successCount,
          errorCount: mkdirResult.errors.length,
        });
        return NextResponse.json(mkdirResult);
      }

      case "execute-command": {
        // [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — validate entries; delegate to executeCommandBatch sequentially
        const execEntries = body.entries as Array<{
          paneIndex?: number;
          cwd?: string;
          command?: string;
          filePath?: string;
          markedPaths?: string[];
        }>;
        if (!execEntries || !Array.isArray(execEntries) || execEntries.length === 0) {
          logger.warn(["IMPL-PANE_COMMAND_EXEC", "REQ-PANE_COMMAND_EXEC"], `Execute command missing entries`);
          return NextResponse.json({ error: "Entries array required" }, { status: 400 });
        }

        for (const entry of execEntries) {
          if (typeof entry.paneIndex !== "number") {
            return NextResponse.json({ error: "Each entry requires paneIndex" }, { status: 400 });
          }
          if (!entry.cwd || typeof entry.cwd !== "string") {
            return NextResponse.json({ error: "Each entry requires cwd" }, { status: 400 });
          }
          if (entry.cwd.includes("..")) {
            return NextResponse.json({ error: "Invalid cwd" }, { status: 400 });
          }
          if (!entry.command || typeof entry.command !== "string" || !entry.command.trim()) {
            return NextResponse.json({ error: "Each entry requires command" }, { status: 400 });
          }
        }

        const { executeCommandBatch } = await import("@/lib/execute-command.data");
        const execResult = await executeCommandBatch(
          execEntries.map((entry) => ({
            paneIndex: entry.paneIndex!,
            cwd: entry.cwd!,
            command: entry.command!.trim(),
            filePath: typeof entry.filePath === "string" ? entry.filePath : "",
            markedPaths: Array.isArray(entry.markedPaths) ? entry.markedPaths : [],
          })),
        );
        logger.info(["IMPL-PANE_COMMAND_EXEC", "REQ-PANE_COMMAND_EXEC"], `Execute command completed`, {
          successCount: execResult.successCount,
          errorCount: execResult.errorCount,
        });
        return NextResponse.json(execResult);
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
        
        const sourceBase = body.sourceBase as string | undefined;
        
        // Import SyncEngine dynamically
        const { SyncEngine } = await import("@/lib/sync");
        
        // Create engine and run sync
        const engine = new SyncEngine();
        const result = await engine.sync(sources, destinations, {
          move,
          compareMethod: compareMethod || "size-mtime",
          hashAlgorithm: hashAlgorithm || "blake3",
          verifyDestination: verify,
          sourceBase,
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
