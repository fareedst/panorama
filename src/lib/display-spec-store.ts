// [IMPL-DISPLAY_SPEC_STORE] [ARCH-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]

import type { DisplayFilterCatalog, DisplayFilterSpec, SpecValidationResult } from "./display-filter.types";
import { validateSpec } from "./display-filter-engine";

export const DISPLAY_SPECS_STORAGE_KEY = "panorama.displaySpecs.v1";

export type DisplaySpecChangeEvent =
  | { type: "updated"; spec: DisplayFilterSpec }
  | { type: "deleted"; specId: string };

type Listener = (event: DisplaySpecChangeEvent) => void;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `spec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory + localStorage catalog [IMPL-DISPLAY_SPEC_STORE] */
export class DisplaySpecStore {
  private specs: DisplayFilterSpec[] = [];
  private listeners = new Set<Listener>();

  constructor(private storage: Storage | null = getBrowserStorage()) {
    this.load();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: DisplaySpecChangeEvent): void {
    for (const l of this.listeners) {
      l(event);
    }
  }

  load(): void {
    if (!this.storage) {
      this.specs = [];
      return;
    }
    try {
      const raw = this.storage.getItem(DISPLAY_SPECS_STORAGE_KEY);
      if (!raw) {
        this.specs = [];
        return;
      }
      const parsed = JSON.parse(raw) as DisplayFilterCatalog;
      this.specs = Array.isArray(parsed.specs) ? parsed.specs : [];
    } catch (err) {
      console.error("DEBUG: [IMPL-DISPLAY_SPEC_STORE] Failed to load catalog", err);
      this.specs = [];
    }
  }

  private persist(): void {
    if (!this.storage) return;
    const payload: DisplayFilterCatalog = { specs: this.specs };
    this.storage.setItem(DISPLAY_SPECS_STORAGE_KEY, JSON.stringify(payload));
  }

  list(): DisplayFilterSpec[] {
    return [...this.specs].sort((a, b) => a.name.localeCompare(b.name));
  }

  get(id: string): DisplayFilterSpec | undefined {
    return this.specs.find((s) => s.id === id);
  }

  getNames(excludeSpecId?: string): string[] {
    return this.specs
      .filter((s) => s.id !== excludeSpecId)
      .map((s) => s.name);
  }

  validate(
    spec: Pick<DisplayFilterSpec, "name" | "rules">,
    excludeSpecId?: string,
  ): SpecValidationResult {
    return validateSpec(spec, this.getNames(excludeSpecId));
  }

  create(input: {
    name: string;
    description?: string;
    rules: DisplayFilterSpec["rules"];
  }): DisplayFilterSpec | SpecValidationResult {
    const validation = this.validate(input);
    if (!validation.ok) return validation;
    const now = new Date().toISOString();
    const spec: DisplayFilterSpec = {
      id: generateId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      rules: input.rules,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.specs.push(spec);
    this.persist();
    this.emit({ type: "updated", spec });
    console.log("TRACE: [IMPL-DISPLAY_SPEC_STORE] Created spec", spec.id, spec.name);
    return spec;
  }

  update(
    id: string,
    patch: Partial<Pick<DisplayFilterSpec, "name" | "description" | "rules">>,
  ): DisplayFilterSpec | SpecValidationResult | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const next = {
      name: patch.name ?? existing.name,
      description: patch.description ?? existing.description,
      rules: patch.rules ?? existing.rules,
    };
    const validation = this.validate(next, id);
    if (!validation.ok) return validation;
    const now = new Date().toISOString();
    const spec: DisplayFilterSpec = {
      ...existing,
      ...next,
      name: next.name.trim(),
      description: next.description?.trim() || undefined,
      version: existing.version + 1,
      updatedAt: now,
    };
    const idx = this.specs.findIndex((s) => s.id === id);
    this.specs[idx] = spec;
    this.persist();
    this.emit({ type: "updated", spec });
    console.log("TRACE: [IMPL-DISPLAY_SPEC_STORE] Updated spec", spec.id, "version", spec.version);
    return spec;
  }

  duplicate(id: string, newName: string): DisplayFilterSpec | SpecValidationResult | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    return this.create({
      name: newName,
      description: existing.description,
      rules: existing.rules.map((r, i) => ({ ...r, id: `rule-${i}-${generateId()}` })),
    });
  }

  delete(id: string): boolean {
    const before = this.specs.length;
    this.specs = this.specs.filter((s) => s.id !== id);
    if (this.specs.length === before) return false;
    this.persist();
    this.emit({ type: "deleted", specId: id });
    console.log("TRACE: [IMPL-DISPLAY_SPEC_STORE] Deleted spec", id);
    return true;
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/** Singleton for client workspace */
let defaultStore: DisplaySpecStore | null = null;

export function getDisplaySpecStore(): DisplaySpecStore {
  if (!defaultStore) {
    defaultStore = new DisplaySpecStore();
  }
  return defaultStore;
}

export function resetDisplaySpecStoreForTests(store?: DisplaySpecStore | null): void {
  defaultStore = store ?? null;
}
