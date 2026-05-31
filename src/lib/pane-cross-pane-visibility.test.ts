// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]

import { describe, it, expect, beforeEach } from "vitest";
import { CrossPaneVisibilityStore } from "./cross-pane-visibility-store";
import {
  initialPaneCrossPaneVisibilityFields,
  isCrossPaneVisibilityDraftDirty,
  mergePaneListingWithCrossPaneFields,
  shouldSnapshotInlineCrossPaneVisibility,
  type PaneCrossPaneVisibilityFields,
} from "./pane-cross-pane-visibility";
import type { PaneWithDisplayFilter } from "./pane-display-filter";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

describe("pane-cross-pane-visibility [IMPL-CROSS_PANE_VISIBILITY_CATALOG]", () => {
  let store: CrossPaneVisibilityStore;

  beforeEach(() => {
    store = new CrossPaneVisibilityStore(mockStorage());
  });

  it("loads inline state from restore meta", () => {
    const fields = initialPaneCrossPaneVisibilityFields(
      {
        crossPaneVisibility: { toggles: { sharedAll: "include" }, sizeThreshold: null, timeThreshold: null },
      },
      store,
    );
    expect(fields.crossPaneVisibilityDraft.toggles.sharedAll).toBe("include");
  });

  it("marks draft dirty when toggles diverge from preset", () => {
    const preset = store.create({
      name: "Base",
      state: { toggles: {}, sizeThreshold: null, timeThreshold: null },
    }) as { id: string };
    const fields = initialPaneCrossPaneVisibilityFields(
      { crossPaneVisibilityId: preset.id },
      store,
    );
    expect(isCrossPaneVisibilityDraftDirty(fields, store)).toBe(false);
    fields.crossPaneVisibilityDraft.toggles.sharedAll = "include";
    expect(isCrossPaneVisibilityDraftDirty(fields, store)).toBe(true);
    expect(shouldSnapshotInlineCrossPaneVisibility(fields, store)).toBe(true);
  });

  // [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-DIRECTORY_NAVIGATION]: how: **Listing merge** via **Cross-pane field pick** — attach visibility catalog fields only; navigation/refresh do not revert path or files (tied/vocab/cross-pane-visibility.md)
  it("mergePaneListingWithCrossPaneFields keeps listing path when passed a full pane", () => {
    const crossPane = initialPaneCrossPaneVisibilityFields(undefined, store);
    const listingPane: PaneWithDisplayFilter = {
      path: "/new/path",
      files: [{ name: "a.txt", path: "/new/path/a.txt", isDirectory: false, size: 1, mtime: "", extension: ".txt" }],
      cursor: 0,
      marks: new Set(),
      sortBy: "name",
      sortDirection: "asc",
      sortDirsFirst: true,
      activeDisplaySpecId: null,
      loadedSpecVersion: null,
      hiddenCount: 0,
      rawFileCount: 1,
      ...crossPane,
    };
    const stalePane = {
      ...listingPane,
      path: "/old/path",
      files: [],
      cursor: 3,
      marks: new Set(["x"]),
    };
    // Callers often pass full pane state; merge must not copy listing fields from it
    const merged = mergePaneListingWithCrossPaneFields(
      listingPane,
      stalePane as unknown as PaneCrossPaneVisibilityFields,
    );
    expect(merged.path).toBe("/new/path");
    expect(merged.files).toHaveLength(1);
    expect(merged.cursor).toBe(0);
    expect(merged.marks.size).toBe(0);
  });
});
