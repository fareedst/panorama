// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Entry path safety validation

import { ARCHIVE_LIMITS, ArchiveError } from "./types";
import { normalizeArchiveEntryPath } from "./virtual-path";

const UNSAFE_SEGMENT = /[\0]/;
const ABSOLUTE_PATH = /^([a-zA-Z]:[\\/]|\\\\|\/)/;
const TRAVERSAL = /^(\.\.|\.)(\/|$)/;

/** Reject traversal, absolute paths, drive prefixes, and NUL in entry names. */
export function validateArchiveEntryPath(entryPath: string): string {
  const normalized = normalizeArchiveEntryPath(entryPath);
  if (!normalized) {
    return "";
  }

  if (ABSOLUTE_PATH.test(entryPath) || entryPath.includes("..")) {
    throw new ArchiveError("UNSAFE_ENTRY_PATH");
  }

  for (const segment of normalized.split("/")) {
    if (!segment || segment === "." || segment === "..") {
      throw new ArchiveError("UNSAFE_ENTRY_PATH");
    }
    if (segment.length > ARCHIVE_LIMITS.maxPathComponentLength) {
      throw new ArchiveError("UNSAFE_ENTRY_PATH");
    }
    if (UNSAFE_SEGMENT.test(segment)) {
      throw new ArchiveError("UNSAFE_ENTRY_PATH");
    }
    if (TRAVERSAL.test(segment)) {
      throw new ArchiveError("UNSAFE_ENTRY_PATH");
    }
  }

  return normalized;
}

export function isSafeArchiveEntryPath(entryPath: string): boolean {
  try {
    validateArchiveEntryPath(entryPath);
    return true;
  } catch {
    return false;
  }
}
