// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: TAR/TAR.GZ manifest reader via tar-stream

import fs from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { validateArchiveEntryPath } from "./entry-path";
import { ARCHIVE_LIMITS, ArchiveError, type ArchiveManifestEntry } from "./types";

async function collectTarEntries(
  archivePath: string,
  gzip: boolean,
): Promise<ArchiveManifestEntry[]> {
  if (!fs.existsSync(archivePath)) {
    throw new ArchiveError("ARCHIVE_NOT_FOUND");
  }

  const entries: ArchiveManifestEntry[] = [];
  const seen = new Set<string>();
  let duplicateLogged = false;
  let readBytes = 0;

  const extract = tar.extract();

  extract.on("entry", (header, stream, next) => {
    readBytes += header.size ?? 0;
    if (readBytes > ARCHIVE_LIMITS.maxManifestReadBytes) {
      stream.resume();
      extract.destroy(new ArchiveError("MANIFEST_TOO_LARGE"));
      return;
    }

    let rawPath = header.name.replace(/\\/g, "/").replace(/^\/+/, "");
    const isSymlink = header.type === "symlink" || header.type === "link";

    if (header.type === "directory" || rawPath.endsWith("/")) {
      rawPath = rawPath.replace(/\/+$/, "");
    }

    stream.on("end", () => {
      if (!rawPath) {
        next();
        return;
      }

      try {
        const path = validateArchiveEntryPath(rawPath);
        if (seen.has(path)) {
          if (!duplicateLogged) {
            console.warn("DEBUG: duplicate archive entry skipped:", path);
            duplicateLogged = true;
          }
          next();
          return;
        }

        if ((header.size ?? 0) > ARCHIVE_LIMITS.maxSingleEntryUncompressedSize) {
          extract.destroy(new ArchiveError("ENTRY_TOO_LARGE"));
          return;
        }

        seen.add(path);
        entries.push({
          path,
          isDirectory: header.type === "directory" || rawPath.endsWith("/"),
          isSymlink,
          size: header.size ?? 0,
          mtime: header.mtime ?? new Date(0),
        });

        if (entries.length > ARCHIVE_LIMITS.maxManifestEntries) {
          extract.destroy(new ArchiveError("MANIFEST_TOO_LARGE"));
          return;
        }
      } catch (error) {
        if (error instanceof ArchiveError && error.code === "UNSAFE_ENTRY_PATH") {
          next();
          return;
        }
        extract.destroy(error as Error);
        return;
      }

      next();
    });

    stream.resume();
  });

  const source = fs.createReadStream(archivePath);
  if (gzip) {
    await pipeline(source, createGunzip(), extract);
  } else {
    await pipeline(source, extract);
  }

  return entries;
}

export function readTarManifest(archivePath: string): Promise<ArchiveManifestEntry[]> {
  return collectTarEntries(archivePath, false);
}

export function readTarGzManifest(archivePath: string): Promise<ArchiveManifestEntry[]> {
  return collectTarEntries(archivePath, true);
}

async function extractTarEntryStream(
  archivePath: string,
  entryPath: string,
  destPath: string,
  gzip: boolean,
  maxBytes: number,
): Promise<{ size: number; mtime: Date }> {
  if (!fs.existsSync(archivePath)) {
    throw new ArchiveError("ARCHIVE_NOT_FOUND");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const extract = tar.extract();

    extract.on("entry", (header, stream, next) => {
      let rawPath = header.name.replace(/\\/g, "/").replace(/^\/+/, "");
      if (header.type === "directory" || rawPath.endsWith("/")) {
        rawPath = rawPath.replace(/\/+$/, "");
      }

      try {
        const path = validateArchiveEntryPath(rawPath);
        if (path !== entryPath) {
          stream.resume();
          next();
          return;
        }

        if (header.type === "symlink" || header.type === "link") {
          stream.resume();
          finish(() => reject(new ArchiveError("UNSUPPORTED_ENTRY_TYPE")));
          next();
          return;
        }

        if (header.type === "directory") {
          stream.resume();
          finish(() => reject(new ArchiveError("UNSUPPORTED_ENTRY_TYPE")));
          next();
          return;
        }

        if ((header.size ?? 0) > maxBytes) {
          stream.resume();
          finish(() => reject(new ArchiveError("ENTRY_TOO_LARGE")));
          next();
          return;
        }

        const writeStream = fs.createWriteStream(destPath);
        let bytes = 0;

        stream.on("data", (chunk: unknown) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
          bytes += buffer.length;
          if (bytes > maxBytes) {
            stream.destroy();
            writeStream.destroy();
            fs.rm(destPath, { force: true }, () => {
              finish(() => reject(new ArchiveError("ENTRY_TOO_LARGE")));
            });
          }
        });

        stream.on("error", (error) => finish(() => reject(error)));
        writeStream.on("error", (error) => finish(() => reject(error)));
        stream.on("end", () => {
          writeStream.end();
        });
        writeStream.on("finish", () => {
          finish(() =>
            resolve({
              size: bytes,
              mtime: header.mtime ?? new Date(0),
            }),
          );
          next();
        });

        stream.pipe(writeStream);
      } catch (error) {
        stream.resume();
        finish(() => reject(error));
        next();
      }
    });

    extract.on("error", (error) => finish(() => reject(error)));
    extract.on("finish", () => {
      finish(() => reject(new ArchiveError("ENTRY_NOT_FOUND")));
    });

    const source = fs.createReadStream(archivePath);
    const onPipelineError = (error: Error) => finish(() => reject(error));
    if (gzip) {
      void pipeline(source, createGunzip(), extract).catch(onPipelineError);
    } else {
      void pipeline(source, extract).catch(onPipelineError);
    }
  });
}

/** [EXTRACT_ARCHIVE_ENTRY] Stream one TAR entry to destPath with byte limit. */
export function extractTarEntry(
  archivePath: string,
  entryPath: string,
  destPath: string,
  maxBytes: number,
): Promise<{ size: number; mtime: Date }> {
  return extractTarEntryStream(archivePath, entryPath, destPath, false, maxBytes);
}

/** [EXTRACT_ARCHIVE_ENTRY] Stream one TAR.GZ entry to destPath with byte limit. */
export function extractTarGzEntry(
  archivePath: string,
  entryPath: string,
  destPath: string,
  maxBytes: number,
): Promise<{ size: number; mtime: Date }> {
  return extractTarEntryStream(archivePath, entryPath, destPath, true, maxBytes);
}
