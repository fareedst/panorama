// [TEST-LOGGER_MODULE] [IMPL-LOGGER_MODULE] [REQ-LOGGING_SYSTEM]
// Unit tests for the logging system

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";

// Mock fs and os before importing logger
vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    appendFile: vi.fn(),
  },
}));

vi.mock("os", () => ({
  default: {
    tmpdir: vi.fn(() => "/tmp"),
  },
}));

const mockedFs = vi.mocked(fs);

describe("[TEST-LOGGER_MODULE] Logger Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.ENABLE_LOGGING;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_DIR;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: read ENABLE_LOGGING (default true), LOG_LEVEL (default INFO), LOG_DIR (default os.tmpdir()), CONSOLE_ERRORS (default true) once at module initialization

  describe("Configuration [IMPL-LOGGER_CONFIG] [REQ-LOGGING_CONFIG]", () => {
    it("should use default configuration when no environment variables set", async () => {
      // Re-import to get fresh config
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.level).toBe(3); // INFO
      expect(config.logDir).toBe("/tmp");
    });

    it("should respect ENABLE_LOGGING=false", async () => {
      process.env.ENABLE_LOGGING = "false";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.enabled).toBe(false);
    });

    it("should parse LOG_LEVEL environment variable", async () => {
      process.env.LOG_LEVEL = "DEBUG";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.level).toBe(4); // DEBUG
    });

    it("should use custom LOG_DIR", async () => {
      process.env.LOG_DIR = "/custom/log/dir";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.logDir).toBe("/custom/log/dir");
    });

    // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: map LOG_LEVEL string to enum; unknown values fall back to INFO
    it("should fall back to INFO for invalid log level", async () => {
      process.env.LOG_LEVEL = "INVALID";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.level).toBe(3); // INFO
    });
  });

  // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: expose fatal/error/warn/info/debug/trace methods mapping to numeric levels FATAL=0 through TRACE=5

  describe("Log Levels [REQ-LOGGING_SYSTEM]", () => {
    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE"; // Enable all levels
      vi.resetModules();
    });

    it("should log FATAL messages", async () => {
      const { logger } = await import("./logger");
      
      logger.fatal("REQ-LOGGING_SYSTEM", "Fatal error occurred");
      
      expect(mockedFs.appendFileSync).toHaveBeenCalled();
      const call = mockedFs.appendFileSync.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[FATAL]");
      expect(content).toContain("[REQ-LOGGING_SYSTEM]");
      expect(content).toContain("Fatal error occurred");
    });

    it("should log ERROR messages", async () => {
      const { logger } = await import("./logger");
      
      logger.error("REQ-LOGGING_SYSTEM", "Error occurred");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[ERROR]");
      expect(content).toContain("Error occurred");
    });

    it("should log WARN messages", async () => {
      const { logger } = await import("./logger");
      
      logger.warn("REQ-LOGGING_SYSTEM", "Warning message");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toMatch(/\[WARN\s*\]/); // Match WARN with optional padding
      expect(content).toContain("Warning message");
    });

    it("should log INFO messages", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Info message");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toMatch(/\[INFO\s*\]/); // Match INFO with optional padding
      expect(content).toContain("Info message");
    });

    it("should log DEBUG messages", async () => {
      const { logger } = await import("./logger");
      
      logger.debug("REQ-LOGGING_SYSTEM", "Debug message");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[DEBUG]");
      expect(content).toContain("Debug message");
    });

    it("should log TRACE messages", async () => {
      const { logger } = await import("./logger");
      
      logger.trace("REQ-LOGGING_SYSTEM", "Trace message");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[TRACE]");
      expect(content).toContain("Trace message");
    });
  });

  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: discard entries whose numeric level is above configured minimum threshold

  describe("Log Level Filtering [REQ-LOGGING_CONFIG]", () => {
    it("should not log below configured level", async () => {
      process.env.LOG_LEVEL = "ERROR";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "This should not be logged");
      
      expect(mockedFs.appendFile).not.toHaveBeenCalled();
    });

    it("should log at configured level", async () => {
      process.env.LOG_LEVEL = "ERROR";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      logger.error("REQ-LOGGING_SYSTEM", "This should be logged");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
    });

    it("should log above configured level", async () => {
      process.env.LOG_LEVEL = "ERROR";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      logger.fatal("REQ-LOGGING_SYSTEM", "This should be logged");
      
      expect(mockedFs.appendFileSync).toHaveBeenCalled();
    });
  });

  // [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: all logger methods require tokens as first parameter (string or string array), then message, optional metadata object

  describe("Semantic Tokens [IMPL-LOGGER_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]", () => {
    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE";
      vi.resetModules();
    });

    it("should accept single token as string", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Single token message");
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[REQ-LOGGING_SYSTEM]");
    });

    it("should accept multiple tokens as array", async () => {
      const { logger } = await import("./logger");
      
      logger.info(["REQ-LOGGING_SYSTEM", "IMPL-LOGGER_MODULE"], "Multiple tokens");
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[REQ-LOGGING_SYSTEM]");
      expect(content).toContain("[IMPL-LOGGER_MODULE]");
    });

    it("should format tokens with brackets if missing", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Token without brackets");
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[REQ-LOGGING_SYSTEM]");
    });

    it("should preserve tokens with brackets", async () => {
      const { logger } = await import("./logger");
      
      logger.info("[REQ-LOGGING_SYSTEM]", "Token with brackets");
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain("[REQ-LOGGING_SYSTEM]");
      // Should not double-wrap
      expect(content).not.toContain("[[REQ-LOGGING_SYSTEM]]");
    });
  });

  // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: append JSON.stringify(metadata) to formatted line when metadata object provided

  describe("Metadata [REQ-LOGGING_SYSTEM]", () => {
    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE";
      vi.resetModules();
    });

    it("should include metadata as JSON", async () => {
      const { logger } = await import("./logger");
      const metadata = { userId: 123, action: "login" };
      
      logger.info("REQ-LOGGING_SYSTEM", "User action", metadata);
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).toContain(JSON.stringify(metadata));
    });

    it("should work without metadata", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Message without metadata");
      
      const call = mockedFs.appendFile.mock.calls[0];
      const content = call[1] as string;
      expect(content).not.toContain("{");
    });
  });

  // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: lazy-create nx1-log timestamped file under logDir with header comment block on first write

  describe("File Creation [ARCH-LOGGING_SYSTEM]", () => {
    beforeEach(async () => {
      vi.resetModules();
    });

    it("should create log file on first write", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "First message");
      
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("nx1-log-"),
        expect.stringContaining("# NX1 Application Log"),
        "utf8"
      );
    });

    it("should include timestamp in filename", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Test message");
      
      const call = mockedFs.writeFileSync.mock.calls[0];
      const filename = call[0] as string;
      expect(filename).toMatch(/nx1-log-\d{4}-\d{2}-\d{2}/);
    });

    it("should return log file path", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "Test message");
      
      const logPath = logger.getLogFilePath();
      expect(logPath).toContain("nx1-log-");
    });
  });

  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: skip all file and async writes when ENABLE_LOGGING is false

  describe("Disabled Logging [REQ-LOGGING_CONFIG]", () => {
    it("should not write when logging disabled", async () => {
      process.env.ENABLE_LOGGING = "false";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "This should not be written");
      
      expect(mockedFs.appendFile).not.toHaveBeenCalled();
      expect(mockedFs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  // [IMPL-LOGGER_MODULE] [ARCH-LOGGING_SYSTEM] [REQ-LOGGING_SYSTEM]: how: appendFileSync for FATAL level; appendFile callback for all other levels

  describe("Synchronous vs Asynchronous Writing [ARCH-LOGGING_SYSTEM]", () => {
    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE";
      vi.resetModules();
    });

    it("should use synchronous write for FATAL", async () => {
      const { logger } = await import("./logger");
      
      logger.fatal("REQ-LOGGING_SYSTEM", "Fatal error");
      
      expect(mockedFs.appendFileSync).toHaveBeenCalled();
      expect(mockedFs.appendFile).not.toHaveBeenCalled();
    });

    it("should use asynchronous write for non-FATAL", async () => {
      const { logger } = await import("./logger");
      
      logger.error("REQ-LOGGING_SYSTEM", "Regular error");
      
      expect(mockedFs.appendFile).toHaveBeenCalled();
      expect(mockedFs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: mirror ERROR and FATAL entries to console.error when CONSOLE_ERRORS is not false

  describe("Console Output [REQ-LOGGING_CONFIG]", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE";
      // Vitest sets CONSOLE_ERRORS=false globally; enable mirroring for this suite.
      process.env.CONSOLE_ERRORS = "true";
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.resetModules();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    // [IMPL-LOGGER_CONFIG] [ARCH-LOGGING_CONFIG] [REQ-LOGGING_CONFIG]: how: emit [LOGGER] Log file created message to console when session file is first created
    it("should output log file path to console on initialization", async () => {
      const { logger } = await import("./logger");
      
      logger.info("REQ-LOGGING_SYSTEM", "First message");
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[LOGGER\] Log file created:.*nx1-log-/)
      );
    });

    it("should mirror ERROR logs to console by default", async () => {
      const { logger } = await import("./logger");
      
      logger.error("REQ-LOGGING_SYSTEM", "Test error message");
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\].*\[REQ-LOGGING_SYSTEM\].*Test error message/)
      );
    });

    it("should mirror FATAL logs to console by default", async () => {
      const { logger } = await import("./logger");
      
      logger.fatal("REQ-LOGGING_SYSTEM", "Test fatal message");
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[FATAL\].*\[REQ-LOGGING_SYSTEM\].*Test fatal message/)
      );
    });

    it("should not mirror INFO logs to console", async () => {
      const { logger } = await import("./logger");
      
      const beforeCount = consoleErrorSpy.mock.calls.length;
      logger.info("REQ-LOGGING_SYSTEM", "Info message");
      
      const errorCalls = consoleErrorSpy.mock.calls.slice(beforeCount).filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("[INFO]")
      );
      expect(errorCalls.length).toBe(0);
    });

    it("should not mirror ERROR/FATAL to console when CONSOLE_ERRORS=false", async () => {
      process.env.CONSOLE_ERRORS = "false";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const beforeCount = consoleErrorSpy.mock.calls.length;
      logger.error("REQ-LOGGING_SYSTEM", "Test error");
      logger.fatal("REQ-LOGGING_SYSTEM", "Test fatal");
      
      // Should not have console.error calls for the log messages themselves
      const errorCalls = consoleErrorSpy.mock.calls.slice(beforeCount).filter(call => 
        call[0] && typeof call[0] === 'string' && (call[0].includes("[ERROR]") || call[0].includes("[FATAL]"))
      );
      expect(errorCalls.length).toBe(0);
    });

    it("should include metadata in console ERROR output", async () => {
      const { logger } = await import("./logger");

      logger.error("REQ-LOGGING_SYSTEM", "Error with metadata", { code: 404 });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[ERROR\].*\[REQ-LOGGING_SYSTEM\].*Error with metadata.*"code":404/
        )
      );
      expect(logger.getConfig().consoleErrors).toBe(true);
    });

    it("should respect CONSOLE_ERRORS environment variable", async () => {
      process.env.CONSOLE_ERRORS = "true";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.consoleErrors).toBe(true);
    });
  });
});
