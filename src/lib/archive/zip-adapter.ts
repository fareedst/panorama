// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: ZIP manifest reader via yauzl

import fs from "fs";
import yauzl from "yauzl";
import { validateArchiveEntryPath } from "./entry-path";
import { ARCHIVE_LIMITS, ArchiveError, type ArchiveManifestEntry } from "./types";

function openZip(archivePath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(archivePath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new ArchiveError("ARCHIVE_CORRUPT"));
        return;
      }
      resolve(zipfile);
    });
  });
}

function readZipEntries(zipfile: yauzl.ZipFile): Promise<ArchiveManifestEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: ArchiveManifestEntry[] = [];
    const seen = new Set<string>();
    let duplicateLogged = false;

    zipfile.on("entry", (entry: yauzl.Entry) => {
      let rawPath = entry.fileName.replace(/\\/g, "/");
      if (rawPath.startsWith("/")) {
        rawPath = rawPath.slice(1);
      }

      if (!rawPath || rawPath.endsWith("/")) {
        const dirPath = rawPath.replace(/\/+$/, "");
        if (dirPath) {
          try {
            const path = validateArchiveEntryPath(dirPath);
            if (!seen.has(path)) {
              seen.add(path);
              entries.push({
                path,
                isDirectory: true,
                isSymlink: false,
                size: 0,
                mtime: entry.getLastModDate(),
              });
            } else if (!duplicateLogged) {
              console.warn("DEBUG: duplicate archive entry skipped:", path);
              duplicateLogged = true;
            }
          } catch {
            // skip unsafe
          }
        }
        zipfile.readEntry();
        return;
      }

      try {
        const path = validateArchiveEntryPath(rawPath);
        if (seen.has(path)) {
          if (!duplicateLogged) {
            console.warn("DEBUG: duplicate archive entry skipped:", path);
            duplicateLogged = true;
          }
          zipfile.readEntry();
          return;
        }

        if (entry.uncompressedSize > ARCHIVE_LIMITS.maxSingleEntryUncompressedSize) {
          reject(new ArchiveError("ENTRY_TOO_LARGE"));
          return;
        }

        seen.add(path);
        entries.push({
          path,
          isDirectory: false,
          isSymlink: false,
          size: entry.uncompressedSize,
          mtime: entry.getLastModDate(),
        });

        if (entries.length > ARCHIVE_LIMITS.maxManifestEntries) {
          reject(new ArchiveError("MANIFEST_TOO_LARGE"));
          return;
        }
      } catch (error) {
        if (error instanceof ArchiveError && error.code === "UNSAFE_ENTRY_PATH") {
          zipfile.readEntry();
          return;
        }
        reject(error);
        return;
      }

      zipfile.readEntry();
    });

    zipfile.on("end", () => resolve(entries));
    zipfile.on("error", reject);
    zipfile.readEntry();
  });
}

export async function readZipManifest(archivePath: string): Promise<ArchiveManifestEntry[]> {
  if (!fs.existsSync(archivePath)) {
    throw new ArchiveError("ARCHIVE_NOT_FOUND");
  }
  const zipfile = await openZip(archivePath);
  return readZipEntries(zipfile);
}

/** [EXTRACT_ARCHIVE_ENTRY] Stream one ZIP entry to destPath with byte limit. */
export async function extractZipEntry(
  archivePath: string,
  entryPath: string,
  destPath: string,
  maxBytes: number,
): Promise<{ size: number; mtime: Date }> {
  if (!fs.existsSync(archivePath)) {
    throw new ArchiveError("ARCHIVE_NOT_FOUND");
  }

  const zipfile = await openZip(archivePath);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    zipfile.on("entry", (entry: yauzl.Entry) => {
      let rawPath = entry.fileName.replace(/\\/g, "/");
      if (rawPath.startsWith("/")) rawPath = rawPath.slice(1);
      const isDirectory = rawPath.endsWith("/");
      if (isDirectory) rawPath = rawPath.replace(/\/+$/, "");

      try {
        const path = validateArchiveEntryPath(rawPath);
        if (path !== entryPath) {
          zipfile.readEntry();
          return;
        }

        if (isDirectory) {
          finish(() => reject(new ArchiveError("UNSUPPORTED_ENTRY_TYPE")));
          return;
        }

        if (entry.uncompressedSize > maxBytes) {
          finish(() => reject(new ArchiveError("ENTRY_TOO_LARGE")));
          return;
        }

        zipfile.openReadStream(entry, (err, readStream) => {
          if (err || !readStream) {
            finish(() => reject(err ?? new ArchiveError("ARCHIVE_CORRUPT")));
            return;
          }

          const writeStream = fs.createWriteStream(destPath);
          let bytes = 0;

          readStream.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > maxBytes) {
              readStream.destroy();
              writeStream.destroy();
              fs.rm(destPath, { force: true }, () => {
                finish(() => reject(new ArchiveError("ENTRY_TOO_LARGE")));
              });
            }
          });

          readStream.on("error", (error) => finish(() => reject(error)));
          writeStream.on("error", (error) => finish(() => reject(error)));
          writeStream.on("finish", () => {
            finish(() => resolve({ size: bytes, mtime: entry.getLastModDate() }));
          });

          readStream.pipe(writeStream);
        });
      } catch (error) {
        finish(() => reject(error));
      }
    });

    zipfile.on("end", () => finish(() => reject(new ArchiveError("ENTRY_NOT_FOUND"))));
    zipfile.on("error", (error) => finish(() => reject(error)));
    zipfile.readEntry();
  });
}
