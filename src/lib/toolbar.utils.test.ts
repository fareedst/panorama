// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] MERGE_TOP_TOOLBARS
import { describe, it, expect } from "vitest";
import { mergeTopToolbarConfigs } from "./toolbar.utils";
import type { ToolbarsConfig } from "./config.types";

function makeTier(
  enabled: boolean,
  position: "top" | "bottom" | "hidden" | "per-pane",
  name: string,
  actions: string[],
) {
  return {
    enabled,
    position,
    groups: [{ name, actions }],
  };
}

describe("[REQ-TOOLBAR_SYSTEM] IMPL-TOOLBAR_COMPONENT_MergeTopToolbars", () => {
  it("concatenates enabled top-position tiers in workspace → pane → system order", () => {
    const toolbars: ToolbarsConfig = {
      enabled: true,
      workspace: makeTier(true, "top", "Layout", ["view.sort"]),
      pane: makeTier(true, "top", "File Operations", ["file.copy"]),
      system: makeTier(true, "top", "System", ["help.show"]),
    };

    const merged = mergeTopToolbarConfigs(toolbars);

    expect(merged).not.toBeNull();
    expect(merged!.enabled).toBe(true);
    expect(merged!.position).toBe("top");
    expect(merged!.groups.map((g) => g.name)).toEqual([
      "Layout",
      "File Operations",
      "System",
    ]);
    expect(merged!.groups.flatMap((g) => g.actions)).toEqual([
      "view.sort",
      "file.copy",
      "help.show",
    ]);
  });

  it("skips disabled tiers and non-top positions", () => {
    const toolbars: ToolbarsConfig = {
      enabled: true,
      workspace: makeTier(false, "top", "Layout", ["view.sort"]),
      pane: makeTier(true, "bottom", "File Operations", ["file.copy"]),
      system: makeTier(true, "top", "System", ["help.show"]),
    };

    const merged = mergeTopToolbarConfigs(toolbars);

    expect(merged).not.toBeNull();
    expect(merged!.groups).toHaveLength(1);
    expect(merged!.groups[0].name).toBe("System");
  });

  it("returns null when no enabled top-position tiers exist", () => {
    const toolbars: ToolbarsConfig = {
      enabled: true,
      workspace: makeTier(true, "hidden", "Layout", ["view.sort"]),
      pane: makeTier(false, "top", "File Operations", ["file.copy"]),
      system: makeTier(true, "bottom", "System", ["help.show"]),
    };

    expect(mergeTopToolbarConfigs(toolbars)).toBeNull();
  });
});
