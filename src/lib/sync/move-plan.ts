// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: Pure move plan builder — volume affinity classification and ordered copy/rename legs

import fs from "fs/promises";
import path from "path";

export type VolumeClass = "same-volume" | "cross-volume" | "unknown";

export type MoveLegOp = "copy" | "rename";

export interface MoveLeg {
  op: MoveLegOp;
  from: string;
  to: string;
  volumeClass: VolumeClass;
}

export interface MovePlan {
  legs: MoveLeg[];
  omitDeferredDelete: boolean;
  renameTarget: string | null;
}

export type GetDevFn = (filePath: string) => Promise<number | undefined>;

interface ClassifiedDest {
  destPath: string;
  effectiveClass: "same-volume" | "cross-volume";
}

const defaultGetDev: GetDevFn = async (filePath: string) => {
  try {
    const stat = await fs.stat(filePath);
    return stat.dev;
  } catch {
    return undefined;
  }
};

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: how: compare getDev(source) with getDev(dirname(destPath)); undefined dev yields unknown
export async function classifyVolumeAffinity(
  source: string,
  destPath: string,
  getDev: GetDevFn = defaultGetDev
): Promise<VolumeClass> {
  const sourceDev = await getDev(source);
  const destDev = await getDev(path.dirname(destPath));

  if (sourceDev === undefined || destDev === undefined) {
    return "unknown";
  }
  if (sourceDev === destDev) {
    return "same-volume";
  }
  return "cross-volume";
}

function pickRenameTarget(sameVolumePaths: string[]): string | null {
  if (sameVolumePaths.length === 0) {
    return null;
  }
  return [...sameVolumePaths].sort((a, b) => a.localeCompare(b))[0] ?? null;
}

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: how: cross-volume copies first, same-volume copies, single rename to lex-smallest same-volume dest last
export async function buildMovePlan(
  source: string,
  destPaths: string[],
  getDev: GetDevFn = defaultGetDev
): Promise<MovePlan> {
  if (destPaths.length === 0) {
    return { legs: [], omitDeferredDelete: false, renameTarget: null };
  }

  const classified: ClassifiedDest[] = [];
  for (const destPath of destPaths) {
    const volumeClass = await classifyVolumeAffinity(source, destPath, getDev);
    const effectiveClass: "same-volume" | "cross-volume" =
      volumeClass === "same-volume" ? "same-volume" : "cross-volume";
    classified.push({ destPath, effectiveClass });
  }

  const crossVolume = classified
    .filter((c) => c.effectiveClass === "cross-volume")
    .map((c) => c.destPath);
  const sameVolume = classified
    .filter((c) => c.effectiveClass === "same-volume")
    .map((c) => c.destPath);

  const renameTarget = pickRenameTarget(sameVolume);
  const sameVolumeCopies = sameVolume
    .filter((p) => p !== renameTarget)
    .sort((a, b) => a.localeCompare(b));

  const legs: MoveLeg[] = [];

  for (const to of crossVolume) {
    legs.push({ op: "copy", from: source, to, volumeClass: "cross-volume" });
  }
  for (const to of sameVolumeCopies) {
    legs.push({ op: "copy", from: source, to, volumeClass: "same-volume" });
  }
  if (renameTarget !== null) {
    legs.push({
      op: "rename",
      from: source,
      to: renameTarget,
      volumeClass: "same-volume",
    });
  }

  const lastLeg = legs[legs.length - 1];
  const omitDeferredDelete = lastLeg?.op === "rename";

  return { legs, omitDeferredDelete, renameTarget };
}

// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: how: extract initial contiguous cross-volume copy prefix for parallel batch execution
export function partitionMovePlanLegs(plan: MovePlan): {
  parallelBatch: MoveLeg[];
  sequentialTail: MoveLeg[];
} {
  const parallelBatch: MoveLeg[] = [];
  let index = 0;
  while (
    index < plan.legs.length &&
    plan.legs[index]!.op === "copy" &&
    plan.legs[index]!.volumeClass === "cross-volume"
  ) {
    parallelBatch.push(plan.legs[index]!);
    index++;
  }
  return {
    parallelBatch,
    sequentialTail: plan.legs.slice(index),
  };
}
