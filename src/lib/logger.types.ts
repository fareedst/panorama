// [IMPL-LOGGER_MODULE] [IMPL-LOGGER_CONFIG] [IMPL-LOGGER_TOKENS]
// [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]
// TypeScript types for the logging system

/**
 * Log levels in ascending order of verbosity.
 * Lower numeric values indicate more severe log levels.
 * 
 * @example
 * - FATAL (0): Application is about to crash or is in unrecoverable state
 * - ERROR (1): Error conditions that need attention but don't crash the app
 * - WARN (2): Warning conditions that might lead to errors
 * - INFO (3): General informational messages
 * - DEBUG (4): Detailed debugging information
 * - TRACE (5): Very detailed trace information
 */
export enum LogLevel {
  FATAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

/**
 * String representation of log levels for configuration and display.
 */
export type LogLevelString = "FATAL" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";

/**
 * Semantic token format for STDD traceability.
 * Tokens must follow the pattern [PREFIX-IDENTIFIER] where:
 * - PREFIX is one of: REQ, ARCH, IMPL, TEST, PROC
 * - IDENTIFIER is an uppercase name with underscores
 * 
 * @example
 * - [REQ-LOGGING_SYSTEM]
 * - [ARCH-FILE_MANAGER_HIERARCHY]
 * - [IMPL-LOGGER_MODULE]
 */
export type SemanticToken = string;

/**
 * Configuration for the logging system.
 * Values are typically read from environment variables at startup.
 */
export interface LogConfig {
  /**
   * Whether logging is enabled.
   * @default true
   */
  enabled: boolean;

  /**
   * Minimum log level to write.
   * Messages below this level will be ignored.
   * @default LogLevel.INFO
   */
  level: LogLevel;

  /**
   * Directory where log files will be written.
   * @default os.tmpdir()
   */
  logDir: string;

  /**
   * Current session log file path (initialized on first write).
   */
  logFile: string | null;

  /**
   * Whether to mirror ERROR and FATAL logs to console.
   * @default true
   */
  consoleErrors: boolean;
}

/**
 * Optional metadata that can be attached to log entries.
 * Will be formatted as JSON in the log output.
 */
export interface LogMetadata {
  [key: string]: unknown;
}

/**
 * Internal structure of a log entry before formatting.
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  tokens: SemanticToken[];
  message: string;
  metadata?: LogMetadata;
}

/**
 * Logger interface for dependency injection and testing.
 */
export interface Logger {
  /**
   * Log a fatal error. Application is about to crash or is in unrecoverable state.
   * Writes synchronously to ensure message is persisted.
   */
  fatal(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Log an error. Error conditions that need attention but don't crash the app.
   */
  error(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Log a warning. Warning conditions that might lead to errors.
   */
  warn(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Log an informational message. General operational information.
   */
  info(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Log debug information. Detailed information for debugging.
   */
  debug(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Log trace information. Very detailed trace information.
   */
  trace(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;

  /**
   * Get current logging configuration.
   */
  getConfig(): Readonly<LogConfig>;

  /**
   * Get path to current log file (if any).
   */
  getLogFilePath(): string | null;
}
