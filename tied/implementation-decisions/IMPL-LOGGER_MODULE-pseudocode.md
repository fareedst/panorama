# IMPL-LOGGER_MODULE essence pseudocode

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: Session-based file logger with six severity levels, lazy session file creation, and sync FATAL writes

## Summary contract

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: server-only module writes formatted lines to a session log file under logDir; public logger API delegates to shared log/write pipeline

CONTRACT Summary
  INPUT: tokens, message, optional metadata per log call; LogConfig from IMPL-LOGGER_CONFIG
  OUTPUT: append to session log file; optional console fallback on failure
  DATA: LogLevel FATAL=0..TRACE=5; LogEntry { timestamp, level, tokens[], message, metadata? }
  CONTROL: initializeLogFile on first qualifying write; getLogFilePath exposes path

## LogLevelEnumAndMethods

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: expose fatal/error/warn/info/debug/trace methods mapping to numeric levels FATAL=0 through TRACE=5

CONTRACT LogLevelEnumAndMethods
  INPUT: tokens, message, optional metadata
  OUTPUT: LogEntry passed to writeLog at corresponding level
  DATA: LogLevel enum; logger object with six methods

PROCEDURE IMPL-LOGGER_MODULE_LogLevelEnumAndMethods(level, tokens, message, metadata)
  entry := { timestamp now, level, tokens normalized to array, message, metadata }
  CALL writeLog(entry)

## InitializeSessionLogFile

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: lazy-create nx1-log timestamped file under logDir with header comment block on first write

CONTRACT InitializeSessionLogFile
  INPUT: config.logDir, config.level, current time
  OUTPUT: config.logFile path; header written via writeFileSync
  DATA: filename nx1-log-YYYY-MM-DD-HH-mm-ss-SSS.log

PROCEDURE IMPL-LOGGER_MODULE_InitializeSessionLogFile()
  IF config.logFile already set THEN RETURN existing path
  timestamp := ISO-derived filename segments plus milliseconds
  config.logFile := join(logDir, filename)
  header := NX1 Application Log comment block with started time and level
  TRY writeFileSync header
  CALL IMPL-LOGGER_CONFIG_OutputLogFilePathOnFirstWrite(config.logFile)
  ON write failure LOG console.error CONTINUE
  RETURN config.logFile

## FormatLogEntryLine

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: format each entry as [ISO_TIMESTAMP] [LEVEL] [TOKENS] message optional JSON metadata newline

CONTRACT FormatLogEntryLine
  INPUT: LogEntry
  OUTPUT: single line string for file append
  DATA: getLogLevelName padded to 5 chars; formatTokens; JSON.stringify metadata when present

PROCEDURE IMPL-LOGGER_MODULE_FormatLogEntryLine(entry)
  timestamp := entry.timestamp ISO string
  level := padded level name
  tokens := formatTokens(entry.tokens)
  metadata := space + JSON when metadata object present
  RETURN "[timestamp] [level] tokens message metadata\n"

## MetadataOptionalJson

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: append JSON.stringify(metadata) to formatted line when metadata object provided

CONTRACT MetadataOptionalJson
  INPUT: LogEntry with or without metadata
  OUTPUT: file line includes JSON suffix only when metadata defined
  DATA: LogMetadata key-value object

PROCEDURE IMPL-LOGGER_MODULE_MetadataOptionalJson(entry)
  IF entry.metadata is undefined THEN omit JSON suffix
  ELSE append space + JSON.stringify(entry.metadata)

## FatalSyncWriteOthersAsync

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFileSync for FATAL level; appendFile callback for all other levels

CONTRACT FatalSyncWriteOthersAsync
  INPUT: formatted log line, entry.level
  OUTPUT: persisted file content
  DATA: logFile from initializeLogFile

PROCEDURE IMPL-LOGGER_MODULE_FatalSyncWriteOthersAsync(entry, formatted)
  logFile := initializeLogFile()
  IF entry.level is FATAL THEN appendFileSync(logFile, formatted)
  ELSE appendFile(logFile, formatted, callback on error console.error)

## LogWriteFailureFallback

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: on file write failure log to console.error and echo formatted entry via console.log

CONTRACT LogWriteFailureFallback
  INPUT: exception during writeLog
  OUTPUT: diagnostic on console; formatted entry still visible
  DATA: formatLogEntry(entry)

PROCEDURE IMPL-LOGGER_MODULE_LogWriteFailureFallback(entry, error)
  console.error "[IMPL-LOGGER_MODULE] Log write failed:" error
  console.log formatLogEntry(entry)

## ModuleStartupInfoLog

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: when logging enabled and NODE_ENV is not test, emit info-level initialization message at module load

CONTRACT ModuleStartupInfoLog
  INPUT: config.enabled, NODE_ENV
  OUTPUT: one info log with level and directory
  DATA: tokens IMPL-LOGGER_MODULE and ARCH-LOGGING_SYSTEM

PROCEDURE IMPL-LOGGER_MODULE_ModuleStartupInfoLog()
  IF config.enabled AND NODE_ENV !== "test" THEN
    logger.info tokens "Logger initialized: level=..., dir=..."

## GetLogFilePath

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: return current session log file path or null before first write

CONTRACT GetLogFilePath
  INPUT: none
  OUTPUT: config.logFile string or null
  DATA: set by InitializeSessionLogFile

PROCEDURE IMPL-LOGGER_MODULE_GetLogFilePath()
  RETURN config.logFile

## CodeLocations

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — initializeLogFile, formatLogEntry, writeLog, logger API
// FILE: src/lib/logger.types.ts — LogLevel enum, Logger interface, LogEntry
// FILE: src/lib/logger.test.ts — Log Levels, File Creation, Metadata, Sync vs Async describes
// FUNCTION: fatal, error, warn, info, debug, trace, getLogFilePath in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFile callback and try/catch surface write failures to console without throwing to callers

PROCEDURE IMPL-LOGGER_MODULE_on_error(context, error)
  ON appendFile error LOG console.error "[IMPL-LOGGER_MODULE] Failed to write log"
  ON writeLog catch INVOKE LogWriteFailureFallback
  CALLERS never receive thrown errors from log methods
