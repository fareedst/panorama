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
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  // SetBaseDirectoryDialog — [IMPL-WORKSPACE_VIEW] [REQ-MOUSE_INTERACTION]: how — eight target buttons from copy labels
  it("renders all eight target action buttons", () => {
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
    expect(screen.getByTestId("set-base-new-workspace")).toHaveTextContent(
      "In new workspace, as the only pane",
    );
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
    expect(screen.getByTestId("set-base-new-workspace")).not.toBeDisabled();
  });

  it("disables swap targets when allowPaneManagement is false", () => {
    render(
      <SetBaseDirectoryDialog
        {...defaultProps}
        allowPaneManagement={false}
      />,
    );
    expect(screen.getByTestId("set-base-in-next-pane-swap")).toBeDisabled();
    expect(screen.getByTestId("set-base-in-prior-pane-swap")).toBeDisabled();
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
