// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] TOOLBAR_COMPACT_TOGGLE

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolbarCompactToggle } from "./ToolbarCompactToggle";

describe("[REQ-TOOLBAR_SYSTEM] IMPL-TOOLBAR_COMPONENT_ToolbarCompactToggle", () => {
  it("exposes toolbar-compact-toggle test id and cycles on click", () => {
    const onCycle = vi.fn();
    render(<ToolbarCompactToggle mode="compact" onCycle={onCycle} />);

    const button = screen.getByTestId("toolbar-compact-toggle");
    fireEvent.click(button);
    expect(onCycle).toHaveBeenCalledTimes(1);
  });

  it("sets aria-pressed true only in compact mode", () => {
    const { rerender } = render(
      <ToolbarCompactToggle mode="compact" onCycle={vi.fn()} />,
    );
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(<ToolbarCompactToggle mode="expanded" onCycle={vi.fn()} />);
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    rerender(<ToolbarCompactToggle mode="named" onCycle={vi.fn()} />);
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("uses next-mode title and aria-label for each display mode", () => {
    const { rerender } = render(
      <ToolbarCompactToggle mode="compact" onCycle={vi.fn()} />,
    );
    let button = screen.getByTestId("toolbar-compact-toggle");
    expect(button).toHaveAttribute("title", "Expand toolbar");
    expect(button).toHaveAttribute("aria-label", "Expand toolbar");

    rerender(<ToolbarCompactToggle mode="expanded" onCycle={vi.fn()} />);
    button = screen.getByTestId("toolbar-compact-toggle");
    expect(button).toHaveAttribute("title", "Show action labels");
    expect(button).toHaveAttribute("aria-label", "Show action labels");

    rerender(<ToolbarCompactToggle mode="named" onCycle={vi.fn()} />);
    button = screen.getByTestId("toolbar-compact-toggle");
    expect(button).toHaveAttribute("title", "Compact toolbar");
    expect(button).toHaveAttribute("aria-label", "Compact toolbar");
    expect(button.getAttribute("title")).not.toMatch(/Ctrl|Shift|\+/);
  });

  it("exposes data-toolbar-display-mode for the current mode", () => {
    render(<ToolbarCompactToggle mode="named" onCycle={vi.fn()} />);
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "data-toolbar-display-mode",
      "named",
    );
  });
});
