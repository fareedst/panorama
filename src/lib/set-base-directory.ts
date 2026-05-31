// [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]
// Pure helpers for Set as Base directory dialog target resolution

import { neighborIndexNext, neighborIndexPrev } from "@/lib/pane-order";

export type SetBaseDirectoryTarget =
  | "thisPane"
  | "allPanes"
  | "otherPanes"
  | "nextPane"
  | "nextPaneSwap"
  | "priorPane"
  | "priorPaneSwap"
  | "newPane"
  | "newWorkspace";

/** Whether a target requires at least two panes to be actionable. */
export function isSetBaseDirectoryTargetMultiPaneOnly(
  target: SetBaseDirectoryTarget,
): boolean {
  return (
    target === "otherPanes" ||
    target === "nextPane" ||
    target === "nextPaneSwap" ||
    target === "priorPane" ||
    target === "priorPaneSwap"
  );
}

/** Whether a target is a swap variant (requires allowPaneManagement). */
export function isSetBaseDirectorySwapTarget(
  target: SetBaseDirectoryTarget,
): boolean {
  return target === "nextPaneSwap" || target === "priorPaneSwap";
}

/** Whether a target requires allowPaneManagement (swap variants and in-workspace new pane). */
// isSetBaseDirectoryTargetRequiresPaneManagement — [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — pure helper; swap targets and newPane require pane management
export function isSetBaseDirectoryTargetRequiresPaneManagement(
  target: SetBaseDirectoryTarget,
): boolean {
  return isSetBaseDirectorySwapTarget(target) || target === "newPane";
}

// SetBaseDirectoryApply target resolution — [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — maps dialog target to pane index list for handleNavigate loop; newPane and newWorkspace return empty list

/** Pane indices that should receive handleNavigate for the given target. */
export function resolveSetBaseDirectoryPaneTargets(
  target: SetBaseDirectoryTarget,
  initiatingPaneIndex: number,
  paneCount: number,
): number[] {
  if (target === "newWorkspace" || target === "newPane" || paneCount < 1) {
    return [];
  }

  switch (target) {
    case "thisPane":
      return [initiatingPaneIndex];
    case "allPanes":
      return Array.from({ length: paneCount }, (_, i) => i);
    case "otherPanes":
      if (paneCount < 2) return [];
      return Array.from({ length: paneCount }, (_, i) => i).filter(
        (i) => i !== initiatingPaneIndex,
      );
    case "nextPane":
    case "nextPaneSwap":
      if (paneCount < 2) return [];
      return [neighborIndexNext(initiatingPaneIndex, paneCount)];
    case "priorPane":
    case "priorPaneSwap":
      if (paneCount < 2) return [];
      return [neighborIndexPrev(initiatingPaneIndex, paneCount)];
    default:
      return [];
  }
}

/** After navigation, swap initiating pane with neighbor when target is a swap variant. */
export function resolveSetBaseDirectorySwapPair(
  target: SetBaseDirectoryTarget,
  initiatingPaneIndex: number,
  paneCount: number,
): [number, number] | null {
  if (paneCount < 2) return null;

  if (target === "nextPaneSwap") {
    const neighbor = neighborIndexNext(initiatingPaneIndex, paneCount);
    return [initiatingPaneIndex, neighbor];
  }
  if (target === "priorPaneSwap") {
    const neighbor = neighborIndexPrev(initiatingPaneIndex, paneCount);
    return [initiatingPaneIndex, neighbor];
  }
  return null;
}

/** Whether linked-mode propagation should apply for this target (In this pane only). */
export function allowsLinkedPropagationForSetBaseTarget(
  target: SetBaseDirectoryTarget,
): boolean {
  return target === "thisPane";
}

/** Build URL for new single-pane workspace in a new browser tab. */
export function buildSinglePaneWorkspaceUrl(directoryPath: string): string {
  const params = new URLSearchParams();
  params.set("panes", "1");
  params.set("pane0", directoryPath);
  return `/files?${params.toString()}`;
}
