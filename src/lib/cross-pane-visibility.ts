// [IMPL-CROSS_PANE_VISIBILITY_ENGINE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: Filter pipeline stage 2 — **Cross-pane visibility** after **Display spec**; **Focused pane visibility** + **Mirrored visibility** (tied/vocab/cross-pane-visibility.md)

import type { FileStat, EnhancedCompareState } from "./files.types";

export type TriState = "inactive" | "include" | "exclude";

export type CompareFilterCriterionId =
  | "sharedAll"
  | "missingSome"
  | "sizeLargestAll"
  | "sizeLargestSome"
  | "sizeGtThreshold"
  | "sizeSmallestAll"
  | "sizeSmallestSome"
  | "sizeLtThreshold"
  | "timeLatestAll"
  | "timeLatestSome"
  | "timeGtThreshold"
  | "timeEarliestAll"
  | "timeEarliestSome"
  | "timeLtThreshold";

export const COMPARE_FILTER_ACTION_PREFIX = "view.compareFilter.";

export function compareFilterActionId(id: CompareFilterCriterionId): string {
  return `${COMPARE_FILTER_ACTION_PREFIX}${id}`;
}

export function parseCompareFilterCriterionAction(
  action: string,
): CompareFilterCriterionId | null {
  if (!action.startsWith(COMPARE_FILTER_ACTION_PREFIX)) return null;
  const id = action.slice(COMPARE_FILTER_ACTION_PREFIX.length) as CompareFilterCriterionId;
  return COMPARE_FILTER_CRITERION_IDS.includes(id) ? id : null;
}

export const COMPARE_FILTER_CRITERION_IDS: CompareFilterCriterionId[] = [
  "sharedAll",
  "missingSome",
  "sizeLargestAll",
  "sizeLargestSome",
  "sizeGtThreshold",
  "sizeSmallestAll",
  "sizeSmallestSome",
  "sizeLtThreshold",
  "timeLatestAll",
  "timeLatestSome",
  "timeGtThreshold",
  "timeEarliestAll",
  "timeEarliestSome",
  "timeLtThreshold",
];

export type CrossPaneVisibilityState = {
  toggles: Partial<Record<CompareFilterCriterionId, TriState>>;
  sizeThreshold: number | null;
  timeThreshold: string | null;
};

export const DEFAULT_CROSS_PANE_VISIBILITY: CrossPaneVisibilityState = {
  toggles: {},
  sizeThreshold: null,
  timeThreshold: null,
};

export function copyCrossPaneVisibilityState(
  state: CrossPaneVisibilityState,
): CrossPaneVisibilityState {
  return {
    toggles: { ...state.toggles },
    sizeThreshold: state.sizeThreshold,
    timeThreshold: state.timeThreshold,
  };
}

export function isCrossPaneVisibilityActive(state: CrossPaneVisibilityState): boolean {
  return COMPARE_FILTER_CRITERION_IDS.some(
    (id) => state.toggles[id] === "include" || state.toggles[id] === "exclude",
  );
}

export function crossPaneVisibilityStatesEqual(
  a: CrossPaneVisibilityState,
  b: CrossPaneVisibilityState,
): boolean {
  if (a.sizeThreshold !== b.sizeThreshold || a.timeThreshold !== b.timeThreshold) {
    return false;
  }
  for (const id of COMPARE_FILTER_CRITERION_IDS) {
    const av = a.toggles[id] ?? "inactive";
    const bv = b.toggles[id] ?? "inactive";
    if (av !== bv) return false;
  }
  return true;
}

export function cycleTriState(current: TriState): TriState {
  if (current === "inactive") return "include";
  if (current === "include") return "exclude";
  return "inactive";
}

function mtimeMs(mtime: Date | string): number {
  return typeof mtime === "string" ? new Date(mtime).getTime() : mtime.getTime();
}

function getEnhancedForFile(
  index: Map<string, Map<number, EnhancedCompareState>>,
  filename: string,
  paneIndex: number,
): EnhancedCompareState | null {
  return index.get(filename)?.get(paneIndex) ?? null;
}

function paneIndexInState(state: EnhancedCompareState, paneIndex: number): number {
  return state.panes.indexOf(paneIndex);
}

function sizeRoleAt(
  state: EnhancedCompareState,
  paneIndex: number,
): "equal" | "smallest" | "largest" | null {
  const i = paneIndexInState(state, paneIndex);
  if (i < 0) return null;
  if (state.sizeComparison.length === 1) {
    return state.sizeComparison[0] ?? null;
  }
  return state.sizeComparison[i] ?? null;
}

