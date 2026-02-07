# Logging System

**[REQ-LOGGING_SYSTEM]** **[ARCH-LOGGING_SYSTEM]** **[IMPL-LOGGER_MODULE]**

## Overview

The logging system provides session-based file logging with semantic token integration for complete traceability according to STDD methodology.

## Features

- **Six Log Levels**: FATAL, ERROR, WARN, INFO, DEBUG, TRACE
- **Session-Based Files**: Each session creates a timestamped log file in the OS temp directory
- **Semantic Token Integration**: All log entries must include semantic tokens for traceability
- **Environment Configuration**: Control logging behavior via environment variables
- **Automatic File Management**: Log files are created automatically with headers

## Quick Start

```typescript
import { logger } from "@/lib/logger";

// Log with semantic tokens (required)
logger.info("REQ-LOGGING_SYSTEM", "Application started");

// Log with multiple tokens
logger.debug(
  ["IMPL-FILES_DATA", "REQ-DIRECTORY_NAVIGATION"],
  "Listing directory: /home/user"
);

// Log with metadata
logger.error(
  "REQ-FILE_OPERATIONS",
  "Failed to copy file",
  { src: "/path/to/file", error: "Permission denied" }
);
```

## Configuration

Control logging behavior via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_LOGGING` | `"true"` | Enable or disable logging |
| `LOG_LEVEL` | `"INFO"` | Minimum log level (FATAL, ERROR, WARN, INFO, DEBUG, TRACE) |
| `LOG_DIR` | `os.tmpdir()` | Directory for log files |
| `CONSOLE_ERRORS` | `"true"` | Mirror ERROR/FATAL logs to console |

**Example:**

```bash
# Disable logging in production
ENABLE_LOGGING=false npm run build

# Enable debug logging for development
LOG_LEVEL=DEBUG npm run dev

# Use custom log directory
LOG_DIR=/var/log/nx1 npm start

