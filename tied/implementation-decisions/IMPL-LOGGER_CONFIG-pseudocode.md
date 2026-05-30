# IMPL-LOGGER_CONFIG essence pseudocode

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: Read environment variables at module initialization with defaults; gate writes and console mirroring from parsed configuration

## Summary contract

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: single loadConfig() at module import produces frozen runtime config consumed by writeLog and logger.getConfig()

CONTRACT Summary
  INPUT: process.env ENABLE_LOGGING, LOG_LEVEL, LOG_DIR, CONSOLE_ERRORS
  OUTPUT: LogConfig { enabled, level, logDir, logFile null until first write, consoleErrors }
  DATA: parseLogLevel mapping, os.tmpdir() default
  CONTROL: config parsed once; logger.getConfig returns readonly snapshot

## LoadConfigAtModuleInit

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: read ENABLE_LOGGING (default true), LOG_LEVEL (default INFO), LOG_DIR (default os.tmpdir()), CONSOLE_ERRORS (default true) once at module initialization

CONTRACT LoadConfigAtModuleInit
  INPUT: process.env at first import
  OUTPUT: module-level config object
  DATA: enabled := ENABLE_LOGGING !== "false"; levelStr := upper(LOG_LEVEL || "INFO"); logDir := LOG_DIR || tmpdir(); consoleErrors := CONSOLE_ERRORS !== "false"

PROCEDURE IMPL-LOGGER_CONFIG_LoadConfigAtModuleInit()
  level := parseLogLevel(levelStr)
  logFile := null
  RETURN { enabled, level, logDir, logFile, consoleErrors }
  ASSIGN module config := result at import time

## ParseLogLevelFallback

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: map LOG_LEVEL string to enum; unknown values fall back to INFO

CONTRACT ParseLogLevelFallback
  INPUT: LogLevelString
  OUTPUT: LogLevel numeric enum
  DATA: mapping FATAL..TRACE; default INFO

PROCEDURE IMPL-LOGGER_CONFIG_ParseLogLevelFallback(levelStr)
  IF levelStr in known mapping THEN RETURN mapped value
  RETURN INFO

## ExportGetLogConfig

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: export logger.getConfig() returning a frozen readonly copy of runtime configuration

CONTRACT ExportGetLogConfig
  INPUT: none
  OUTPUT: Readonly<LogConfig> shallow clone
  DATA: current module config

PROCEDURE IMPL-LOGGER_CONFIG_ExportGetLogConfig()
  RETURN Object.freeze({ ...config })

## NoOpWhenDisabled

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: skip all file and async writes when ENABLE_LOGGING is false

CONTRACT NoOpWhenDisabled
  INPUT: LogEntry pending write
  OUTPUT: no fs calls when disabled
  DATA: config.enabled

PROCEDURE IMPL-LOGGER_CONFIG_NoOpWhenDisabled(entry)
  IF NOT config.enabled THEN RETURN immediately without mutation

## LevelThresholdFilter

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: discard entries whose numeric level is above configured minimum threshold

CONTRACT LevelThresholdFilter
  INPUT: LogEntry with level, config.level threshold
  OUTPUT: no write when message is below configured verbosity
  DATA: lower numeric level = more severe; entry.level > config.level means skip

PROCEDURE IMPL-LOGGER_CONFIG_LevelThresholdFilter(entry)
  IF entry.level > config.level THEN RETURN without write

## MirrorErrorFatalToConsole

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: mirror ERROR and FATAL entries to console.error when CONSOLE_ERRORS is not false

CONTRACT MirrorErrorFatalToConsole
  INPUT: LogEntry at ERROR or FATAL level, config.consoleErrors
  OUTPUT: console.error line with level prefix, formatted tokens, message, optional metadata JSON
  DATA: formatTokens for console line; no mirror for INFO/WARN/DEBUG/TRACE

PROCEDURE IMPL-LOGGER_CONFIG_MirrorErrorFatalToConsole(entry)
  IF NOT config.consoleErrors THEN RETURN
  IF entry.level NOT IN { ERROR, FATAL } THEN RETURN
  formattedTokens := formatTokens(entry.tokens)
  metadataStr := JSON metadata if present
  IF entry.level is FATAL THEN console.error "[FATAL] ..." ELSE console.error "[ERROR] ..."

## OutputLogFilePathOnFirstWrite

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: emit [LOGGER] Log file created message to console when session file is first created

CONTRACT OutputLogFilePathOnFirstWrite
  INPUT: newly created log file path after writeFileSync header
  OUTPUT: console.log visibility message once per session file
  DATA: config.logFile path

PROCEDURE IMPL-LOGGER_CONFIG_OutputLogFilePathOnFirstWrite(logFilePath)
  console.log "[LOGGER] Log file created: {logFilePath}"

## CodeLocations

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — loadConfig, parseLogLevel, writeLog gating and console mirror
// FILE: src/lib/logger.types.ts — LogConfig interface
// FILE: src/lib/logger.test.ts — Configuration, Log Level Filtering, Disabled Logging, Console Output describes
// FUNCTION: loadConfig, parseLogLevel, getConfig in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: invalid LOG_LEVEL falls back to INFO; file init failure logs console.error but does not throw

PROCEDURE IMPL-LOGGER_CONFIG_on_error(context, error)
  ON invalid LOG_LEVEL RETURN INFO default
  ON log file header write failure LOG console.error with IMPL-LOGGER_MODULE tag CONTINUE