function timeRoleAt(
  state: EnhancedCompareState,
  paneIndex: number,
): "equal" | "earliest" | "latest" | null {
  const i = paneIndexInState(state, paneIndex);
  if (i < 0) return null;
  if (state.timeComparison.length === 1) {
    return state.timeComparison[0] ?? null;
  }
  return state.timeComparison[i] ?? null;
}

function isSizeLargestAll(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = sizeRoleAt(state, paneIndex);
  if (role !== "largest") return false;
  for (let i = 0; i < state.panes.length; i++) {
    if (state.panes[i] === paneIndex) continue;
    const other = state.sizeComparison[i];
    if (other !== "smallest" && other !== "equal") return false;
  }
  return true;
}

function isSizeLargestSome(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = sizeRoleAt(state, paneIndex);
  if (role !== "largest") return false;
  return !isSizeLargestAll(state, paneIndex);
}

function isSizeSmallestAll(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = sizeRoleAt(state, paneIndex);
  if (role !== "smallest") return false;
  for (let i = 0; i < state.panes.length; i++) {
    if (state.panes[i] === paneIndex) continue;
    const other = state.sizeComparison[i];
    if (other !== "largest" && other !== "equal") return false;
  }
  return true;
}

function isSizeSmallestSome(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = sizeRoleAt(state, paneIndex);
  if (role !== "smallest") return false;
  return !isSizeSmallestAll(state, paneIndex);
}

function isTimeLatestAll(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = timeRoleAt(state, paneIndex);
  if (role !== "latest") return false;
  for (let i = 0; i < state.panes.length; i++) {
    if (state.panes[i] === paneIndex) continue;
    const other = state.timeComparison[i];
    if (other !== "earliest" && other !== "equal") return false;
  }
  return true;
}

function isTimeLatestSome(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = timeRoleAt(state, paneIndex);
  if (role !== "latest") return false;
  return !isTimeLatestAll(state, paneIndex);
}

function isTimeEarliestAll(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = timeRoleAt(state, paneIndex);
  if (role !== "earliest") return false;
  for (let i = 0; i < state.panes.length; i++) {
    if (state.panes[i] === paneIndex) continue;
    const other = state.timeComparison[i];
    if (other !== "latest" && other !== "equal") return false;
  }
  return true;
}

function isTimeEarliestSome(state: EnhancedCompareState, paneIndex: number): boolean {
  const role = timeRoleAt(state, paneIndex);
  if (role !== "earliest") return false;
  return !isTimeEarliestAll(state, paneIndex);
}

/** [IMPL-CROSS_PANE_VISIBILITY_ENGINE] EVALUATE_FOCUS_VISIBILITY — single criterion match */
export function criterionMatches(
  criterion: CompareFilterCriterionId,
  file: FileStat,
  focusIndex: number,
  paneCount: number,
  enhancedIndex: Map<string, Map<number, EnhancedCompareState>>,
  state: CrossPaneVisibilityState,
): boolean {
  const enhanced = getEnhancedForFile(enhancedIndex, file.name, focusIndex);

  switch (criterion) {
    case "sharedAll":
      return enhanced !== null && enhanced.panes.length === paneCount;
    case "missingSome":
      return enhanced === null || enhanced.panes.length < paneCount;
    case "sizeLargestAll":
      return enhanced !== null && isSizeLargestAll(enhanced, focusIndex);
    case "sizeLargestSome":
      return enhanced !== null && isSizeLargestSome(enhanced, focusIndex);
    case "sizeGtThreshold":
      return (
        state.sizeThreshold !== null &&
        !file.isDirectory &&
        file.size > state.sizeThreshold
      );
    case "sizeSmallestAll":
      return enhanced !== null && isSizeSmallestAll(enhanced, focusIndex);
    case "sizeSmallestSome":
      return enhanced !== null && isSizeSmallestSome(enhanced, focusIndex);
    case "sizeLtThreshold":
      return (
        state.sizeThreshold !== null &&
        !file.isDirectory &&
        file.size < state.sizeThreshold
      );
    case "timeLatestAll":
      return enhanced !== null && isTimeLatestAll(enhanced, focusIndex);
    case "timeLatestSome":
      return enhanced !== null && isTimeLatestSome(enhanced, focusIndex);
    case "timeGtThreshold": {
      if (state.timeThreshold === null || file.isDirectory) return false;
      const threshold = mtimeMs(state.timeThreshold);
      return mtimeMs(file.mtime) > threshold;
    }
    case "timeEarliestAll":
      return enhanced !== null && isTimeEarliestAll(enhanced, focusIndex);
    case "timeEarliestSome":
      return enhanced !== null && isTimeEarliestSome(enhanced, focusIndex);
    case "timeLtThreshold": {
      if (state.timeThreshold === null || file.isDirectory) return false;
      const threshold = mtimeMs(state.timeThreshold);
      return mtimeMs(file.mtime) < threshold;
    }
    default:
      return false;
  }
}

