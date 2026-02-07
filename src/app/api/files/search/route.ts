// [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
// API route for searching file contents
// POST /api/files/search

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";
import type { ContentSearchRequest, ContentSearchResponse } from "@/lib/files.search";

/**
 * Maximum number of matches to return
 * [REQ-FILE_SEARCH] Prevent overwhelming client with too many results
 */
const MAX_RESULTS = 1000;

/**
 * Maximum file size to search (10MB)
 * [REQ-FILE_SEARCH] Prevent reading huge files that could cause memory issues
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate path to prevent directory traversal attacks
 * [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] Security validation
 */
function validatePath(requestedPath: string): { valid: boolean; error?: string } {
  // Normalize path
  const normalized = path.normalize(requestedPath);
  
  // Check for directory traversal attempts
  if (normalized.includes("..")) {
    return { valid: false, error: "Path traversal not allowed" };
  }
  
  // Ensure path is absolute
  if (!path.isAbsolute(normalized)) {
    return { valid: false, error: "Path must be absolute" };
  }
  
  return { valid: true };
}

/**
 * Validate regex pattern to prevent ReDoS attacks
 * [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] Security validation
 */
function validateRegex(pattern: string): { valid: boolean; error?: string } {
  // Reject patterns that are too long
  if (pattern.length > 500) {
    return { valid: false, error: "Pattern too long" };
  }
  
  // Test if regex is valid
  try {
    new RegExp(pattern);
  } catch {
    return { valid: false, error: "Invalid regex pattern" };
  }
  
  // Reject patterns with excessive repetition (potential ReDoS)
  const dangerousPatterns = [
    /(\*|\+|\{)\s*(\*|\+|\{)/,  // Nested repetition
    /(\(.*\)){5,}/,              // Many groups
  ];
  
  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: "Potentially dangerous regex pattern" };
    }
  }
  
  return { valid: true };
}

/**
 * Search file for pattern matches
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] Line-by-line matching
 */
async function searchFile(
  filePath: string,
  pattern: string,
  options: {
    regex: boolean;
    caseSensitive: boolean;
    maxMatches: number;
  }
): Promise<Array<{ line: number; content: string; column: number; length: number }>> {
  const matches: Array<{ line: number; content: string; column: number; length: number }> = [];
  
  try {
    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn(
        ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
        "File too large for search",
        { filePath, size: stats.size }
      );
      return matches;
    }
    
    // Read file content
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    // Create matcher
    let matcher: (line: string) => { matched: boolean; index: number; length: number } | null;
    
    if (options.regex) {
      const flags = options.caseSensitive ? "" : "i";
      const re = new RegExp(pattern, flags);
      matcher = (line: string) => {
        const match = re.exec(line);
        return match ? { matched: true, index: match.index, length: match[0].length } : null;
      };
    } else {
      // Simple substring search
      const searchPattern = options.caseSensitive ? pattern : pattern.toLowerCase();
      matcher = (line: string) => {
        const searchLine = options.caseSensitive ? line : line.toLowerCase();
        const index = searchLine.indexOf(searchPattern);
        return index !== -1 ? { matched: true, index, length: pattern.length } : null;
      };
    }
    
    // Search each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || "";
      const matchResult = matcher(line);
      
      if (matchResult) {
        matches.push({
          line: i + 1,
          content: line,
          column: matchResult.index,
          length: matchResult.length,
        });
        
        // Stop if we've hit max matches
        if (matches.length >= options.maxMatches) {
          break;
        }
      }
    }
  } catch (err) {
    // Skip files that can't be read (binary, permissions, etc.)
    logger.debug(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Failed to search file",
      { filePath, error: err instanceof Error ? err.message : String(err) }
    );
  }
  
  return matches;
}

/**
 * Get list of files to search
 * [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] File discovery
 */
