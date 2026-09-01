// [IMPL-FILES_API] [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-FILE_LISTING] [REQ-ARCHIVE_DIRECTORY_PANES]: Shared server listing for ordinary paths and virtual archive locators

import type { FileStat } from "./files.types";
import { listDirectory } from "./files.data";
import {
  ArchiveError,
  type ArchiveErrorCode,
  decodeVirtualArchivePath,
  isVirtualArchivePath,
  projectArchiveDirectory,
} from "./archive";

/** [GET_LIST_DIRECTORY_ARCHIVE_BRANCH] List ordinary directory or project archive virtual locator. */
export async function listDirectoryForRequestPath(requestPath: string): Promise<FileStat[]> {
  if (isVirtualArchivePath(requestPath)) {
    const decoded = decodeVirtualArchivePath(requestPath);
    return projectArchiveDirectory(decoded.archivePath, decoded.entryPath);
  }
  return listDirectory(requestPath);
}

/** Host path for volume stats — archive file path when request is a virtual locator. */
export function volumeStatsSourcePath(requestPath: string): string {
  if (isVirtualArchivePath(requestPath)) {
    return decodeVirtualArchivePath(requestPath).archivePath;
  }
  return requestPath;
}

/** Map archive domain errors to HTTP status for GET /api/files. */
export function archiveErrorHttpStatus(code: ArchiveErrorCode): number {
  switch (code) {
    case "INVALID_ARCHIVE_LOCATOR":
    case "FORMAT_UNSUPPORTED":
    case "MANIFEST_TOO_LARGE":
    case "ENTRY_TOO_LARGE":
    case "UNSAFE_ENTRY_PATH":
    case "ARCHIVE_CORRUPT":
    case "UNSUPPORTED_ENTRY_TYPE":
      return 400;
    case "ARCHIVE_NOT_FOUND":
    case "ENTRY_NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

export function isArchiveError(error: unknown): error is ArchiveError {
  return error instanceof ArchiveError;
}

/** Stable API error when mutating operations target virtual archive locators [POST_EXTRACT_ARCHIVE_ENTRY]. */
export const VIRTUAL_PATH_MUTATION_REJECTED = "VIRTUAL_PATH_MUTATION_REJECTED" as const;

export type VirtualMutationRejectBody = {
  error: string;
  errorCode: typeof VIRTUAL_PATH_MUTATION_REJECTED;
};

/** Return rejection body when any path is a virtual archive locator. */
export function virtualMutationRejectIfPresent(
  paths: (string | undefined)[],
): VirtualMutationRejectBody | null {
  for (const candidate of paths) {
    if (candidate && isVirtualArchivePath(candidate)) {
      return {
        error: "Virtual archive paths cannot be mutated",
        errorCode: VIRTUAL_PATH_MUTATION_REJECTED,
      };
    }
  }
  return null;
}
