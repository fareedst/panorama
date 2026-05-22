// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT]
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolbarButton } from "./ToolbarButton";

describe("[REQ-TOOLBAR_SYSTEM] ToolbarButton", () => {
  const defaultProps = {
    action: "file.copy",
    icon: "copy",
    label: "Copy",
    keystroke: "C",
    description: "Copy files",
    onClick: vi.fn(),
  };

  it("shows keystroke badge by default", () => {
    render(<ToolbarButton {...defaultProps} />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("hides keystroke badge when showKeystroke is false", () => {
    render(<ToolbarButton {...defaultProps} showKeystroke={false} />);
    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  it("keeps tooltip with keystroke when showKeystroke is false", () => {
    render(<ToolbarButton {...defaultProps} showKeystroke={false} />);
    expect(screen.getByTestId("toolbar-file.copy")).toHaveAttribute(
      "title",
      "Copy files (C)",
    );
  });
});
