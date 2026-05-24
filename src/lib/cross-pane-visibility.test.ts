// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_ENGINE]

import { describe, it, expect } from "vitest";
import type { FileStat } from "./files.types";
import {
  applyCrossPaneVisibility,
  criterionMatches,
  cycleTriState,
  isFileVisibleInFocusedPane,
  DEFAULT_CROSS_PANE_VISIBILITY,
  type CrossPaneVisibilityState,
} from "./cross-pane-visibility";
import { buildEnhancedComparisonIndex } from "./files.comparison";

function file(name: string, size: number, mtime: string): FileStat {
  return {
    name,
    path: `/a/${name}`,
    isDirectory: false,
    size,
    mtime,
    extension: name.includes(".") ? name.split(".").pop()! : "",
  };
}

describe("[REQ-CROSS_PANE_VISIBILITY] IMPL-CROSS_PANE_VISIBILITY_ENGINE", () => {
  it("cycleTriState rotates inactive → include → exclude", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_UI] CYCLE_TRI_STATE: how: cycleTriState advances tri-state enum
    expect(cycleTriState("inactive")).toBe("include");
    expect(cycleTriState("include")).toBe("exclude");
    expect(cycleTriState("exclude")).toBe("inactive");
  });

  it("exclude hides matching files even when include would match", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] EVALUATE_FOCUS_VISIBILITY: how: exclude wins over include for same file
    const panes = [
      [file("a.txt", 100, "2024-01-01"), file("b.txt", 50, "2024-01-02")],
      [file("a.txt", 200, "2024-01-03"), file("b.txt", 50, "2024-01-02")],
    ];
    const index = buildEnhancedComparisonIndex(panes);
    const state: CrossPaneVisibilityState = {
      ...DEFAULT_CROSS_PANE_VISIBILITY,
      toggles: { sharedAll: "exclude", missingSome: "include" },
    };
    const a = panes[0][0];
    expect(isFileVisibleInFocusedPane(a, 0, 2, index, state)).toBe(false);
  });

  it("include-gating hides files when no include matches", () => {
    const panes = [
      [file("only.txt", 1, "2024-01-01"), file("a.txt", 100, "2024-01-01")],
      [file("a.txt", 100, "2024-01-01"), file("b.txt", 200, "2024-01-02")],
    ];
    const index = buildEnhancedComparisonIndex(panes);
    const state: CrossPaneVisibilityState = {
      ...DEFAULT_CROSS_PANE_VISIBILITY,
      toggles: { sharedAll: "include" },
    };
    expect(isFileVisibleInFocusedPane(panes[0][0], 0, 2, index, state)).toBe(false);
    expect(isFileVisibleInFocusedPane(panes[0][1], 0, 2, index, state)).toBe(true);
  });

  it("mirrors visible basenames to other panes", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] APPLY_CROSS_PANE_VISIBILITY: how: MIRROR_OTHER_PANES filters non-focused listings
    const panes = [
      [file("a.txt", 100, "2024-01-01"), file("b.txt", 50, "2024-01-02")],
      [file("a.txt", 200, "2024-01-03"), file("c.txt", 1, "2024-01-01")],
    ];
    const index = buildEnhancedComparisonIndex(panes);
    const state: CrossPaneVisibilityState = {
      ...DEFAULT_CROSS_PANE_VISIBILITY,
      toggles: { sharedAll: "include" },
    };
    const { displayFilesByPane } = applyCrossPaneVisibility(panes, 0, index, state);
    expect(displayFilesByPane[0].map((f) => f.name)).toEqual(["a.txt"]);
    expect(displayFilesByPane[1].map((f) => f.name)).toEqual(["a.txt"]);
  });

  it("sizeGtThreshold uses sizeThreshold", () => {
    const panes = [[file("big.txt", 1000, "2024-01-01"), file("small.txt", 10, "2024-01-01")]];
    const index = buildEnhancedComparisonIndex([panes[0], panes[0]]);
    const state: CrossPaneVisibilityState = {
      toggles: { sizeGtThreshold: "include" },
      sizeThreshold: 100,
      timeThreshold: null,
    };
    expect(criterionMatches("sizeGtThreshold", panes[0][0], 0, 2, index, state)).toBe(true);
    expect(criterionMatches("sizeGtThreshold", panes[0][1], 0, 2, index, state)).toBe(false);
  });
});
