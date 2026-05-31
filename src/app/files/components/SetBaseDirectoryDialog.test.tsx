// [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SetBaseDirectoryDialog } from "./SetBaseDirectoryDialog";

describe("SetBaseDirectoryDialog [IMPL-WORKSPACE_VIEW]", () => {
  const defaultProps = {
    isOpen: true,
    directoryPath: "/tmp/projects",
    initiatingPaneIndex: 0,
    paneCount: 3,
    allowPaneManagement: true,
    atMaxPanes: false,
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  // SetBaseDirectoryDialog — [IMPL-WORKSPACE_VIEW] [REQ-MOUSE_INTERACTION]: how — nine target buttons from copy labels with SetBaseDirectoryTargetIcon
  it("renders all nine target action buttons", () => {
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        labels={{
          setBaseInThisPane: "In this pane",
          setBaseInAllPanes: "In all panes",
          setBaseInOtherPanes: "In all other panes",
          setBaseInNextPane: "In the next pane",
          setBaseInNextPaneSwap: "In the next pane and swap pane position",
          setBaseInPriorPane: "In the prior pane",
          setBaseInPriorPaneSwap: "In the prior pane and swap pane position",
          setBaseInNewPane: "In a new pane",
          setBaseNewWorkspace: "In new workspace, as the only pane",
        }}
      />,
    );
    expect(screen.getByTestId("set-base-in-this-pane")).toHaveTextContent("In this pane");
    expect(screen.getByTestId("set-base-in-all-panes")).toHaveTextContent("In all panes");
    expect(screen.getByTestId("set-base-in-other-panes")).toHaveTextContent("In all other panes");
    expect(screen.getByTestId("set-base-in-next-pane")).toHaveTextContent("In the next pane");
    expect(screen.getByTestId("set-base-in-next-pane-swap")).toHaveTextContent(
      "In the next pane and swap pane position",
    );
    expect(screen.getByTestId("set-base-in-prior-pane")).toHaveTextContent("In the prior pane");
    expect(screen.getByTestId("set-base-in-prior-pane-swap")).toHaveTextContent(
      "In the prior pane and swap pane position",
    );
    expect(screen.getByTestId("set-base-in-new-pane")).toHaveTextContent(
      "In a new pane",
    );
    expect(screen.getByTestId("set-base-new-workspace")).toHaveTextContent(
      "In new workspace, as the only pane",
    );
  });

  // SetBaseDirectoryDialog — [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION]: how — each target button renders SetBaseDirectoryTargetIcon SVG
  it("renders an SVG icon for each target action button", () => {
    render(<SetBaseDirectoryDialog {...defaultProps} />);
    const testIds = [
      "set-base-in-this-pane",
      "set-base-in-all-panes",
      "set-base-in-other-panes",
      "set-base-in-next-pane",
      "set-base-in-next-pane-swap",
      "set-base-in-prior-pane",
      "set-base-in-prior-pane-swap",
      "set-base-in-new-pane",
      "set-base-new-workspace",
    ];
    for (const testId of testIds) {
      const button = screen.getByTestId(testId);
      expect(button.querySelector("svg")).toBeTruthy();
    }
  });

  // SetBaseDirectoryTargetIcon — [IMPL-WORKSPACE_VIEW] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — otherPanes icon uses initiating blue outline and target emerald fill roles
  it("renders multi-color semantic roles on otherPanes icon", () => {
    render(<SetBaseDirectoryDialog {...defaultProps} />);
    const svg = screen
      .getByTestId("set-base-in-other-panes")
      .querySelector("svg");
    expect(svg).toBeTruthy();
    const classNames = Array.from(svg!.querySelectorAll("[class]"))
      .map((el) => el.getAttribute("class") ?? "")
      .join(" ");
    expect(classNames).toMatch(/fill-emerald-500/);
    expect(classNames).toMatch(/stroke-blue-500/);
  });

  it("renders dialog with directory path", () => {
    render(<SetBaseDirectoryDialog {...defaultProps} />);
    expect(screen.getByTestId("set-base-directory-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("set-base-directory-path")).toHaveTextContent(
      "/tmp/projects",
    );
  });

  it("calls onApply and onClose when target selected", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("set-base-in-this-pane"));
    expect(onApply).toHaveBeenCalledWith("thisPane");
    expect(onClose).toHaveBeenCalled();
  });

  it("disables multi-pane targets when paneCount is 1", () => {
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        paneCount={1}
        initiatingPaneIndex={0}
      />,
    );
    expect(screen.getByTestId("set-base-in-other-panes")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-next-pane")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-this-pane")).not.toBeDisabled();
    expect(screen.getByTestId("set-base-in-new-pane")).not.toBeDisabled();
    expect(screen.getByTestId("set-base-new-workspace")).not.toBeDisabled();
  });

  it("disables new pane target when atMaxPanes", () => {
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        atMaxPanes={true}
      />,
    );
    expect(screen.getByTestId("set-base-in-new-pane")).toBeDisabled();
    expect(screen.getByTestId("set-base-new-workspace")).not.toBeDisabled();
  });

  it("disables swap and new pane targets when allowPaneManagement is false", () => {
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        allowPaneManagement={false}
      />,
    );
    expect(screen.getByTestId("set-base-in-next-pane-swap")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-prior-pane-swap")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-new-pane")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-next-pane")).not.toBeDisabled();
  });

  it("cancel closes without onApply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("set-base-directory-cancel"));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <SetBaseDirectoryDialog {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