function hasActiveInclude(state: CrossPaneVisibilityState): boolean {
  return COMPARE_FILTER_CRITERION_IDS.some(
    (id) => state.toggles[id] === "include",
  );
}

/** [IMPL-CROSS_PANE_VISIBILITY_ENGINE] EVALUATE_FOCUS_VISIBILITY — **Focused pane visibility** */
export function isFileVisibleInFocusedPane(
  file: FileStat,
  focusIndex: number,
  paneCount: number,
  enhancedIndex: Map<string, Map<number, EnhancedCompareState>>,
  state: CrossPaneVisibilityState,
): boolean {
  for (const id of COMPARE_FILTER_CRITERION_IDS) {
    if (state.toggles[id] === "exclude" && criterionMatches(id, file, focusIndex, paneCount, enhancedIndex, state)) {
      return false;
    }
  }
  if (hasActiveInclude(state)) {
    for (const id of COMPARE_FILTER_CRITERION_IDS) {
      if (
        state.toggles[id] === "include" &&
        criterionMatches(id, file, focusIndex, paneCount, enhancedIndex, state)
      ) {
        return true;
      }
    }
    return false;
  }
  return true;
}

export type CrossPaneVisibilityApplyResult = {
  displayFilesByPane: FileStat[][];
  crossPaneHiddenByPane: number[];
};

/** [IMPL-CROSS_PANE_VISIBILITY_ENGINE] APPLY_CROSS_PANE_VISIBILITY — **Focused pane visibility** + **Mirrored visibility** (filter pipeline stage 2) */
export function applyCrossPaneVisibility(
  paneFiles: FileStat[][],
  focusIndex: number,
  enhancedIndex: Map<string, Map<number, EnhancedCompareState>>,
  state: CrossPaneVisibilityState,
): CrossPaneVisibilityApplyResult {
  const paneCount = paneFiles.length;
  if (paneCount < 2 || !isCrossPaneVisibilityActive(state)) {
    return {
      displayFilesByPane: paneFiles.map((f) => [...f]),
      crossPaneHiddenByPane: paneFiles.map(() => 0),
    };
  }

  const focusFiles = paneFiles[focusIndex] ?? [];
  const visibleNames = new Set<string>();
  let focusHidden = 0;
  const focusedVisible: FileStat[] = [];

  for (const file of focusFiles) {
    if (isFileVisibleInFocusedPane(file, focusIndex, paneCount, enhancedIndex, state)) {
      visibleNames.add(file.name);
      focusedVisible.push(file);
    } else {
      focusHidden++;
    }
  }

  const displayFilesByPane = paneFiles.map((files, i) => {
    if (i === focusIndex) return focusedVisible;
    return files.filter((f) => visibleNames.has(f.name));
  });

  const crossPaneHiddenByPane = paneFiles.map((files, i) => {
    if (i === focusIndex) return focusHidden;
    return files.length - displayFilesByPane[i].length;
  });

  return { displayFilesByPane, crossPaneHiddenByPane };
}

export function normalizeCrossPaneVisibility(
  raw: unknown,
): CrossPaneVisibilityState {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CROSS_PANE_VISIBILITY, toggles: {} };
  }
  const o = raw as Record<string, unknown>;
  const toggles: Partial<Record<CompareFilterCriterionId, TriState>> = {};
  if (o.toggles && typeof o.toggles === "object") {
    for (const id of COMPARE_FILTER_CRITERION_IDS) {
      const v = (o.toggles as Record<string, unknown>)[id];
      if (v === "include" || v === "exclude" || v === "inactive") {
        toggles[id] = v;
      }
    }
  }
  const sizeThreshold =
    typeof o.sizeThreshold === "number" && o.sizeThreshold >= 0
      ? o.sizeThreshold
      : null;
  const timeThreshold =
    typeof o.timeThreshold === "string" && o.timeThreshold.trim()
      ? o.timeThreshold
      : null;
  return { toggles, sizeThreshold, timeThreshold };
}

export function crossPaneVisibilityNeedsThreshold(
  state: CrossPaneVisibilityState,
): boolean {
  return (
    state.toggles.sizeGtThreshold === "include" ||
    state.toggles.sizeGtThreshold === "exclude" ||
    state.toggles.sizeLtThreshold === "include" ||
    state.toggles.sizeLtThreshold === "exclude" ||
    state.toggles.timeGtThreshold === "include" ||
    state.toggles.timeGtThreshold === "exclude" ||
    state.toggles.timeLtThreshold === "include" ||
    state.toggles.timeLtThreshold === "exclude"
  );
}
