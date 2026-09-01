// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Project manifest entries to FileStat rows

import type { FileStat } from "../files.types";
import { readArchiveManifest } from "./manifest";
import { detectArchiveFormat } from "./format-registry";
import type { ArchiveManifestEntry, ArchiveSourceMeta } from "./types";
import { encodeVirtualArchivePath, normalizeArchiveEntryPath } from "./virtual-path";

function basenameOf(entryPath: string): string {
  const parts = entryPath.split("/");
  return parts[parts.length - 1] ?? entryPath;
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function directChildren(
  manifest: ArchiveManifestEntry[],
  directoryPath: string,
): ArchiveManifestEntry[] {
  const prefix = directoryPath ? `${directoryPath}/` : "";
  const childMap = new Map<string, ArchiveManifestEntry>();

  for (const entry of manifest) {
    if (directoryPath && entry.path === directoryPath) {
      continue;
    }
    if (!entry.path.startsWith(prefix) && directoryPath !== "") {
      continue;
    }
    const remainder = directoryPath ? entry.path.slice(prefix.length) : entry.path;
    if (!remainder || remainder.includes("/")) {
      const firstSegment = remainder.split("/")[0];
      if (!firstSegment) continue;
      const childPath = directoryPath ? `${directoryPath}/${firstSegment}` : firstSegment;
      if (!childMap.has(childPath)) {
        const isDir =
          entry.path !== childPath ||
          entry.isDirectory ||
          manifest.some(
            (other) => other.path.startsWith(`${childPath}/`) && other.path !== childPath,
          );
        childMap.set(childPath, {
          path: childPath,
          isDirectory: isDir,
          isSymlink: entry.path === childPath ? entry.isSymlink : false,
          size: entry.path === childPath ? entry.size : 0,
          mtime: entry.path === childPath ? entry.mtime : new Date(0),
        });
      }
      continue;
    }
    childMap.set(entry.path, entry);
  }

  return Array.from(childMap.values());
}

function toFileStat(
  archivePath: string,
  formatKey: ArchiveSourceMeta["format"],
  entry: ArchiveManifestEntry,
  directoryPath: string,
): FileStat {
  const archiveSource: ArchiveSourceMeta = {
    archivePath,
    entryPath: entry.path,
    isArchiveRoot: directoryPath === "",
    isVirtual: true,
    format: formatKey,
    readOnly: true,
  };

  return {
    name: basenameOf(entry.path),
    path: encodeVirtualArchivePath(archivePath, entry.path),
    isDirectory: entry.isDirectory,
    size: entry.size,
    mtime: entry.mtime,
    extension: entry.isDirectory ? "" : extensionOf(basenameOf(entry.path)),
    archiveSource,
  };
}

/** [PROJECT_ARCHIVE_DIRECTORY] List archive directory entries as FileStat rows. */
export async function projectArchiveDirectory(
  archivePath: string,
  entryPath = "",
): Promise<FileStat[]> {
  const directoryPath = normalizeArchiveEntryPath(entryPath);
  const format = detectArchiveFormat(archivePath);
  const manifest = await readArchiveManifest(archivePath);
  const children = directChildren(manifest, directoryPath);

  return children
    .map((entry) => toFileStat(archivePath, format.formatKey, entry, directoryPath))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export { directChildren };
