// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]

import { describe, it, expect, beforeEach } from "vitest";
import {
  CrossPaneVisibilityStore,
  CROSS_PANE_VISIBILITY_STORAGE_KEY,
  resetCrossPaneVisibilityStoreForTests,
} from "./cross-pane-visibility-store";

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

describe("CrossPaneVisibilityStore [IMPL-CROSS_PANE_VISIBILITY_CATALOG]", () => {
  let storage: Storage;
  let store: CrossPaneVisibilityStore;

  beforeEach(() => {
    storage = mockStorage();
    store = new CrossPaneVisibilityStore(storage);
    resetCrossPaneVisibilityStoreForTests(null);
  });

  it("creates and lists presets", () => {
    const result = store.create({
      name: "Shared only",
      state: { toggles: { sharedAll: "include" }, sizeThreshold: null, timeThreshold: null },
    });
    expect("id" in result && result.name).toBe("Shared only");
    expect(store.list()).toHaveLength(1);
    expect(storage.getItem(CROSS_PANE_VISIBILITY_STORAGE_KEY)).toBeTruthy();
  });

  it("rejects duplicate names", () => {
    store.create({ name: "Dup" });
    const second = store.create({ name: "dup" });
    expect("ok" in second && second.ok).toBe(false);
  });

  it("increments version on update", () => {
    const created = store.create({ name: "V" }) as { id: string; version: number };
    const updated = store.update(created.id, {
      state: { toggles: { missingSome: "exclude" }, sizeThreshold: null, timeThreshold: null },
    }) as { version: number };
    expect(updated.version).toBe(2);
  });

  it("notifies subscribers on delete", () => {
    const created = store.create({ name: "Del" }) as { id: string };
    const deleted: string[] = [];
    store.subscribe((ev) => {
      if (ev.type === "deleted") deleted.push(ev.presetId);
    });
    store.delete(created.id);
    expect(deleted).toEqual([created.id]);
  });
});
