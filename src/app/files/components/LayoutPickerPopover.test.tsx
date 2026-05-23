// [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [IMPL-WORKSPACE_VIEW]: LayoutPickerPopover composition tests

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LayoutPickerPopover } from "./LayoutPickerPopover";

describe("LayoutPickerPopover [REQ-MULTI_PANE_LAYOUT]", () => {
  // [IMPL-WORKSPACE_VIEW] [REQ-TOOLBAR_SYSTEM] LAYOUT_TOOLBAR_PICKER — highlights current layout option
  it("highlights current layout and calls onSelect on option click", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <LayoutPickerPopover
        isOpen
        currentLayout="OneRow"
        labels={{ oneRow: "One Row" }}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    const selected = screen.getByTestId("workspace-layout-option-OneRow");
    expect(selected.className).toMatch(/bg-blue/);
    fireEvent.click(screen.getByTestId("workspace-layout-option-Tile"));
    expect(onSelect).toHaveBeenCalledWith("Tile");
    expect(onClose).toHaveBeenCalled();
  });

  // [IMPL-WORKSPACE_VIEW] [REQ-KEYBOARD_NAVIGATION] LAYOUT_TOOLBAR_PICKER — Escape closes without select
  it("closes on Escape without selecting", () => {
    const onClose = vi.fn();
    render(
      <LayoutPickerPopover
        isOpen
        currentLayout="Tile"
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  // [IMPL-WORKSPACE_VIEW] LAYOUT_TOOLBAR_PICKER — overlay click closes
  it("closes when overlay is clicked", () => {
    const onClose = vi.fn();
    render(
      <LayoutPickerPopover
        isOpen
        currentLayout="Tile"
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("workspace-layout-picker-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <LayoutPickerPopover
        isOpen={false}
        currentLayout="Tile"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
