// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Archive domain error codes and manifest entry model

export type ArchiveFormatKey = "zip" | "tar" | "tar.gz" | "tar.bz2" | "7z" | "rar";

export type ArchiveErrorCode =
  | "INVALID_ARCHIVE_LOCATOR"
  | "FORMAT_UNSUPPORTED"
  | "MANIFEST_TOO_LARGE"
  | "ENTRY_TOO_LARGE"
  | "UNSAFE_ENTRY_PATH"
  | "ARCHIVE_NOT_FOUND"
  | "ARCHIVE_CORRUPT"
  | "UNSUPPORTED_ENTRY_TYPE"
  | "ENTRY_NOT_FOUND";

export class ArchiveError extends Error {
  constructor(
    public readonly code: ArchiveErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ArchiveError";
  }
}

export interface ArchiveManifestEntry {
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  mtime: Date;
}

export interface DecodedVirtualArchivePath {
  archivePath: string;
  entryPath: string;
}

export interface ArchiveFormatDetection {
  formatKey: ArchiveFormatKey;
  canList: boolean;
  canExtract: boolean;
  errorCode?: "FORMAT_UNSUPPORTED";
}

export interface ArchiveSourceMeta {
  archivePath: string;
  entryPath: string;
  isArchiveRoot: boolean;
  isVirtual: true;
  format: ArchiveFormatKey;
  readOnly: true;
}

export const ARCHIVE_LOCATOR_PREFIX = "@archive/v1/";

export const ARCHIVE_LIMITS = {
  maxManifestEntries: 50_000,
  maxSingleEntryUncompressedSize: 512 * 1024 * 1024,
  maxManifestReadBytes: 64 * 1024 * 1024,
  maxPathComponentLength: 255,
} as const;
