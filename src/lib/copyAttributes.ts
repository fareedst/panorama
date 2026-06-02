// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: Top-level Copy Preserve File Attributes: Shared preserveCopyAttributes() after copy completes (fs.copyFile or fs.cp); stat source then chmod + utimes on dest; each step try/catch so unsupported or denied ops do not fail the copy
// Preserve file attributes (mode, timestamps) after copy where possible.

import fs from "fs/promises";

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy apply utimes and chmod from source stat; ignore per-step failures
/**
 * Preserve source file attributes on destination where possible.
 * Does not throw: each step is best-effort so copy still succeeds if
 * chmod/utimes are unsupported or denied (e.g. cross-fs, permissions).
 *
 * @param sourcePath - Source file path (must exist and be a file)
 * @param destPath - Destination file path (must already exist after copy)
 */
export async function preserveCopyAttributes(
  sourcePath: string,
  destPath: string
): Promise<void> {
  try {
    const stat = await fs.stat(sourcePath);
    if (!stat.isFile()) return;

    // Preserve mode (permissions) where supported
    try {
      await fs.chmod(destPath, stat.mode);
    } catch {
      // Ignore: e.g. Windows, cross-filesystem, or permission denied
    }

    // Preserve atime/mtime where supported
    try {
      await fs.utimes(destPath, stat.atime, stat.mtime);
    } catch {
      // Ignore: e.g. read-only fs or permission denied
    }
  } catch {
    // Ignore stat failure; attribute preservation is best-effort
  }
}
