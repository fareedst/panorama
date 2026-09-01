// [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Manifest read orchestration

import { detectArchiveFormat } from "./format-registry";
import { readTarGzManifest, readTarManifest } from "./tar-adapter";
import { ArchiveError, type ArchiveManifestEntry } from "./types";
import { readZipManifest } from "./zip-adapter";

/** [READ_ARCHIVE_MANIFEST] Read normalized manifest entries for a supported archive file. */
export async function readArchiveManifest(
  archivePath: string,
): Promise<ArchiveManifestEntry[]> {
  const format = detectArchiveFormat(archivePath);
  if (!format.canList || format.errorCode === "FORMAT_UNSUPPORTED") {
    throw new ArchiveError("FORMAT_UNSUPPORTED");
  }

  switch (format.formatKey) {
    case "zip":
      return readZipManifest(archivePath);
    case "tar":
      return readTarManifest(archivePath);
    case "tar.gz":
      return readTarGzManifest(archivePath);
    default:
      throw new ArchiveError("FORMAT_UNSUPPORTED");
  }
}
