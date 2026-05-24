// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]

import { describe, it, expect, beforeEach } from "vitest";
import { CrossPaneVisibilityStore } from "./cross-pane-visibility-store";
import {
  initialPaneCrossPaneVisibilityFields,
  isCrossPaneVisibilityDraftDirty,
  shouldSnapshotInlineCrossPaneVisibility,
} from "./pane-cross-pane-visibility";

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
});