# Disable console mirroring
CONSOLE_ERRORS=false npm start
```

## Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| **FATAL** | 0 | Application about to crash or in unrecoverable state |
| **ERROR** | 1 | Error conditions needing attention but not fatal |
| **WARN** | 2 | Warning conditions that might lead to errors |
| **INFO** | 3 | General informational messages (default level) |
| **DEBUG** | 4 | Detailed debugging information |
| **TRACE** | 5 | Very detailed trace information |

**Synchronous vs Asynchronous**: FATAL logs are written synchronously to ensure persistence before crash. All other levels use asynchronous writes for performance.

## Log File Format

**Filename**: `nx1-log-YYYY-MM-DD-HH-mm-ss-SSS.log`

**Entry Format**: `[TIMESTAMP] [LEVEL] [TOKENS] message [metadata]`

**Example**:
```
[2026-02-07T06:33:55.104Z] [INFO ] [REQ-LOGGING_SYSTEM] [IMPL-LOGGER_MODULE] Application started
[2026-02-07T06:33:55.140Z] [DEBUG] [IMPL-FILES_DATA] [REQ-DIRECTORY_NAVIGATION] Listing directory: /home/user
[2026-02-07T06:33:55.168Z] [ERROR] [REQ-FILE_OPERATIONS] Failed to copy file {"src":"/path/to/file","error":"Permission denied"}
```

## Semantic Token Requirements

**[REQ-LOGGING_SEMANTIC_TOKENS]** All log entries **must** include at least one semantic token. Tokens follow the format:

- `[REQ-*]` - Requirements
- `[ARCH-*]` - Architecture decisions
- `[IMPL-*]` - Implementation details
- `[TEST-*]` - Tests
- `[PROC-*]` - Processes

**Development Mode**: Token format is validated in development (NODE_ENV !== "production") with warnings for invalid tokens.

## API Reference

```typescript
interface Logger {
  fatal(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  error(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  warn(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  info(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  debug(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  trace(tokens: SemanticToken | SemanticToken[], message: string, metadata?: LogMetadata): void;
  
  getConfig(): Readonly<LogConfig>;
  getLogFilePath(): string | null;
}
```

## Integration Examples

### File Operations

```typescript
import { logger } from "@/lib/logger";

export async function copyFile(src: string, dest: string): Promise<void> {
  logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Copying: ${src} -> ${dest}`);
  
  try {
    await fs.copyFile(src, dest);
    logger.info(["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"], `Success: ${src} -> ${dest}`);
  } catch (error) {
    logger.error(
      ["IMPL-FILES_DATA", "REQ-FILE_OPERATIONS"],
      `Failed to copy: ${src} -> ${dest}`,
      { error: String(error) }
    );
    throw error;
  }
}
```

### Configuration Loading

```typescript
import { logger } from "@/lib/logger";

function readYamlFile(filePath: string): Record<string, unknown> {
  logger.debug(["IMPL-CONFIG_LOADER", "REQ-CONFIG_DRIVEN_UI"], `Reading: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    logger.trace(["IMPL-CONFIG_LOADER"], `Successfully loaded ${filePath}`);
    return yaml.load(content);
  } catch (error) {
    logger.warn(
      ["IMPL-CONFIG_LOADER", "REQ-CONFIG_DRIVEN_UI"],
      `Config not found: ${filePath}, using defaults`,
      { error: String(error) }
    );
    return {};
  }
}
```

## Console Output

**[REQ-LOGGING_CONFIG]** The logger automatically outputs information to the console for better visibility:

### Log File Path

When the logger initializes and creates a log file, it outputs the file path to the console:

```
[LOGGER] Log file created: /tmp/nx1-log-2026-02-07-23-07-28-650.log
```

This makes it easy to find the log file without needing to check the configuration.

### Error Mirroring

By default, ERROR and FATAL level logs are mirrored to `console.error()` in addition to being written to the log file. This provides immediate visibility of critical issues during development.

**Example output:**
```
[ERROR] [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS] Failed to copy file {"error":"ENOENT"}
[FATAL] [REQ-LOGGING_SYSTEM] Application crash imminent
```

**Disable console mirroring:**
```bash
CONSOLE_ERRORS=false npm start
```

This is useful in production environments where you only want file-based logging.

## Testing

The logger includes 33 comprehensive tests covering:

- All six log levels
- Configuration loading and defaults
- Environment variable parsing
- Log level filtering
## Testing

The logger includes 33 comprehensive tests covering:

- All six log levels
- Configuration loading and defaults
- Environment variable parsing
- Log level filtering
- Semantic token formatting
- Metadata inclusion
- File creation
- Synchronous vs asynchronous writing
- Console output and error mirroring

Run tests: `npm test -- logger.test.ts`

## Architecture Decisions

See STDD documentation:

- **Requirements**: `stdd/requirements.yaml` - REQ-LOGGING_SYSTEM, REQ-LOGGING_CONFIG, REQ-LOGGING_SEMANTIC_TOKENS
- **Architecture**: `stdd/architecture-decisions.yaml` - ARCH-LOGGING_SYSTEM, ARCH-LOGGING_CONFIG, ARCH-LOGGING_SEMANTIC_TOKENS
- **Implementation**: `stdd/implementation-decisions.yaml` - IMPL-LOGGER_MODULE, IMPL-LOGGER_CONFIG, IMPL-LOGGER_TOKENS

## Performance Considerations

- **Buffered Writes**: Non-fatal logs use asynchronous writes for minimal performance impact
- **Synchronous FATAL**: Fatal logs use synchronous writes to ensure persistence
- **No-op When Disabled**: When `ENABLE_LOGGING=false`, all log calls return immediately
- **Level Filtering**: Messages below the configured level are filtered before formatting

## Troubleshooting

**Log files not being created:**
- Check `ENABLE_LOGGING` environment variable is not set to "false"
- Verify write permissions for log directory (default: os.tmpdir())
- Check logger configuration: `logger.getConfig()`

**Log file location:**
- Default: OS temp directory (`os.tmpdir()`)
- Check current log file: `logger.getLogFilePath()`
- Override with `LOG_DIR` environment variable

**Too much/too little logging:**
- Adjust `LOG_LEVEL` environment variable
- Levels in order: FATAL < ERROR < WARN < INFO < DEBUG < TRACE
- Default level is INFO (includes INFO, WARN, ERROR, FATAL)

## Related Documentation

- [STDD Methodology](../stdd/README.md)
- [Semantic Tokens](../stdd/semantic-tokens.md)
- [Architecture Decisions](../stdd/architecture-decisions.yaml)
