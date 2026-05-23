// [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_FILTER_ENGINE]

import { describe, it, expect } from "vitest";
import {
  createDevelopmentCleanViewSpec,
  evaluateEntryVisible,
  filterFileStats,
  reconcilePaneSelection,
  validateRulePattern,
} from "./display-filter-engine";
import type { FileStat } from "./files.types";

function file(name: string, isDirectory = false): FileStat {
  return {
    name,
    path: `/tmp/${name}`,
    isDirectory,
    size: 0,
    mtime: new Date(),
    extension: isDirectory ? "" : name.includes(".") ? name.slice(name.lastIndexOf(".")) : "",
  };
}

describe("display-filter-engine [IMPL-DISPLAY_FILTER_ENGINE]", () => {
  it("APPLY_PANE_LISTING Development Clean View hides node_modules and logs, keeps README", () => {
    const spec = createDevelopmentCleanViewSpec();
    const files = [
      file("README.md"),
      file("app.log"),
      file("node_modules", true),
      file(".git", true),
      file("main.tmp"),
    ];
    const { files: visible, hiddenCount } = filterFileStats(files, spec);
    expect(visible.map((f) => f.name)).toEqual(["README.md"]);
    expect(hiddenCount).toBe(4);
  });

  it("EVALUATE_ENTRY last matching rule wins for include after exclude", () => {
    const spec = createDevelopmentCleanViewSpec();
    expect(evaluateEntryVisible({ name: "README.md", isDirectory: false }, spec.rules)).toBe(
      true,
    );
    expect(evaluateEntryVisible({ name: "app.log", isDirectory: false }, spec.rules)).toBe(false);
  });

  it("directory-only rule does not match files", () => {
    const spec = createDevelopmentCleanViewSpec();
    const nodeRule = spec.rules.find((r) => r.pattern === "node_modules")!;
    expect(
      evaluateEntryVisible({ name: "node_modules", isDirectory: false }, [nodeRule]),
    ).toBe(true);
    expect(
      evaluateEntryVisible({ name: "node_modules", isDirectory: true }, [nodeRule]),
    ).toBe(false);
  });

  it("disabled rules are ignored", () => {
    const spec = createDevelopmentCleanViewSpec();
    const rules = spec.rules.map((r) =>
      r.pattern === "*.log" ? { ...r, enabled: false } : r,
    );
    expect(evaluateEntryVisible({ name: "app.log", isDirectory: false }, rules)).toBe(true);
  });

  it("RECONCILE_PANE_SELECTION drops hidden marks and clamps cursor", () => {
    const pane = reconcilePaneSelection({
      files: [file("a"), file("b")],
      cursor: 5,
      marks: new Set(["a", "gone"]),
    });
    expect(pane.marks).toEqual(new Set(["a"]));
    expect(pane.cursor).toBe(1);
  });

  it("VALIDATE_RULE_PATTERN rejects empty pattern", () => {
    expect(validateRulePattern("  ").ok).toBe(false);
  });

  it("null spec returns all files", () => {
    const files = [file("a")];
    expect(filterFileStats(files, null).files).toHaveLength(1);
  });
});
