// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]

import {
  copyCrossPaneVisibilityState,
  DEFAULT_CROSS_PANE_VISIBILITY,
} from "./cross-pane-visibility";
import type {
  CrossPaneVisibilityCatalog,
  CrossPaneVisibilityPreset,
  PresetValidationResult,
} from "./cross-pane-visibility.types";

export const CROSS_PANE_VISIBILITY_STORAGE_KEY = "panorama.crossPaneVisibility.v1";

export type CrossPaneVisibilityChangeEvent =
  | { type: "updated"; preset: CrossPaneVisibilityPreset }
  | { type: "deleted"; presetId: string };

type Listener = (event: CrossPaneVisibilityChangeEvent) => void;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cpv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory + localStorage catalog [IMPL-CROSS_PANE_VISIBILITY_CATALOG] */
export class CrossPaneVisibilityStore {
  private presets: CrossPaneVisibilityPreset[] = [];
  private listeners = new Set<Listener>();

  constructor(private storage: Storage | null = getBrowserStorage()) {
    this.load();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CrossPaneVisibilityChangeEvent): void {
    for (const l of this.listeners) {
      l(event);
    }
  }

  load(): void {
    if (!this.storage) {
      this.presets = [];
      return;
    }
    try {
      const raw = this.storage.getItem(CROSS_PANE_VISIBILITY_STORAGE_KEY);
      if (!raw) {
        this.presets = [];
        return;
      }
      const parsed = JSON.parse(raw) as CrossPaneVisibilityCatalog;
      this.presets = Array.isArray(parsed.presets) ? parsed.presets : [];
    } catch (err) {
      console.error("DEBUG: [IMPL-CROSS_PANE_VISIBILITY_CATALOG] Failed to load catalog", err);
      this.presets = [];
    }
  }

  private persist(): void {
    if (!this.storage) return;
    const payload: CrossPaneVisibilityCatalog = { presets: this.presets };
    this.storage.setItem(CROSS_PANE_VISIBILITY_STORAGE_KEY, JSON.stringify(payload));
  }

  list(): CrossPaneVisibilityPreset[] {
    return [...this.presets].sort((a, b) => a.name.localeCompare(b.name));
  }

  get(id: string): CrossPaneVisibilityPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }

  getNames(excludePresetId?: string): string[] {
    return this.presets
      .filter((p) => p.id !== excludePresetId)
      .map((p) => p.name);
  }

  validate(
    input: Pick<CrossPaneVisibilityPreset, "name">,
    excludePresetId?: string,
  ): PresetValidationResult {
    const name = input.name.trim();
    if (!name) {
      return { ok: false, errors: ["Name is required"] };
    }
    const lower = name.toLowerCase();
    const dup = this.presets.some(
      (p) => p.id !== excludePresetId && p.name.toLowerCase() === lower,
    );
    if (dup) {
      return { ok: false, errors: ["A preset with this name already exists"] };
    }
    return { ok: true };
  }

  create(input: {
    name: string;
    description?: string;
    state?: CrossPaneVisibilityPreset["state"];
  }): CrossPaneVisibilityPreset | PresetValidationResult {
    const validation = this.validate(input);
    if (!validation.ok) return validation;
    const now = new Date().toISOString();
    const preset: CrossPaneVisibilityPreset = {
      id: generateId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      state: copyCrossPaneVisibilityState(input.state ?? DEFAULT_CROSS_PANE_VISIBILITY),
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.presets.push(preset);
    this.persist();
    this.emit({ type: "updated", preset });
    console.log("TRACE: [IMPL-CROSS_PANE_VISIBILITY_CATALOG] Created preset", preset.id, preset.name);
    return preset;
  }

  update(
    id: string,
    patch: Partial<Pick<CrossPaneVisibilityPreset, "name" | "description" | "state">>,
  ): CrossPaneVisibilityPreset | PresetValidationResult | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const next = {
      name: patch.name ?? existing.name,
      description: patch.description ?? existing.description,
      state: patch.state ? copyCrossPaneVisibilityState(patch.state) : existing.state,
    };
    const validation = this.validate(next, id);
    if (!validation.ok) return validation;
    const now = new Date().toISOString();
    const preset: CrossPaneVisibilityPreset = {
      ...existing,
      ...next,
      name: next.name.trim(),
      description: next.description?.trim() || undefined,
      version: existing.version + 1,
      updatedAt: now,
    };
    const idx = this.presets.findIndex((p) => p.id === id);
    this.presets[idx] = preset;
    this.persist();
    this.emit({ type: "updated", preset });
    console.log(
      "TRACE: [IMPL-CROSS_PANE_VISIBILITY_CATALOG] Updated preset",
      preset.id,
      "version",
      preset.version,
    );
    return preset;
  }

  duplicate(
    id: string,
    newName: string,
  ): CrossPaneVisibilityPreset | PresetValidationResult | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    return this.create({
      name: newName,
      description: existing.description,
      state: existing.state,
    });
  }

  delete(id: string): boolean {
    const before = this.presets.length;
    this.presets = this.presets.filter((p) => p.id !== id);
    if (this.presets.length === before) return false;
    this.persist();
    this.emit({ type: "deleted", presetId: id });
    console.log("TRACE: [IMPL-CROSS_PANE_VISIBILITY_CATALOG] Deleted preset", id);
    return true;
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

let defaultStore: CrossPaneVisibilityStore | null = null;

export function getCrossPaneVisibilityStore(): CrossPaneVisibilityStore {
  if (!defaultStore) {
    defaultStore = new CrossPaneVisibilityStore();
  }
  return defaultStore;
}

export function resetCrossPaneVisibilityStoreForTests(store?: CrossPaneVisibilityStore | null): void {
  defaultStore = store ?? null;
}
