// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] TOOLBAR_COMPACT_TOGGLE

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolbarCompactToggle } from "./ToolbarCompactToggle";

describe("[REQ-TOOLBAR_SYSTEM] IMPL-TOOLBAR_COMPONENT_ToolbarCompactToggle", () => {
  it("exposes toolbar-compact-toggle test id and toggles on click", () => {
    const onToggle = vi.fn();
    render(<ToolbarCompactToggle expanded onToggle={onToggle} />);

    const button = screen.getByTestId("toolbar-compact-toggle");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("sets aria-pressed false when expanded and true when compact", () => {
    const { rerender } = render(
      <ToolbarCompactToggle expanded onToggle={vi.fn()} />,
    );
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    rerender(<ToolbarCompactToggle expanded={false} onToggle={vi.fn()} />);
    expect(screen.getByTestId("toolbar-compact-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses keystroke-free title and aria-label", () => {
    render(<ToolbarCompactToggle expanded onToggle={vi.fn()} />);
    const button = screen.getByTestId("toolbar-compact-toggle");
    expect(button).toHaveAttribute("title", "Compact toolbar");
    expect(button).toHaveAttribute("aria-label", "Compact toolbar");
    expect(button.getAttribute("title")).not.toMatch(/Ctrl|Shift|\+/);
  });
});
