// [REQ-PANE_DISPLAY_FILTER] [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE]

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DisplaySpecStore, resetDisplaySpecStoreForTests } from "./display-spec-store";
import { buildPaneFromRawListing, type PaneWithDisplayFilter } from "./pane-display-filter";
import type { FileStat } from "./files.types";

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

function file(name: string): FileStat {
  return {
    name,
    path: `/tmp/${name}`,
    isDirectory: false,
    size: 1,
    mtime: new Date(),
    extension: name.includes(".") ? name.slice(name.lastIndexOf(".")) : "",
  };
}

function basePane(): PaneWithDisplayFilter {
  return {
    path: "/tmp",
    files: [],
    cursor: 0,
    marks: new Set(),
    sortBy: "name",
    sortDirection: "asc",
    sortDirsFirst: true,
    activeDisplaySpecId: null,
    loadedSpecVersion: null,
    hiddenCount: 0,
    rawFileCount: 0,
  };
}

describe("pane-display-filter [IMPL-PANE_DISPLAY_FILTER_UI]", () => {
  let store: DisplaySpecStore;

  beforeEach(() => {
    store = new DisplaySpecStore(mockStorage());
    resetDisplaySpecStoreForTests(null);
  });

  it("BUILD_PANE_FROM_RAW_LISTING filters hidden files when spec active [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: client-side filter when server did not pre-filter; sort visible files; reconcile or clear marks per preserveMarks flag", () => {
    const created = store.create({
      name: "No logs",
      rules: [
        { id: "r1", action: "exclude", target: "file", pattern: "*.log", order: 0, enabled: true },
      ],
    }) as { id: string; version: number };
    const pane = buildPaneFromRawListing(
      [file("README.md"), file("app.log")],
      { ...basePane(), activeDisplaySpecId: created.id },
      store,
    );
    expect(pane.files.map((f) => f.name)).toEqual(["README.md"]);
    expect(pane.hiddenCount).toBe(1);
    expect(pane.loadedSpecVersion).toBe(1);
  });

  it("BUILD_PANE_FROM_RAW_LISTING visible set is mark-all source (REQ visible-only marks)", () => {
    const created = store.create({
      name: "No tmp",
      rules: [
        { id: "r1", action: "exclude", target: "file", pattern: "*.tmp", order: 0, enabled: true },
      ],
    }) as { id: string };
    const pane = buildPaneFromRawListing(
      [file("keep.txt"), file("drop.tmp")],
      { ...basePane(), activeDisplaySpecId: created.id },
      store,
    );
    const markAllNames = new Set(pane.files.map((f) => f.name));
    expect(markAllNames).toEqual(new Set(["keep.txt"]));
    expect(markAllNames.has("drop.tmp")).toBe(false);
  });

  it("REFRESH_PANES_USING_SPEC store update bumps version for shared spec id", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    const created = store.create({
      name: "V1",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*.tmp", order: 0, enabled: true }],
    }) as { id: string; version: number };
    expect(created.version).toBe(1);
    const updated = store.update(created.id, {
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*.bak", order: 0, enabled: true }],
    }) as { version: number };
    expect(updated.version).toBe(2);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "updated", spec: expect.objectContaining({ id: created.id }) }),
    );
  });
});
