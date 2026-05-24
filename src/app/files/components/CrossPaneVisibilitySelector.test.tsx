// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_UI]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrossPaneVisibilitySelector } from "./CrossPaneVisibilitySelector";

describe("CrossPaneVisibilitySelector [IMPL-CROSS_PANE_VISIBILITY_UI]", () => {
  const presets = [
    {
      id: "preset-a",
      name: "Shared only",
      version: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      state: { toggles: { sharedAll: "include" as const }, sizeThreshold: null, timeThreshold: null },
    },
  ];

  // [IMPL-CROSS_PANE_VISIBILITY_UI] PANE_HEADER_SELECTOR: how: dropdown onSelect passes preset id
  it("PANE_HEADER_SELECTOR calls onSelect when preset chosen", () => {
    const onSelect = vi.fn();
    render(
      <CrossPaneVisibilitySelector
        presets={presets}
        activePresetId={null}
        recentPresetIds={[]}
        draftDirty={false}
        onSelect={onSelect}
        onManage={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByTestId("pane-cross-pane-visibility-selector"), {
      target: { value: "preset-a" },
    });
    expect(onSelect).toHaveBeenCalledWith("preset-a");
  });

  // [IMPL-CROSS_PANE_VISIBILITY_UI] PANE_HEADER_SELECTOR: how: Manage option opens manager dialog
  it("PANE_HEADER_SELECTOR opens manage flow on Manage compare filters option", () => {
    const onManage = vi.fn();
    render(
      <CrossPaneVisibilitySelector
        presets={presets}
        activePresetId="preset-a"
        recentPresetIds={["preset-a"]}
        draftDirty={false}
        onSelect={vi.fn()}
        onManage={onManage}
      />,
    );
    fireEvent.change(screen.getByTestId("pane-cross-pane-visibility-selector"), {
      target: { value: "__manage__" },
    });
    expect(onManage).toHaveBeenCalled();
  });
});
