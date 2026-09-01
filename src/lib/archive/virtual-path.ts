// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Virtual archive locator encode/decode

import {
  ARCHIVE_LOCATOR_PREFIX,
  ArchiveError,
  type DecodedVirtualArchivePath,
} from "./types";

interface LocatorPayload {
  a: string;
  e: string;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");
}

/** [NORMALIZE_ARCHIVE_ENTRY_PATH] Normalize archive entry paths to forward-slash relative form. */
export function normalizeArchiveEntryPath(entryPath: string): string {
  if (!entryPath) {
    return "";
  }
  return entryPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/");
}

function assertSafeArchivePath(archivePath: string): void {
  if (!archivePath || archivePath.includes("..")) {
    throw new ArchiveError("INVALID_ARCHIVE_LOCATOR");
  }
}

/** [ENCODE_VIRTUAL_ARCHIVE_PATH] Build @archive/v1/ locator from host path and entry path. */
export function encodeVirtualArchivePath(
  archivePath: string,
  entryPath = "",
): string {
  assertSafeArchivePath(archivePath);
  const payload: LocatorPayload = {
    a: archivePath,
    e: normalizeArchiveEntryPath(entryPath),
  };
  return `${ARCHIVE_LOCATOR_PREFIX}${base64UrlEncode(JSON.stringify(payload))}`;
}

/** [DECODE_VIRTUAL_ARCHIVE_PATH] Parse virtual locator into archive host path and entry path. */
export function decodeVirtualArchivePath(
  virtualLocator: string,
): DecodedVirtualArchivePath {
  if (!virtualLocator.startsWith(ARCHIVE_LOCATOR_PREFIX)) {
    throw new ArchiveError("INVALID_ARCHIVE_LOCATOR");
  }

  let payload: LocatorPayload;
  try {
    payload = JSON.parse(
      base64UrlDecode(virtualLocator.slice(ARCHIVE_LOCATOR_PREFIX.length)),
    ) as LocatorPayload;
  } catch {
    throw new ArchiveError("INVALID_ARCHIVE_LOCATOR");
  }

  if (typeof payload.a !== "string" || payload.a.includes("..")) {
    throw new ArchiveError("INVALID_ARCHIVE_LOCATOR");
  }

  const entryPath = normalizeArchiveEntryPath(
    typeof payload.e === "string" ? payload.e : "",
  );

  return {
    archivePath: payload.a,
    entryPath,
  };
}

export function isVirtualArchivePath(path: string): boolean {
  return path.startsWith(ARCHIVE_LOCATOR_PREFIX);
}
