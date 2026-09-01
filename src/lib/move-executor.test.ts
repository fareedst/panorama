// [IMPL-MOVE_EXECUTOR] [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA] [REQ-FILE_OPERATIONS] [REQ-NSYNC_HYBRID_MOVE]: unit tests for shared EXDEV rename fallback

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    rename: vi.fn(),
  },
}));

import fs from "fs/promises";
import { isExdevError, renameOrMove } from "./move-executor";

describe("move-executor [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA]", () => {
  const mockedFs = fs as unknown as {
    mkdir: ReturnType<typeof vi.fn>;
    rename: ReturnType<typeof vi.fn>;
  };

  const copyFile = vi.fn().mockResolvedValue(undefined);
  const deleteFile = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFs.mkdir.mockResolvedValue(undefined);
  });

  it("isExdevError detects EXDEV errno", () => {
    const exdev = Object.assign(new Error("EXDEV"), { code: "EXDEV" });
    expect(isExdevError(exdev)).toBe(true);
    expect(isExdevError(new Error("EACCES"))).toBe(false);
  });

  // [IMPL-MOVE_EXECUTOR] [REQ-NSYNC_HYBRID_MOVE]: rename succeeds on same volume
  it("renameOrMove uses fs.rename on success", async () => {
    mockedFs.rename.mockResolvedValue(undefined);

    await renameOrMove("/src/file.txt", "/dest/file.txt", { copyFile, deleteFile });

    expect(mockedFs.mkdir).toHaveBeenCalledWith("/dest", { recursive: true });
    expect(mockedFs.rename).toHaveBeenCalledWith("/src/file.txt", "/dest/file.txt");
    expect(copyFile).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  // [IMPL-MOVE_EXECUTOR] [REQ-FILE_OPERATIONS] [REQ-NSYNC_HYBRID_MOVE]: EXDEV triggers copy+delete fallback
  it("renameOrMove falls back to copy+delete on EXDEV", async () => {
    const exdev = Object.assign(new Error("EXDEV: cross-device link not permitted"), {
      code: "EXDEV",
    });
    mockedFs.rename.mockRejectedValue(exdev);

    await renameOrMove("/src/file.txt", "/dest/file.txt", { copyFile, deleteFile });

    expect(mockedFs.rename).toHaveBeenCalledWith("/src/file.txt", "/dest/file.txt");
    expect(copyFile).toHaveBeenCalledWith("/src/file.txt", "/dest/file.txt");
    expect(deleteFile).toHaveBeenCalledWith("/src/file.txt");
  });

  // [IMPL-MOVE_EXECUTOR] [REQ-FILE_OPERATIONS]: non-EXDEV errors propagate without fallback
  it("renameOrMove rethrows non-EXDEV rename errors", async () => {
    mockedFs.rename.mockRejectedValue(Object.assign(new Error("EACCES"), { code: "EACCES" }));

    await expect(
      renameOrMove("/src/file.txt", "/dest/file.txt", { copyFile, deleteFile })
    ).rejects.toMatchObject({ code: "EACCES" });

    expect(copyFile).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });
});
