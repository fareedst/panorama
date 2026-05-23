// [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]

import fs from "fs/promises";
import path from "path";
import type { DisplayFilterCatalog, DisplayFilterSpec, SpecValidationResult } from "./display-filter.types";
import { validateSpec } from "./display-filter-engine";
import { DISPLAY_SPECS_STORAGE_KEY } from "./display-spec-store";

const DATA_DIR = path.join(process.cwd(), "data");
const SPECS_FILE = path.join(DATA_DIR, "display-specs.json");

function generateId(): string {
  return `spec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readCatalog(): Promise<DisplayFilterSpec[]> {
  try {
    const raw = await fs.readFile(SPECS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DisplayFilterCatalog;
    return Array.isArray(parsed.specs) ? parsed.specs : [];
  } catch {
    return [];
  }
}

async function writeCatalog(specs: DisplayFilterSpec[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const payload: DisplayFilterCatalog = { specs };
  await fs.writeFile(SPECS_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function serverListDisplaySpecs(): Promise<DisplayFilterSpec[]> {
  const specs = await readCatalog();
  return specs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function serverGetDisplaySpec(id: string): Promise<DisplayFilterSpec | undefined> {
  const specs = await readCatalog();
  return specs.find((s) => s.id === id);
}

function getNames(specs: DisplayFilterSpec[], excludeId?: string): string[] {
  return specs.filter((s) => s.id !== excludeId).map((s) => s.name);
}

export async function serverCreateDisplaySpec(input: {
  name: string;
  description?: string;
  rules: DisplayFilterSpec["rules"];
}): Promise<DisplayFilterSpec | SpecValidationResult> {
  const specs = await readCatalog();
  const validation = validateSpec(input, getNames(specs));
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
  specs.push(spec);
  await writeCatalog(specs);
  return spec;
}

export async function serverUpdateDisplaySpec(
  id: string,
  patch: Partial<Pick<DisplayFilterSpec, "name" | "description" | "rules">>,
): Promise<DisplayFilterSpec | SpecValidationResult | undefined> {
  const specs = await readCatalog();
  const existing = specs.find((s) => s.id === id);
  if (!existing) return undefined;
  const next = {
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    rules: patch.rules ?? existing.rules,
  };
  const validation = validateSpec(next, getNames(specs, id));
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
  const idx = specs.findIndex((s) => s.id === id);
  specs[idx] = spec;
  await writeCatalog(specs);
  return spec;
}

export async function serverDeleteDisplaySpec(id: string): Promise<boolean> {
  const specs = await readCatalog();
  const filtered = specs.filter((s) => s.id !== id);
  if (filtered.length === specs.length) return false;
  await writeCatalog(filtered);
  return true;
}

/** Import client localStorage catalog (migration) */
export async function serverImportDisplaySpecs(catalog: DisplayFilterCatalog): Promise<void> {
  await writeCatalog(catalog.specs ?? []);
}

/** Merge client specs into server catalog by id; keep newer version. */
export async function serverMergeDisplaySpecs(incoming: DisplayFilterSpec[]): Promise<void> {
  const specs = await readCatalog();
  for (const spec of incoming) {
    const idx = specs.findIndex((s) => s.id === spec.id);
    if (idx >= 0) {
      if (spec.version >= specs[idx].version) {
        specs[idx] = spec;
      }
    } else {
      specs.push(spec);
    }
  }
  await writeCatalog(specs);
}

/** Ensure a single client-authored spec exists on the server (preserves id). */
export async function serverUpsertDisplaySpec(spec: DisplayFilterSpec): Promise<void> {
  await serverMergeDisplaySpecs([spec]);
}

export { DISPLAY_SPECS_STORAGE_KEY };
