// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-COPY_OPERATIONS] [REQ-ARCHIVE_DIRECTORY_PANES]: Bounded single-file archive extraction

import fs from "fs/promises";
import path from "path";
import { detectArchiveFormat } from "./format-registry";
import { validateArchiveEntryPath } from "./entry-path";
import { readArchiveManifest } from "./manifest";
import { extractTarEntry, extractTarGzEntry } from "./tar-adapter";
import { ARCHIVE_LIMITS, ArchiveError } from "./types";
import { extractZipEntry } from "./zip-adapter";

async function applyEntryAttributes(
  destPath: string,
  mtime: Date,
): Promise<void> {
  try {
    await fs.utimes(destPath, mtime, mtime);
  } catch {
    // best-effort attribute preservation
  }
}

async function cleanupExtractFailure(tempPath: string, destPath: string): Promise<void> {
  await fs.rm(tempPath, { force: true }).catch(() => undefined);
  await fs.rm(destPath, { force: true }).catch(() => undefined);
}

/** [EXTRACT_ARCHIVE_ENTRY] Extract one file entry to an ordinary destination; archive file stays immutable. */
export async function extractArchiveEntry(
  archivePath: string,
  entryPath: string,
  destPath: string,
): Promise<{ success: true }> {
  const normalizedEntry = validateArchiveEntryPath(entryPath);
  if (!normalizedEntry) {
    throw new ArchiveError("UNSUPPORTED_ENTRY_TYPE");
  }

  const format = detectArchiveFormat(archivePath);
  if (!format.canExtract || format.errorCode === "FORMAT_UNSUPPORTED") {
    throw new ArchiveError("FORMAT_UNSUPPORTED");
  }

  const manifest = await readArchiveManifest(archivePath);
  const entry = manifest.find((item) => item.path === normalizedEntry);
  if (!entry) {
    throw new ArchiveError("ENTRY_NOT_FOUND");
  }
  if (entry.isDirectory) {
    throw new ArchiveError("UNSUPPORTED_ENTRY_TYPE");
  }
  if (entry.isSymlink) {
    throw new ArchiveError("UNSUPPORTED_ENTRY_TYPE");
  }

  const archiveStatBefore = await fs.stat(archivePath);
  const tempPath = `${destPath}.extract-tmp`;
  const maxBytes = ARCHIVE_LIMITS.maxSingleEntryUncompressedSize;

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.rm(tempPath, { force: true }).catch(() => undefined);

  try {
    let extracted: { size: number; mtime: Date };
    switch (format.formatKey) {
      case "zip":
        extracted = await extractZipEntry(archivePath, normalizedEntry, tempPath, maxBytes);
        break;
      case "tar":
        extracted = await extractTarEntry(archivePath, normalizedEntry, tempPath, maxBytes);
        break;
      case "tar.gz":
        extracted = await extractTarGzEntry(archivePath, normalizedEntry, tempPath, maxBytes);
        break;
      default:
        throw new ArchiveError("FORMAT_UNSUPPORTED");
    }

    await applyEntryAttributes(tempPath, extracted.mtime);
    await fs.rm(destPath, { force: true }).catch(() => undefined);
    await fs.rename(tempPath, destPath);

    const archiveStatAfter = await fs.stat(archivePath);
    if (
      archiveStatAfter.size !== archiveStatBefore.size ||
      archiveStatAfter.mtimeMs !== archiveStatBefore.mtimeMs
    ) {
      throw new ArchiveError("ARCHIVE_CORRUPT", "Archive file changed during extract");
    }

    return { success: true };
  } catch (error) {
    await cleanupExtractFailure(tempPath, destPath);
    throw error;
  }
}
