# IMPL-LOGGER_MODULE essence pseudocode

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: Session-based file logger with six severity levels, lazy session file creation, and sync FATAL writes

## Summary contract

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: server-only module writes formatted lines to a session log file under logDir; public logger API delegates to shared log/write pipeline

```
IMPL-LOGGER_MODULE_Summary():
  INPUT: tokens, message, optional metadata per log call; LogConfig from IMPL-LOGGER_CONFIG
  OUTPUT: append to session log file; optional console fallback on failure
  DATA: LogLevel FATAL=0..TRACE=5; LogEntry { timestamp, level, tokens[], message, metadata? }
  PRE: IMPL-LOGGER_CONFIG module config initialized
  POST: qualifying entries appended to session file or console fallback on failure
  EFFECTS: IO, State (session log path)
  CONTROL: initializeLogFile on first qualifying write; getLogFilePath exposes path
  TERMINATION: total
```

## LogLevelEnumAndMethods

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: expose fatal/error/warn/info/debug/trace methods mapping to numeric levels FATAL=0 through TRACE=5

```
IMPL-LOGGER_MODULE_LogLevelEnumAndMethods(level, tokens, message, metadata):
  INPUT: tokens, message, optional metadata
  OUTPUT: LogEntry passed to writeLog at corresponding level
  DATA: LogLevel enum; logger object with six methods
  PRE: logger method invoked
  POST: writeLog called with normalized entry
  EFFECTS: IO (via writeLog)
  TERMINATION: total
  entry := { timestamp now, level, tokens normalized to array, message, metadata }
  CALL writeLog(entry)
```

## InitializeSessionLogFile

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: lazy-create nx1-log timestamped file under logDir with header comment block on first write

```
IMPL-LOGGER_MODULE_InitializeSessionLogFile():
  INPUT: config.logDir, config.level, current time
  OUTPUT: config.logFile path; header written via writeFileSync
  DATA: filename nx1-log-YYYY-MM-DD-HH-mm-ss-SSS.log
  PRE: config.logFile not yet set
  POST: session file path assigned and header written
  EFFECTS: IO, State
  FAILURE_MODES: header write failure → console.error, continue without throw
  TERMINATION: total
  IF config.logFile already set THEN RETURN existing path
  timestamp := ISO-derived filename segments plus milliseconds
  config.logFile := join(logDir, filename)
  header := NX1 Application Log comment block with started time and level
  TRY writeFileSync header
  CALL IMPL-LOGGER_CONFIG_OutputLogFilePathOnFirstWrite(config.logFile)
  ON write failure LOG console.error CONTINUE
  RETURN config.logFile
```

## FormatLogEntryLine

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: format each entry as [ISO_TIMESTAMP] [LEVEL] [TOKENS] message optional JSON metadata newline

```
IMPL-LOGGER_MODULE_FormatLogEntryLine(entry):
  INPUT: LogEntry
  OUTPUT: single line string for file append
  DATA: getLogLevelName padded to 5 chars; formatTokens; JSON.stringify metadata when present
  PRE: entry with timestamp, level, tokens, message
  POST: formatted line with optional metadata suffix
  EFFECTS: pure
  TERMINATION: total
  timestamp := entry.timestamp ISO string
  level := padded level name
  tokens := formatTokens(entry.tokens)
  metadata := space + JSON when metadata object present
  RETURN "[timestamp] [level] tokens message metadata\n"
```

## MetadataOptionalJson

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: append JSON.stringify(metadata) to formatted line when metadata object provided

```
IMPL-LOGGER_MODULE_MetadataOptionalJson(entry):
  INPUT: LogEntry with or without metadata
  OUTPUT: file line includes JSON suffix only when metadata defined
  DATA: LogMetadata key-value object
  PRE: entry formatted
  POST: JSON suffix omitted or appended
  EFFECTS: pure
  TERMINATION: total
  IF entry.metadata is undefined THEN omit JSON suffix
  ELSE append space + JSON.stringify(entry.metadata)
```

## FatalSyncWriteOthersAsync

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFileSync for FATAL level; appendFile callback for all other levels

```
IMPL-LOGGER_MODULE_FatalSyncWriteOthersAsync(entry, formatted):
  INPUT: formatted log line, entry.level
  OUTPUT: persisted file content
  DATA: logFile from initializeLogFile
  PRE: session log file initialized
  POST: line appended sync for FATAL else async
  EFFECTS: IO
  TERMINATION: total
  logFile := initializeLogFile()
  IF entry.level is FATAL THEN appendFileSync(logFile, formatted)
  ELSE appendFile(logFile, formatted, callback on error console.error)
```

## LogWriteFailureFallback

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: on file write failure log to console.error and echo formatted entry via console.log

```
IMPL-LOGGER_MODULE_LogWriteFailureFallback(entry, error):
  INPUT: exception during writeLog
  OUTPUT: diagnostic on console; formatted entry still visible
  DATA: formatLogEntry(entry)
  PRE: writeLog catch path
  POST: console.error and console.log diagnostics emitted
  EFFECTS: console IO
  TERMINATION: total
  console.error "[IMPL-LOGGER_MODULE] Log write failed:" error
  console.log formatLogEntry(entry)
```

## ModuleStartupInfoLog

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: when logging enabled and NODE_ENV is not test, emit info-level initialization message at module load

```
IMPL-LOGGER_MODULE_ModuleStartupInfoLog():
  INPUT: config.enabled, NODE_ENV
  OUTPUT: one info log with level and directory
  DATA: tokens IMPL-LOGGER_MODULE and ARCH-LOGGING_SYSTEM
  PRE: module load; logging enabled; not test environment
  POST: single info initialization line when conditions met
  EFFECTS: IO (via writeLog)
  TERMINATION: total
  IF config.enabled AND NODE_ENV !== "test" THEN
    logger.info tokens "Logger initialized: level=..., dir=..."
```

## GetLogFilePath

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: return current session log file path or null before first write

```
IMPL-LOGGER_MODULE_GetLogFilePath():
  INPUT: none
  OUTPUT: config.logFile string or null
  DATA: set by InitializeSessionLogFile
  PRE: none
  POST: current path or null returned
  EFFECTS: pure read
  TERMINATION: total
  RETURN config.logFile
```

## CodeLocations

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — initializeLogFile, formatLogEntry, writeLog, logger API
// FILE: src/lib/logger.types.ts — LogLevel enum, Logger interface, LogEntry
// FILE: src/lib/logger.test.ts — Log Levels, File Creation, Metadata, Sync vs Async describes
// FUNCTION: fatal, error, warn, info, debug, trace, getLogFilePath in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFile callback and try/catch surface write failures to console without throwing to callers

```
IMPL-LOGGER_MODULE_on_error(context, error):
  INPUT: appendFile error or writeLog exception
  OUTPUT: console diagnostics; no throw to callers
  PRE: write failure during log persistence
  POST: error logged; LogWriteFailureFallback when applicable
  EFFECTS: console IO
  TERMINATION: total
  ON appendFile error LOG console.error "[IMPL-LOGGER_MODULE] Failed to write log"
  ON writeLog catch INVOKE LogWriteFailureFallback
  CALLERS never receive thrown errors from log methods
```
