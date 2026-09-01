// [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-PANE_VOLUME_CAPACITY]: Server-only volume statistics provider — statfs normalization for per-pane capacity display

import fs from "fs/promises";
import type {
  VolumeStats,
  VolumeStatsErrorCode,
} from "./files.types";

export type { VolumeStats, VolumeStatsErrorCode, VolumeStatsStatus } from "./files.types";

/** Raw statfs fields used for normalization (platform shapes vary). */
export interface StatFsLike {
  bsize?: number;
  frsize?: number;
  blocks?: number;
  bavail?: number;
  bfree?: number;
  dev?: number | string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function unavailableStats(
  sourcePath: string,
  errorCode: VolumeStatsErrorCode,
  deviceId: number | string | null = null,
): VolumeStats {
  return {
    totalBytes: 0,
    availableBytes: 0,
    freePercent: 0,
    deviceId,
    sourcePath,
    status: "unavailable",
    errorCode,
  };
}

// [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY]: how — raw statfs blocks → byte totals via bavail; clamp freePercent; explicit status
/** [NORMALIZE_VOLUME_STATS] Normalize raw statfs into the VolumeStats contract. */
export function normalizeVolumeStats(
  raw: StatFsLike | null | undefined,
  sourcePath: string,
  platformSupported = true,
): VolumeStats {
  if (!platformSupported || raw == null) {
    return {
      totalBytes: 0,
      availableBytes: 0,
      freePercent: 0,
      deviceId: null,
      sourcePath,
      status: "unsupported",
      errorCode: "UNSUPPORTED",
    };
  }

  const blockSize = raw.bsize ?? raw.frsize ?? 0;
  const blocks = raw.blocks ?? 0;
  const bavail = raw.bavail ?? raw.bfree ?? 0;
  const deviceId = raw.dev ?? null;

  if (blockSize <= 0 || blocks <= 0) {
    return unavailableStats(sourcePath, "INVALID_STATS", deviceId);
  }

  const totalBytes = blocks * blockSize;
  let availableBytes = bavail * blockSize;
  if (availableBytes > totalBytes) {
    availableBytes = totalBytes;
  }

  const freePercent =
    totalBytes > 0 ? clamp((availableBytes / totalBytes) * 100, 0, 100) : 0;

  return {
    totalBytes,
    availableBytes,
    freePercent,
    deviceId,
    sourcePath,
    status: "available",
  };
}

// [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-PANE_VOLUME_CAPACITY]: how — server path → statfs when available → normalizeVolumeStats; failures isolated
/** [GET_VOLUME_STATS] Read filesystem volume statistics for the volume containing sourcePath. */
export async function getVolumeStats(sourcePath: string): Promise<VolumeStats> {
  try {
    if (typeof fs.statfs !== "function") {
      console.error(
        "DIAGNOSTIC: [IMPL-PANE_VOLUME_CAPACITY] statfs unavailable on this platform",
      );
      return normalizeVolumeStats(null, sourcePath, false);
    }
    const raw = (await fs.statfs(sourcePath)) as StatFsLike;
    return normalizeVolumeStats(raw, sourcePath, true);
  } catch (error) {
    console.error(
      "DIAGNOSTIC: [IMPL-PANE_VOLUME_CAPACITY] getVolumeStats failed for",
      sourcePath,
      String(error),
    );
    return unavailableStats(sourcePath, "STAT_FAILED");
  }
}
