// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
// API route for file preview (text, image, archive)

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * Detect file type based on extension
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
function detectFileType(filePath: string): "text" | "image" | "archive" | "binary" {
  const ext = path.extname(filePath).toLowerCase();
  
  // Text files
  const textExtensions = [
    ".txt", ".md", ".json", ".js", ".ts", ".tsx", ".jsx", ".css", ".html", ".xml",
    ".yaml", ".yml", ".toml", ".ini", ".conf", ".sh", ".bash", ".py", ".rb", ".go",
    ".java", ".c", ".cpp", ".h", ".hpp", ".rs", ".sql", ".log"
  ];
  
  // Image files
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico"];
  
  // Archive files
  const archiveExtensions = [".zip", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar"];
  
  if (textExtensions.includes(ext)) return "text";
  if (imageExtensions.includes(ext)) return "image";
  if (archiveExtensions.includes(ext)) return "archive";
  return "binary";
}

/**
 * GET /api/files/preview?path=...&type=text|image|archive
 * Returns preview content for a file
 * [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");
    const typeParam = searchParams.get("type");
    
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
    
    // Detect file type
    const detectedType = detectFileType(filePath);
    const type = typeParam || detectedType;
    
    logger.debug(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Previewing file: ${filePath} (type: ${type})`);
    
    // Check file exists
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      logger.warn(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Path is not a file: ${filePath}`);
      return NextResponse.json(
        { error: "Path is not a file" },
        { status: 400 }
      );
    }
    
    // Handle different preview types
    switch (type) {
      case "text": {
        const MAX_TEXT_SIZE = 100 * 1024; // 100KB
        
        if (stats.size > MAX_TEXT_SIZE) {
          // Read only first 100KB
          const buffer = Buffer.alloc(MAX_TEXT_SIZE);
          const file = await fs.open(filePath, "r");
          await file.read(buffer, 0, MAX_TEXT_SIZE, 0);
          await file.close();
          
          const content = buffer.toString("utf8");
          const truncated = true;
          
          logger.info(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Text preview truncated for ${filePath} (${stats.size} bytes)`);
          return NextResponse.json({ 
            type: "text", 
            content, 
            truncated,
            originalSize: stats.size 
          });
        }
        
        // Read entire file
        const content = await fs.readFile(filePath, "utf8");
        logger.info(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Text preview returned for ${filePath} (${content.length} chars)`);
        return NextResponse.json({ 
          type: "text", 
          content, 
          truncated: false,
          originalSize: stats.size 
        });
      }
      
      case "image": {
        // For images, return metadata and let client use Next.js Image component
        const name = path.basename(filePath);
        const extension = path.extname(filePath);
        
        logger.info(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Image preview metadata for ${filePath}`);
        return NextResponse.json({
          type: "image",
          name,
          path: filePath,
          size: stats.size,
          extension,
          // Client will use this path with Next.js Image component
          // Note: This requires static file serving or custom image loader
          url: `/api/files/raw?path=${encodeURIComponent(filePath)}`
        });
      }
      
      case "archive": {
        // For Phase 6, just return basic info (no actual archive parsing)
        // Full archive extraction would require additional libraries (jszip, tar-stream)
        const name = path.basename(filePath);
        const extension = path.extname(filePath);
        
        logger.info(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Archive preview (stub) for ${filePath}`);
        return NextResponse.json({
          type: "archive",
          name,
          path: filePath,
          size: stats.size,
          extension,
          // Placeholder - would need jszip or tar-stream to list contents
          message: "Archive preview not yet implemented. Download to view contents."
        });
      }
      
      default:
        logger.warn(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Unsupported preview type: ${type}`);
        return NextResponse.json({
          error: "Unsupported file type for preview",
          detectedType
        }, { status: 400 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(["IMPL-FILE_PREVIEW", "REQ-FILE_PREVIEW"], `Failed to preview file`, { error: errorMessage });
    
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
      { error: "Failed to preview file" },
      { status: 500 }
    );
  }
}
