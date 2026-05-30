// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: Session-based file logger with six severity levels, lazy session file creation, and sync FATAL writes
// [ARCH-LOGGING_SYSTEM] [ARCH-LOGGING_CONFIG] [ARCH-LOGGING_SEMANTIC_TOKENS]
// [REQ-LOGGING_SYSTEM] [REQ-LOGGING_CONFIG] [REQ-LOGGING_SEMANTIC_TOKENS]
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

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: read ENABLE_LOGGING (default true), LOG_LEVEL (default INFO), LOG_DIR (default os.tmpdir()), CONSOLE_ERRORS (default true) once at module initialization
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

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: map LOG_LEVEL string to enum; unknown values fall back to INFO
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

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: lazy-create nx1-log timestamped file under logDir with header comment block on first write
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

    // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: emit [LOGGER] Log file created message to console when session file is first created
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

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: normalize to array, wrap each token in brackets if missing, join with spaces for log output
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

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: in non-production NODE_ENV validate token against REQ|ARCH|IMPL|TEST|PROC pattern and console.warn on mismatch
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

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: format each entry as [ISO_TIMESTAMP] [LEVEL] [TOKENS] message optional JSON metadata newline
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
  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: skip all file and async writes when ENABLE_LOGGING is false
  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: discard entries whose numeric level is above configured minimum threshold
  if (!config.enabled || entry.level > config.level) {
    return;
  }

  try {
    const logFile = initializeLogFile();
    const formatted = formatLogEntry(entry);

    // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: mirror ERROR and FATAL entries to console.error when CONSOLE_ERRORS is not false
    if (config.consoleErrors && (entry.level === LogLevelEnum.ERROR || entry.level === LogLevelEnum.FATAL)) {
      const tokens = formatTokens(entry.tokens);
      const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
      
      if (entry.level === LogLevelEnum.FATAL) {
        console.error(`[FATAL] ${tokens} ${entry.message}${metadataStr}`);
      } else {
        console.error(`[ERROR] ${tokens} ${entry.message}${metadataStr}`);
      }
    }

    // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFileSync for FATAL level; appendFile callback for all other levels
    if (entry.level === LogLevelEnum.FATAL) {
      fs.appendFileSync(logFile, formatted, "utf8");
    } else {
      fs.appendFile(logFile, formatted, "utf8", (error) => {
        if (error) {
          console.error("[IMPL-LOGGER_MODULE] Failed to write log:", error);
        }
      });
    }
  } catch (error) {
    // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: on file write failure log to console.error and echo formatted entry via console.log
    console.error("[IMPL-LOGGER_MODULE] Log write failed:", error);
    console.log(formatLogEntry(entry));
  }
}

// ---------------------------------------------------------------------------
// Logger Implementation
// ---------------------------------------------------------------------------

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: all logger methods require tokens as first parameter (string or string array), then message, optional metadata object
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

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: expose fatal/error/warn/info/debug/trace methods mapping to numeric levels FATAL=0 through TRACE=5
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

  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: export logger.getConfig() returning a frozen readonly copy of runtime configuration
  getConfig() {
    return Object.freeze({ ...config });
  },

  // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: return current session log file path or null before first write
  getLogFilePath() {
    return config.logFile;
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { LogLevel, type LogLevelString, type SemanticToken, type LogMetadata } from "./logger.types";
export type { Logger, LogConfig } from "./logger.types";

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: when logging enabled and NODE_ENV is not test, emit info-level initialization message at module load
if (config.enabled && process.env.NODE_ENV !== "test") {
  logger.info(
    ["IMPL-LOGGER_MODULE", "ARCH-LOGGING_SYSTEM"],
    `Logger initialized: level=${getLogLevelName(config.level)}, dir=${config.logDir}`
  );
}
