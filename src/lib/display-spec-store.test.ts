// [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_SPEC_STORE]

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DisplaySpecStore, DISPLAY_SPECS_STORAGE_KEY, resetDisplaySpecStoreForTests } from "./display-spec-store";

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

describe("DisplaySpecStore [IMPL-DISPLAY_SPEC_STORE]", () => {
  let storage: Storage;
  let store: DisplaySpecStore;

  beforeEach(() => {
    storage = mockStorage();
    store = new DisplaySpecStore(storage);
    resetDisplaySpecStoreForTests(null);
  });

  it("creates and lists specs", () => {
    const result = store.create({
      name: "Test Spec",
      rules: [{ id: "r1", action: "exclude", target: "file", pattern: "*.tmp", order: 0, enabled: true }],
    });
    expect("id" in result && result.name).toBe("Test Spec");
    expect(store.list()).toHaveLength(1);
    const raw = storage.getItem(DISPLAY_SPECS_STORAGE_KEY);
    expect(raw).toBeTruthy();
  });

  it("CREATE_SPEC rejects invalid rule pattern with clear errors", () => {
    const result = store.create({
      name: "Bad rules",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "   ", order: 0, enabled: true }],
    });
    expect("ok" in result && result.ok).toBe(false);
    if ("ok" in result && !result.ok) {
      expect(result.errors.some((e) => e.includes("Pattern"))).toBe(true);
    }
  });

  it("rejects duplicate names", () => {
    store.create({
      name: "Dup",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*", order: 0, enabled: true }],
    });
    const second = store.create({
      name: "dup",
      rules: [{ id: "r2", action: "exclude", target: "both", pattern: "*", order: 0, enabled: true }],
    });
    expect("ok" in second && second.ok).toBe(false);
  });

  it("increments version on update", () => {
    const created = store.create({
      name: "V",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*.x", order: 0, enabled: true }],
    }) as { id: string; version: number };
    const updated = store.update(created.id, {
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*.y", order: 0, enabled: true }],
    }) as { version: number };
    expect(updated.version).toBe(2);
  });

  it("DUPLICATE_SPEC creates a new catalog entry", () => {
    const created = store.create({
      name: "Original",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*.tmp", order: 0, enabled: true }],
    }) as { id: string };
    const dup = store.duplicate(created.id, "Copy of Original") as { id: string; name: string };
    expect(dup.id).not.toBe(created.id);
    expect(dup.name).toBe("Copy of Original");
    expect(store.list()).toHaveLength(2);
  });

  it("UPDATE_SPEC renames spec when name changes", () => {
    const created = store.create({
      name: "Before",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*", order: 0, enabled: true }],
    }) as { id: string };
    const renamed = store.update(created.id, { name: "After" }) as { name: string };
    expect(renamed.name).toBe("After");
    expect(store.get(created.id)?.name).toBe("After");
  });

  it("notifies subscribers on update", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    const created = store.create({
      name: "Sub",
      rules: [{ id: "r1", action: "exclude", target: "both", pattern: "*", order: 0, enabled: true }],
    }) as { id: string };
    expect(listener).toHaveBeenCalled();
    store.delete(created.id);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: "deleted" }));
  });
});
