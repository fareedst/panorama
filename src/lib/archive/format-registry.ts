// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Archive format registry and detection

import path from "path";
import type { ArchiveFormatDetection, ArchiveFormatKey } from "./types";

interface RegistryEntry {
  formatKey: ArchiveFormatKey;
  extensions: string[];
  canList: boolean;
  canExtract: boolean;
}

const REGISTRY: RegistryEntry[] = [
  { formatKey: "tar.gz", extensions: [".tar.gz", ".tgz"], canList: true, canExtract: true },
  { formatKey: "tar.bz2", extensions: [".tar.bz2", ".tbz2"], canList: false, canExtract: false },
  { formatKey: "zip", extensions: [".zip"], canList: true, canExtract: true },
  { formatKey: "tar", extensions: [".tar"], canList: true, canExtract: true },
  { formatKey: "7z", extensions: [".7z"], canList: false, canExtract: false },
  { formatKey: "rar", extensions: [".rar"], canList: false, canExtract: false },
];

function extensionOf(filePath: string): string {
  const lower = filePath.toLowerCase();
  for (const entry of REGISTRY) {
    for (const ext of entry.extensions) {
      if (lower.endsWith(ext)) {
        return ext;
      }
    }
  }
  return path.extname(lower);
}

/** [DETECT_ARCHIVE_FORMAT] Resolve format from archive file path extension. */
export function detectArchiveFormat(archivePath: string): ArchiveFormatDetection {
  const lower = archivePath.toLowerCase();
  for (const entry of REGISTRY) {
    for (const ext of entry.extensions) {
      if (lower.endsWith(ext)) {
        if (!entry.canList) {
          return {
            formatKey: entry.formatKey,
            canList: false,
            canExtract: false,
            errorCode: "FORMAT_UNSUPPORTED",
          };
        }
        return {
          formatKey: entry.formatKey,
          canList: true,
          canExtract: true,
        };
      }
    }
  }

  const ext = extensionOf(archivePath);
  if (ext === ".zip") {
    return { formatKey: "zip", canList: true, canExtract: true };
  }

  return {
    formatKey: "zip",
    canList: false,
    canExtract: false,
    errorCode: "FORMAT_UNSUPPORTED",
  };
}

export function listRegistryFormatKeys(): ArchiveFormatKey[] {
  return REGISTRY.map((entry) => entry.formatKey);
}
