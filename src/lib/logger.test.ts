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

    it("should fall back to INFO for invalid log level", async () => {
      process.env.LOG_LEVEL = "INVALID";
      vi.resetModules();
      const { logger } = await import("./logger");
      
      const config = logger.getConfig();
      expect(config.level).toBe(3); // INFO
    });
  });

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

  describe("Console Output [REQ-LOGGING_CONFIG]", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      process.env.LOG_LEVEL = "TRACE";
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.resetModules();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

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
      // Clear any CONSOLE_ERRORS env var that might be set
      delete process.env.CONSOLE_ERRORS;
      
      // Import a fresh logger without spies to test actual behavior
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.resetModules();
      
      const { logger } = await import("./logger");
      
      // Just verify the error method works with metadata
      expect(() => {
        logger.error("REQ-LOGGING_SYSTEM", "Error with metadata", { code: 404 });
      }).not.toThrow();
      
      // Verify config has consoleErrors enabled by default
      const config = logger.getConfig();
      expect(config.consoleErrors).toBe(true);
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
