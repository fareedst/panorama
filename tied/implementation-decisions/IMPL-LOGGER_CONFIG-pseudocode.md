# IMPL-LOGGER_CONFIG essence pseudocode

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: Read environment variables at module initialization with defaults; gate writes and console mirroring from parsed configuration

## Summary contract

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: single loadConfig() at module import produces frozen runtime config consumed by writeLog and logger.getConfig()

```
IMPL-LOGGER_CONFIG_Summary():
  INPUT: process.env ENABLE_LOGGING, LOG_LEVEL, LOG_DIR, CONSOLE_ERRORS
  OUTPUT: LogConfig { enabled, level, logDir, logFile null until first write, consoleErrors }
  DATA: parseLogLevel mapping, os.tmpdir() default
  PRE: process.env readable at module import
  POST: config parsed once; logger.getConfig returns readonly snapshot
  EFFECTS: State (module config)
  CONTROL: config parsed once; logger.getConfig returns readonly snapshot
  TERMINATION: total
```

## LoadConfigAtModuleInit

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: read ENABLE_LOGGING (default true), LOG_LEVEL (default INFO), LOG_DIR (default os.tmpdir()), CONSOLE_ERRORS (default true) once at module initialization

```
IMPL-LOGGER_CONFIG_LoadConfigAtModuleInit():
  INPUT: process.env at first import
  OUTPUT: module-level config object
  DATA: enabled := ENABLE_LOGGING !== "false"; levelStr := upper(LOG_LEVEL || "INFO"); logDir := LOG_DIR || tmpdir(); consoleErrors := CONSOLE_ERRORS !== "false"
  PRE: logger module first import
  POST: module config assigned with parsed level and paths
  EFFECTS: State
  TERMINATION: total
  level := parseLogLevel(levelStr)
  logFile := null
  RETURN { enabled, level, logDir, logFile, consoleErrors }
  ASSIGN module config := result at import time
```

## ParseLogLevelFallback

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: map LOG_LEVEL string to enum; unknown values fall back to INFO

```
IMPL-LOGGER_CONFIG_ParseLogLevelFallback(levelStr):
  INPUT: LogLevelString
  OUTPUT: LogLevel numeric enum
  DATA: mapping FATAL..TRACE; default INFO
  PRE: levelStr string provided
  POST: known level mapped; unknown returns INFO
  EFFECTS: pure
  TERMINATION: total
  IF levelStr in known mapping THEN RETURN mapped value
  RETURN INFO
```

## ExportGetLogConfig

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: export logger.getConfig() returning a frozen readonly copy of runtime configuration

```
IMPL-LOGGER_CONFIG_ExportGetLogConfig():
  INPUT: none
  OUTPUT: Readonly<LogConfig> shallow clone
  DATA: current module config
  PRE: config initialized
  POST: frozen shallow copy returned
  EFFECTS: pure read
  TERMINATION: total
  RETURN Object.freeze({ ...config })
```

## NoOpWhenDisabled

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: skip all file and async writes when ENABLE_LOGGING is false

```
IMPL-LOGGER_CONFIG_NoOpWhenDisabled(entry):
  INPUT: LogEntry pending write
  OUTPUT: no fs calls when disabled
  DATA: config.enabled
  PRE: writeLog invoked
  POST: early return when logging disabled
  EFFECTS: none when disabled
  TERMINATION: total
  IF NOT config.enabled THEN RETURN immediately without mutation
```

## LevelThresholdFilter

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: discard entries whose numeric level is above configured minimum threshold

```
IMPL-LOGGER_CONFIG_LevelThresholdFilter(entry):
  INPUT: LogEntry with level, config.level threshold
  OUTPUT: no write when message is below configured verbosity
  DATA: lower numeric level = more severe; entry.level > config.level means skip
  PRE: entry.level and config.level defined
  POST: sub-threshold entries not written
  EFFECTS: none when filtered
  TERMINATION: total
  IF entry.level > config.level THEN RETURN without write
```

## MirrorErrorFatalToConsole

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: mirror ERROR and FATAL entries to console.error when CONSOLE_ERRORS is not false

```
IMPL-LOGGER_CONFIG_MirrorErrorFatalToConsole(entry):
  INPUT: LogEntry at ERROR or FATAL level, config.consoleErrors
  OUTPUT: console.error line with level prefix, formatted tokens, message, optional metadata JSON
  DATA: formatTokens for console line; no mirror for INFO/WARN/DEBUG/TRACE
  PRE: entry at ERROR or FATAL; consoleErrors enabled
  POST: console.error emitted for qualifying entries
  EFFECTS: console IO
  TERMINATION: total
  IF NOT config.consoleErrors THEN RETURN
  IF entry.level NOT IN { ERROR, FATAL } THEN RETURN
  formattedTokens := formatTokens(entry.tokens)
  metadataStr := JSON metadata if present
  IF entry.level is FATAL THEN console.error "[FATAL] ..." ELSE console.error "[ERROR] ..."
```

## OutputLogFilePathOnFirstWrite

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: emit [LOGGER] Log file created message to console when session file is first created

```
IMPL-LOGGER_CONFIG_OutputLogFilePathOnFirstWrite(logFilePath):
  INPUT: newly created log file path after writeFileSync header
  OUTPUT: console.log visibility message once per session file
  DATA: config.logFile path
  PRE: session log file header written
  POST: console.log with path emitted
  EFFECTS: console IO
  TERMINATION: total
  console.log "[LOGGER] Log file created: {logFilePath}"
```

## CodeLocations

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — loadConfig, parseLogLevel, writeLog gating and console mirror
// FILE: src/lib/logger.types.ts — LogConfig interface
// FILE: src/lib/logger.test.ts — Configuration, Log Level Filtering, Disabled Logging, Console Output describes
// FUNCTION: loadConfig, parseLogLevel, getConfig in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: invalid LOG_LEVEL falls back to INFO; file init failure logs console.error but does not throw

```
IMPL-LOGGER_CONFIG_on_error(context, error):
  INPUT: invalid level string or log file init failure
  OUTPUT: fallback level or console error without throw
  PRE: error during config parse or file header write
  POST: INFO default or console.error logged
  EFFECTS: log
  TERMINATION: total
  ON invalid LOG_LEVEL RETURN INFO default
  ON log file header write failure LOG console.error with IMPL-LOGGER_MODULE tag CONTINUE
```
