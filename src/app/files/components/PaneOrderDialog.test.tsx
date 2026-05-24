// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaneOrderDialog } from "./PaneOrderDialog";

describe("PaneOrderDialog [IMPL-PANE_MANAGEMENT]", () => {
  const panes = [{ path: "/pane0" }, { path: "/pane1" }, { path: "/pane2" }];

  it("cancel closes without calling onApply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <PaneOrderDialog
        isOpen
        panes={panes}
        focusIndex={1}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("reorders panes on apply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <PaneOrderDialog
        isOpen
        panes={panes}
        focusIndex={1}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("pane-order-down-0"));
    fireEvent.click(screen.getByTestId("pane-order-apply"));
    expect(onApply).toHaveBeenCalledWith([1, 0, 2]);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows focused badge on focused pane", () => {
    render(
      <PaneOrderDialog
        isOpen
        panes={panes}
        focusIndex={1}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("focused")).toBeInTheDocument();
  });
});
