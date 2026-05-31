// [TEST-PANE_COMMAND_EXEC] [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]

// [IMPL-PANE_COMMAND_EXEC]: how — vitest hooks; afterEach removed (unused); behavior unchanged
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import {
  executeCommandBatch,
  executeCommandInDirectory,
} from "./execute-command.data";

const mockSpawn = vi.fn();
const mockAccess = vi.fn();

vi.mock("child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
  default: {
    spawn: (...args: unknown[]) => mockSpawn(...args),
  },
}));

vi.mock("fs/promises", () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  default: {
    access: (...args: unknown[]) => mockAccess(...args),
  },
}));

function mockSpawnChild(exitCode: number) {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  mockSpawn.mockImplementationOnce(() => {
    queueMicrotask(() => child.emit("close", exitCode));
    return child;
  });
}

describe("executeCommandInDirectory validation [IMPL-PANE_COMMAND_EXEC]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  // [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — reject path traversal in cwd
  it("rejects cwd with traversal", async () => {
    await expect(
      executeCommandInDirectory("../tmp", "echo hi", {
        panePath: "../tmp",
        filePath: "",
        markedPaths: [],
      }),
    ).rejects.toThrow("Invalid cwd");
  });

  // [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — require absolute cwd
  it("rejects relative cwd", async () => {
    await expect(
      executeCommandInDirectory("tmp", "echo hi", {
        panePath: "tmp",
        filePath: "",
        markedPaths: [],
      }),
    ).rejects.toThrow("Invalid cwd");
  });

  // [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — reject empty trimmed command
  it("rejects empty command", async () => {
    await expect(
      executeCommandInDirectory("/tmp", "  ", {
        panePath: "/tmp",
        filePath: "",
        markedPaths: [],
      }),
    ).rejects.toThrow("Command required");
  });
});

describe("executeCommandInDirectory spawn [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  // [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: execute_env_context — PANORAMA_* env vars on spawn
  it("passes PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, and PANORAMA_MARKED_PATHS to spawn env", async () => {
    mockSpawnChild(0);

    await executeCommandInDirectory("/tmp/work", "echo hi", {
      panePath: "/tmp/work",
      filePath: "/tmp/work/a.txt",
      markedPaths: ["/tmp/work/a.txt", "/tmp/work/b.txt"],
    });

    expect(mockSpawn).toHaveBeenCalledWith(
      "echo hi",
      expect.objectContaining({
        cwd: "/tmp/work",
        shell: true,
        env: expect.objectContaining({
          PANORAMA_PANE_PATH: "/tmp/work",
          PANORAMA_FILE_PATH: "/tmp/work/a.txt",
          PANORAMA_MARKED_PATHS: "/tmp/work/a.txt\n/tmp/work/b.txt",
        }),
      }),
    );
  });

  // [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — capture exit code from child close
  it("returns exit code from spawned process", async () => {
    mockSpawnChild(42);

    const result = await executeCommandInDirectory("/tmp", "false", {
      panePath: "/tmp",
      filePath: "",
      markedPaths: [],
    });

    expect(result.exitCode).toBe(42);
  });
});

describe("executeCommandBatch [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  // [IMPL-PANE_COMMAND_EXEC] [IMPL-FILES_API] [REQ-PANE_COMMAND_EXEC]: how — sequential entries; tally successCount and errorCount
  it("runs entries sequentially and tallies success and error counts", async () => {
    mockSpawnChild(0);
    mockSpawnChild(1);
    mockSpawnChild(0);

    const result = await executeCommandBatch([
      { paneIndex: 0, cwd: "/tmp", command: "echo one" },
      { paneIndex: 1, cwd: "/var", command: "echo two" },
      { paneIndex: 2, cwd: "/opt", command: "echo three" },
    ]);

    expect(mockSpawn).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      results: [
        { paneIndex: 0, exitCode: 0 },
        { paneIndex: 1, exitCode: 1 },
        { paneIndex: 2, exitCode: 0 },
      ],
      successCount: 2,
      errorCount: 1,
    });
  });

  // [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — validation errors increment errorCount
  it("records validation failures without stopping the batch", async () => {
    mockSpawnChild(0);

    const result = await executeCommandBatch([
      { paneIndex: 0, cwd: "../bad", command: "echo bad" },
      { paneIndex: 1, cwd: "/tmp", command: "echo ok" },
    ]);

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.results[0].error).toBe("Invalid cwd");
    expect(result.results[1].exitCode).toBe(0);
  });
});