async function getFilesToSearch(
  dirPath: string,
  recursive: boolean,
  filePattern?: string
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          // Recursively search subdirectories
          const subFiles = await getFilesToSearch(fullPath, recursive, filePattern);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        // Apply file pattern filter if provided
        if (filePattern) {
          // Simple glob matching (*.txt, test*.js, etc.)
          const pattern = filePattern.replace(/\*/g, ".*");
          const re = new RegExp(`^${pattern}$`);
          if (!re.test(entry.name)) {
            continue;
          }
        }
        
        files.push(fullPath);
      }
    }
  } catch (err) {
    logger.warn(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Failed to read directory",
      { dirPath, error: err instanceof Error ? err.message : String(err) }
    );
  }
  
  return files;
}

/**
 * POST /api/files/search - Search file contents
 * [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH]
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = (await request.json()) as ContentSearchRequest;
    const { pattern, basePath, recursive = true, regex = false, caseSensitive = false, filePattern, maxResults = 1000 } = body;
    
    logger.debug(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Content search request",
      { pattern, basePath, recursive, regex, caseSensitive, filePattern, maxResults }
    );
    
    // Validate required fields
    if (!pattern || !basePath) {
      logger.warn(
        ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
        "Invalid search request - missing fields",
        { pattern: !!pattern, basePath: !!basePath }
      );
      return NextResponse.json(
        { error: "pattern and basePath are required" },
        { status: 400 }
      );
    }
    
    // Validate path
    const pathValidation = validatePath(basePath);
    if (!pathValidation.valid) {
      logger.warn(
        ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
        "Invalid search path",
        { basePath, error: pathValidation.error }
      );
      return NextResponse.json(
        { error: pathValidation.error },
        { status: 400 }
      );
    }
    
    // Validate regex if enabled
    if (regex) {
      const regexValidation = validateRegex(pattern);
      if (!regexValidation.valid) {
        logger.warn(
          ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
          "Invalid regex pattern",
          { pattern, error: regexValidation.error }
        );
        return NextResponse.json(
          { error: regexValidation.error },
          { status: 400 }
        );
      }
    }
    
    // Check if base path exists
    try {
      const stats = await fs.stat(basePath);
      if (!stats.isDirectory()) {
        logger.warn(
          ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
          "Search path is not a directory",
          { basePath }
        );
        return NextResponse.json(
          { error: "basePath must be a directory" },
          { status: 400 }
        );
      }
    } catch (err) {
      logger.warn(
        ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
        "Search path does not exist",
        { basePath, error: err instanceof Error ? err.message : String(err) }
      );
      return NextResponse.json(
        { error: "basePath does not exist" },
        { status: 404 }
      );
    }
    
    // Get files to search
    const filesToSearch = await getFilesToSearch(basePath, recursive, filePattern);
    
    logger.info(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Searching files",
      { fileCount: filesToSearch.length, pattern, basePath }
    );
    
    // Search files
    const results: ContentSearchResponse["results"] = [];
    let totalMatches = 0;
    let truncated = false;
    
    for (const filePath of filesToSearch) {
      const remainingMatches = Math.min(MAX_RESULTS - totalMatches, maxResults - totalMatches);
      if (remainingMatches <= 0) {
        truncated = true;
        break;
      }
      
      const matches = await searchFile(filePath, pattern, {
        regex,
        caseSensitive,
        maxMatches: remainingMatches,
      });
      
      if (matches.length > 0) {
        results.push({
          path: filePath,
          matches,
        });
        totalMatches += matches.length;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Content search completed",
      { totalMatches, fileCount: results.length, duration, truncated }
    );
    
    const response: ContentSearchResponse = {
      results,
      totalMatches,
      truncated,
      duration,
    };
    
    return NextResponse.json(response);
  } catch (err) {
    logger.error(
      ["[REQ-FILE_SEARCH]", "[IMPL-FILE_SEARCH]"],
      "Content search failed",
      { error: err instanceof Error ? err.message : String(err) }
    );
    
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
