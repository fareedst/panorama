// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-ARCHIVE_DIRECTORY_PANES]: Client-safe virtual archive locator codec — no server parser imports

export const ARCHIVE_LOCATOR_PREFIX = "@archive/v1/";

export class ArchivePathClientError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ArchivePathClientError";
  }
}

interface LocatorPayload {
  a: string;
  e: string;
}

export interface DecodedVirtualArchivePath {
  archivePath: string;
  entryPath: string;
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

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLen));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function assertSafeArchivePath(archivePath: string): void {
  if (!archivePath || archivePath.includes("..")) {
    throw new ArchivePathClientError("INVALID_ARCHIVE_LOCATOR");
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
    throw new ArchivePathClientError("INVALID_ARCHIVE_LOCATOR");
  }

  let payload: LocatorPayload;
  try {
    payload = JSON.parse(
      base64UrlDecode(virtualLocator.slice(ARCHIVE_LOCATOR_PREFIX.length)),
    ) as LocatorPayload;
  } catch {
    throw new ArchivePathClientError("INVALID_ARCHIVE_LOCATOR");
  }

  if (typeof payload.a !== "string" || payload.a.includes("..")) {
    throw new ArchivePathClientError("INVALID_ARCHIVE_LOCATOR");
  }

  return {
    archivePath: payload.a,
    entryPath: normalizeArchiveEntryPath(
      typeof payload.e === "string" ? payload.e : "",
    ),
  };
}

export function isVirtualArchivePath(pathValue: string): boolean {
  return pathValue.startsWith(ARCHIVE_LOCATOR_PREFIX);
}

const HOST_ARCHIVE_SUFFIXES = [".tar.gz", ".tgz", ".zip", ".tar"] as const;

/** Detect host filesystem archive files openable as archive-backed panes (v1). */
export function isHostArchiveFilePath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return HOST_ARCHIVE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

/** [OPEN_ARCHIVE_IN_PANE] Whether activating this row should open an archive-backed pane. */
export function isOpenableHostArchiveFile(file: {
  path: string;
  isDirectory: boolean;
}): boolean {
  if (file.isDirectory || isVirtualArchivePath(file.path)) {
    return false;
  }
  return isHostArchiveFilePath(file.path);
}
