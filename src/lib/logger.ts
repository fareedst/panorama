// [IMPL-LOGGER_MODULE] [IMPL-LOGGER_CONFIG] [IMPL-LOGGER_TOKENS]
// [ARCH-LOGGING_SYSTEM] [ARCH-LOGGING_CONFIG] [ARCH-LOGGING_SEMANTIC_TOKENS]
// [REQ-LOGGING_SYSTEM] [REQ-LOGGING_CONFIG] [REQ-LOGGING_SEMANTIC_TOKENS]
// Session-based file logging system with semantic token integration.
// Server-only module – imports Node.js fs, path, and os.

import fs from "fs";
import path from "path";
import os from "os";
import type {
  Logger,
  LogConfig,
  LogLevel,
  LogLevelString,
  LogEntry,
  LogMetadata,
  SemanticToken,
} from "./logger.types";
import { LogLevel as LogLevelEnum } from "./logger.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Parse environment variables and create logging configuration.
 * Called once at module initialization.
 */
function loadConfig(): LogConfig {
  const enabled = process.env.ENABLE_LOGGING !== "false"; // true by default
  const levelStr = (process.env.LOG_LEVEL || "INFO").toUpperCase() as LogLevelString;
  const level = parseLogLevel(levelStr);
  const logDir = process.env.LOG_DIR || os.tmpdir();
  const consoleErrors = process.env.CONSOLE_ERRORS !== "false"; // true by default

  return {
    enabled,
    level,
    logDir,
    logFile: null, // Initialized on first write
    consoleErrors,
  };
}

/**
 * Parse log level string to enum value.
 * Falls back to INFO if invalid.
 */
function parseLogLevel(levelStr: LogLevelString): LogLevel {
  const mapping: Record<LogLevelString, LogLevel> = {
    FATAL: LogLevelEnum.FATAL,
    ERROR: LogLevelEnum.ERROR,
    WARN: LogLevelEnum.WARN,
    INFO: LogLevelEnum.INFO,
    DEBUG: LogLevelEnum.DEBUG,
    TRACE: LogLevelEnum.TRACE,
  };
  return mapping[levelStr] ?? LogLevelEnum.INFO;
}

/**
 * Get log level name from enum value.
 */
function getLogLevelName(level: LogLevel): LogLevelString {
  const names: Record<LogLevel, LogLevelString> = {
    [LogLevelEnum.FATAL]: "FATAL",
    [LogLevelEnum.ERROR]: "ERROR",
    [LogLevelEnum.WARN]: "WARN",
    [LogLevelEnum.INFO]: "INFO",
    [LogLevelEnum.DEBUG]: "DEBUG",
    [LogLevelEnum.TRACE]: "TRACE",
  };
  return names[level] || "INFO";
}

// Initialize configuration once at module load
const config: LogConfig = loadConfig();

// ---------------------------------------------------------------------------
// File Management
// ---------------------------------------------------------------------------

/**
 * Initialize log file path with timestamp.
 * Format: nx1-log-YYYY-MM-DD-HH-mm-ss-SSS.log
 */
function initializeLogFile(): string {
  if (config.logFile) {
    return config.logFile;
  }

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/T/, "-")
    .replace(/:/g, "-")
    .replace(/\..+/, "")
    .replace(/-/g, (match, offset) => {
      // Keep YYYY-MM-DD format, replace other separators
      return offset < 10 ? match : "-";
    });
  
  const filename = `nx1-log-${timestamp}-${now.getMilliseconds().toString().padStart(3, "0")}.log`;
  config.logFile = path.join(config.logDir, filename);

  // Create initial log file with header
  const header = `# NX1 Application Log
# Started: ${now.toISOString()}
# Log Level: ${getLogLevelName(config.level)}
# Format: [TIMESTAMP] [LEVEL] [TOKENS] message [metadata]
# ========================================

`;
  
  try {
    fs.writeFileSync(config.logFile, header, "utf8");
    
    // Output log file path to console for visibility
    console.log(`[LOGGER] Log file created: ${config.logFile}`);
  } catch (error) {
    // If we can't write to log file, fall back to console
    console.error("[IMPL-LOGGER_MODULE] Failed to initialize log file:", error);
  }

  return config.logFile;
}

// ---------------------------------------------------------------------------
// Token Formatting and Validation
// ---------------------------------------------------------------------------

/**
 * Format semantic tokens for log output.
 * Tokens are space-separated and enclosed in brackets.
 * 
 * @example
 * formatTokens("REQ-LOGGING_SYSTEM") => "[REQ-LOGGING_SYSTEM]"
 * formatTokens(["REQ-LOGGING_SYSTEM", "IMPL-LOGGER_MODULE"]) => "[REQ-LOGGING_SYSTEM] [IMPL-LOGGER_MODULE]"
 */
