// [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]

import type { FileStat } from "./files.types";
import { globMatch } from "./glob-match";
import type {
  DisplayFilterRule,
  DisplayFilterSpec,
  FilterRuleTarget,
  PaneListingApplyResult,
  PaneListingState,
  SpecValidationResult,
} from "./display-filter.types";
import { MAX_RULES_PER_SPEC } from "./display-filter.types";

export interface ListingEntry {
  name: string;
  isDirectory: boolean;
}

function targetMatches(entry: ListingEntry, target: FilterRuleTarget): boolean {
  if (target === "both") return true;
  if (target === "directory") return entry.isDirectory;
  return !entry.isDirectory;
}

/** [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
 *  how: Last enabled matching rule by ascending order wins; default visible when no rule matches; target file|directory|both gates entry type. */
export function evaluateEntryVisible(
  entry: ListingEntry,
  rules: DisplayFilterRule[],
): boolean {
  const sorted = [...rules].sort((a, b) => a.order - b.order);
  let lastAction: "include" | "exclude" | null = null;

  for (const rule of sorted) {
    if (!rule.enabled) continue;
    if (!targetMatches(entry, rule.target)) continue;
    if (!globMatch(entry.name, rule.pattern)) continue;
    lastAction = rule.action;
  }

  if (lastAction === "exclude") return false;
  if (lastAction === "include") return true;
  return true;
}

/** [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
 *  how: Filter raw directory listing; null spec returns all files with hiddenCount 0. */
export function filterFileStats(
  files: FileStat[],
  spec: DisplayFilterSpec | null | undefined,
): PaneListingApplyResult {
  if (!spec) {
    return { files, hiddenCount: 0 };
  }
  const visible = files.filter((f) =>
    evaluateEntryVisible({ name: f.name, isDirectory: f.isDirectory }, spec.rules),
  );
  return { files: visible, hiddenCount: files.length - visible.length };
}

/** [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
 *  how: Reject empty patterns and patterns that break globMatch probe. */
export function validateRulePattern(pattern: string): { ok: boolean; error?: string } {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return { ok: false, error: "Pattern cannot be empty" };
  }
  try {
    globMatch("", trimmed);
    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid glob pattern" };
  }
}

/** [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
 *  how: Enforce unique spec name (case-insensitive), max rules per spec, per-rule pattern validity. */
export function validateSpec(
  spec: Pick<DisplayFilterSpec, "name" | "rules">,
  existingNames: string[],
): SpecValidationResult {
  const errors: string[] = [];
  const name = spec.name.trim();
  if (!name) {
    errors.push("Spec name is required");
  }
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate && name) {
    errors.push(`A spec named "${name}" already exists`);
  }
  if (spec.rules.length > MAX_RULES_PER_SPEC) {
    errors.push(`Maximum ${MAX_RULES_PER_SPEC} rules per spec`);
  }
  for (const rule of spec.rules) {
    const v = validateRulePattern(rule.pattern);
    if (!v.ok) {
      errors.push(`Rule ${rule.order + 1}: ${v.error}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER] [REQ-FILE_MARKING_WEB]
 *  how: Drop marks not in visible files; clamp cursor to [0, files.length - 1] or 0 when empty. */
export function reconcilePaneSelection<T extends PaneListingState>(pane: T): T {
  const visibleNames = new Set(pane.files.map((f) => f.name));
  const marks = new Set<string>();
  for (const name of pane.marks) {
    if (visibleNames.has(name)) marks.add(name);
  }
  let cursor = pane.cursor;
  if (pane.files.length === 0) {
    cursor = 0;
  } else if (cursor < 0 || cursor >= pane.files.length) {
    cursor = Math.min(Math.max(0, cursor), pane.files.length - 1);
  }
  return { ...pane, marks, cursor };
}

/** Development Clean View example from product spec */
export function createDevelopmentCleanViewSpec(): DisplayFilterSpec {
  const now = new Date().toISOString();
  return {
    id: "preset-dev-clean",
    name: "Development Clean View",
    description: "Hide common build and VCS clutter",
    version: 1,
    createdAt: now,
    updatedAt: now,
    rules: [
      rule(0, "exclude", "directory", "node_modules"),
      rule(1, "exclude", "directory", ".git"),
      rule(2, "exclude", "file", "*.log"),
      rule(3, "exclude", "file", "*.tmp"),
      rule(4, "include", "file", "README.md"),
    ],
  };
}

function rule(
  order: number,
  action: "include" | "exclude",
  target: FilterRuleTarget,
  pattern: string,
): DisplayFilterRule {
  return {
    id: `rule-${order}`,
    action,
    target,
    pattern,
    order,
    enabled: true,
  };
}
