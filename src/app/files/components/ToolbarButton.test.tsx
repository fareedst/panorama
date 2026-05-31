// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS]
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

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_NAMED_LABELS: visible label with icon when showActionLabel true
  it("shows visible label with icon when showActionLabel is true", () => {
    render(<ToolbarButton {...defaultProps} showActionLabel />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] TOOLBAR_NAMED_LABELS: hide keystroke badge in named mode while keeping tooltip shortcut
  it("hides keystroke badge in named mode while keeping tooltip", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        showActionLabel
        showKeystroke={false}
      />,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByTestId("toolbar-file.copy")).toHaveAttribute(
      "title",
      "Copy files (C)",
    );
  });

  it("omits keystroke from title and aria-label when keystroke is empty", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        action="view.columns"
        keystroke=""
        description="Reorder file columns"
      />,
    );
    const btn = screen.getByTestId("toolbar-view.columns");
    expect(btn).toHaveAttribute("title", "Reorder file columns");
    expect(btn).toHaveAttribute("aria-label", "Reorder file columns");
    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  it("does not render empty keystroke badge in expanded mode", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        action="view.columns"
        keystroke=""
        description="Reorder file columns"
        showKeystroke
      />,
    );
    const btn = screen.getByTestId("toolbar-view.columns");
    expect(btn.querySelector(".font-mono")).toBeNull();
  });

  // [ICON_REGISTRY] [REQ-NSYNC_MULTI_TARGET]: registered copy-all icon renders without icon-unknown fallback
  it("renders registered copy-all icon via Icon without fallback attribute", () => {
    render(
      <ToolbarButton
        {...defaultProps}
        action="file.copyAll"
        icon="copy-all"
        label="Copy to All"
        description="Copy to all panes"
      />,
    );
    const btn = screen.getByTestId("toolbar-file.copyAll");
    const svg = btn.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("data-icon-fallback")).toBeNull();
  });
});
