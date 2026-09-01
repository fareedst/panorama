// [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY]: Provider unit tests — statfs mock matrix
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  default: {
    statfs: vi.fn(),
  },
}));

import fs from "fs/promises";
import {
  getVolumeStats,
  normalizeVolumeStats,
  type StatFsLike,
} from "./volume-stats";

const mockedStatfs = vi.mocked(fs.statfs);

describe("normalizeVolumeStats [REQ-PANE_VOLUME_CAPACITY]", () => {
  it("returns available stats with correct bytes and free percent", () => {
    const raw: StatFsLike = {
      bsize: 4096,
      blocks: 1_000_000,
      bavail: 250_000,
      dev: 42,
    };
    const result = normalizeVolumeStats(raw, "/data/projects");
    expect(result).toMatchObject({
      status: "available",
      sourcePath: "/data/projects",
      totalBytes: 4_096_000_000,
      availableBytes: 1_024_000_000,
      freePercent: 25,
      deviceId: 42,
    });
    expect(result.errorCode).toBeUndefined();
  });

  it("uses bavail for available bytes when bfree differs", () => {
    const raw: StatFsLike = {
      bsize: 512,
      blocks: 10_000,
      bfree: 8_000,
      bavail: 4_000,
    };
    const result = normalizeVolumeStats(raw, "/mnt/nfs");
    expect(result.status).toBe("available");
    expect(result.availableBytes).toBe(4_000 * 512);
    expect(result.availableBytes).not.toBe(8_000 * 512);
  });

  it("uses frsize when bsize is missing", () => {
    const raw: StatFsLike = {
      frsize: 1024,
      blocks: 100,
      bavail: 50,
    };
    const result = normalizeVolumeStats(raw, "/vol");
    expect(result.status).toBe("available");
    expect(result.totalBytes).toBe(102_400);
    expect(result.availableBytes).toBe(51_200);
  });

  it("returns unavailable when total blocks are zero", () => {
    const result = normalizeVolumeStats(
      { bsize: 4096, blocks: 0, bavail: 0 },
      "/empty-vol",
    );
    expect(result.status).toBe("unavailable");
    expect(result.errorCode).toBe("INVALID_STATS");
    expect(result.totalBytes).toBe(0);
    expect(result.availableBytes).toBe(0);
  });

  it("returns unavailable when block size is zero", () => {
    const result = normalizeVolumeStats(
      { bsize: 0, blocks: 100, bavail: 50 },
      "/bad-block",
    );
    expect(result.status).toBe("unavailable");
    expect(result.errorCode).toBe("INVALID_STATS");
  });

  it("clamps available bytes to total when bavail exceeds blocks", () => {
    const raw: StatFsLike = {
      bsize: 1024,
      blocks: 100,
      bavail: 200,
    };
    const result = normalizeVolumeStats(raw, "/oversubscribed");
    expect(result.status).toBe("available");
    expect(result.availableBytes).toBe(result.totalBytes);
    expect(result.freePercent).toBe(100);
  });

  it("returns unsupported on unsupported platform", () => {
    const result = normalizeVolumeStats(null, "/win/c", false);
    expect(result).toMatchObject({
      status: "unsupported",
      errorCode: "UNSUPPORTED",
      sourcePath: "/win/c",
      totalBytes: 0,
      availableBytes: 0,
      freePercent: 0,
      deviceId: null,
    });
  });

  it("handles large counters within Number.MAX_SAFE_INTEGER", () => {
    const blockSize = 4096;
    const blocks = Math.floor(Number.MAX_SAFE_INTEGER / blockSize) - 1;
    const raw: StatFsLike = {
      bsize: blockSize,
      blocks,
      bavail: Math.floor(blocks / 2),
    };
    const result = normalizeVolumeStats(raw, "/large-vol");
    expect(result.status).toBe("available");
    expect(Number.isSafeInteger(result.totalBytes)).toBe(true);
    expect(Number.isSafeInteger(result.availableBytes)).toBe(true);
    expect(result.totalBytes).toBe(blocks * blockSize);
  });
});

describe("getVolumeStats [REQ-PANE_VOLUME_CAPACITY]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to statfs and normalizes a successful result", async () => {
    mockedStatfs.mockResolvedValue({
      bsize: 4096,
      blocks: 1000,
      bavail: 400,
      dev: 7,
    } as never);
    const result = await getVolumeStats("/home/user");
    expect(mockedStatfs).toHaveBeenCalledWith("/home/user");
    expect(result.status).toBe("available");
    expect(result.totalBytes).toBe(4_096_000);
    expect(result.availableBytes).toBe(1_638_400);
    expect(result.freePercent).toBe(40);
  });

  it("returns unavailable when statfs rejects", async () => {
    mockedStatfs.mockRejectedValue(new Error("EACCES: permission denied"));
    const result = await getVolumeStats("/root/secret");
    expect(result).toMatchObject({
      status: "unavailable",
      errorCode: "STAT_FAILED",
      sourcePath: "/root/secret",
      totalBytes: 0,
      availableBytes: 0,
    });
  });

  it("returns unsupported when statfs API is missing", async () => {
    mockedStatfs.mockImplementation(undefined as never);
    Object.defineProperty(fs, "statfs", {
      configurable: true,
      value: undefined,
    });
    const result = await getVolumeStats("/legacy");
    expect(result.status).toBe("unsupported");
    expect(result.errorCode).toBe("UNSUPPORTED");
    Object.defineProperty(fs, "statfs", {
      configurable: true,
      value: mockedStatfs,
    });
  });
});