function formatTokens(tokens: SemanticToken | SemanticToken[]): string {
  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
  
  // In development, validate token format
  if (process.env.NODE_ENV !== "production") {
    tokenArray.forEach(validateToken);
  }
  
  return tokenArray
    .map((token) => (token.startsWith("[") ? token : `[${token}]`))
    .join(" ");
}

/**
 * Validate semantic token format (development only).
 * Logs warning if token doesn't match expected pattern.
 */
function validateToken(token: string): void {
  const pattern = /^\[?(REQ|ARCH|IMPL|TEST|PROC)-[A-Z_0-9]+\]?$/;
  if (!pattern.test(token)) {
    console.warn(
      `[IMPL-LOGGER_TOKENS] Invalid semantic token format: "${token}". Expected pattern: [PREFIX-IDENTIFIER]`
    );
  }
}

// ---------------------------------------------------------------------------
// Log Entry Formatting
// ---------------------------------------------------------------------------

/**
 * Format log entry as string for file output.
 * Format: [TIMESTAMP] [LEVEL] [TOKENS] message [metadata]
 */
function formatLogEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const level = getLogLevelName(entry.level).padEnd(5, " ");
  const tokens = formatTokens(entry.tokens);
  const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
  
  return `[${timestamp}] [${level}] ${tokens} ${entry.message}${metadata}\n`;
}

// ---------------------------------------------------------------------------
// Log Writing
// ---------------------------------------------------------------------------

/**
 * Write log entry to file.
 * Uses synchronous write for FATAL level to ensure persistence.
 * Uses asynchronous write for other levels for performance.
 * Mirrors ERROR and FATAL logs to console if enabled.
 */
function writeLog(entry: LogEntry): void {
  // Skip if logging disabled or below configured level
  if (!config.enabled || entry.level > config.level) {
    return;
  }

  try {
    const logFile = initializeLogFile();
    const formatted = formatLogEntry(entry);

    // Mirror ERROR and FATAL logs to console if enabled
    if (config.consoleErrors && (entry.level === LogLevelEnum.ERROR || entry.level === LogLevelEnum.FATAL)) {
      const tokens = formatTokens(entry.tokens);
      const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
      
      if (entry.level === LogLevelEnum.FATAL) {
        console.error(`[FATAL] ${tokens} ${entry.message}${metadataStr}`);
      } else {
        console.error(`[ERROR] ${tokens} ${entry.message}${metadataStr}`);
      }
    }

    if (entry.level === LogLevelEnum.FATAL) {
      // Synchronous write for fatal errors to ensure persistence
      fs.appendFileSync(logFile, formatted, "utf8");
    } else {
      // Asynchronous write for performance
      fs.appendFile(logFile, formatted, "utf8", (error) => {
        if (error) {
          console.error("[IMPL-LOGGER_MODULE] Failed to write log:", error);
        }
      });
    }
  } catch (error) {
    // Fall back to console if file write fails
    console.error("[IMPL-LOGGER_MODULE] Log write failed:", error);
    console.log(formatLogEntry(entry));
  }
}

// ---------------------------------------------------------------------------
// Logger Implementation
// ---------------------------------------------------------------------------

/**
 * Create log entry and write to file.
 */
function log(
  level: LogLevel,
  tokens: SemanticToken | SemanticToken[],
  message: string,
  metadata?: LogMetadata
): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    tokens: Array.isArray(tokens) ? tokens : [tokens],
    message,
    metadata,
  };
  
  writeLog(entry);
}

/**
 * Default logger instance implementing the Logger interface.
 */
export const logger: Logger = {
  fatal(tokens, message, metadata) {
    log(LogLevelEnum.FATAL, tokens, message, metadata);
  },

  error(tokens, message, metadata) {
    log(LogLevelEnum.ERROR, tokens, message, metadata);
  },

  warn(tokens, message, metadata) {
    log(LogLevelEnum.WARN, tokens, message, metadata);
  },

  info(tokens, message, metadata) {
    log(LogLevelEnum.INFO, tokens, message, metadata);
  },

  debug(tokens, message, metadata) {
    log(LogLevelEnum.DEBUG, tokens, message, metadata);
  },

  trace(tokens, message, metadata) {
    log(LogLevelEnum.TRACE, tokens, message, metadata);
  },

  getConfig() {
    return Object.freeze({ ...config });
  },

  getLogFilePath() {
    return config.logFile;
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { LogLevel, type LogLevelString, type SemanticToken, type LogMetadata } from "./logger.types";
export type { Logger, LogConfig } from "./logger.types";

// Log initialization message
if (config.enabled && process.env.NODE_ENV !== "test") {
  logger.info(
    ["IMPL-LOGGER_MODULE", "ARCH-LOGGING_SYSTEM"],
    `Logger initialized: level=${getLogLevelName(config.level)}, dir=${config.logDir}`
  );
}
