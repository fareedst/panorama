// [TEST-MAKE_DIRECTORY] [IMPL-MAKE_DIRECTORY_DIALOG] [REQ-DIRECTORY_NAVIGATION]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MakeDirectoryDialog } from "./MakeDirectoryDialog";

describe("MakeDirectoryDialog [IMPL-MAKE_DIRECTORY_DIALOG]", () => {
  const defaultProps = {
    isOpen: true,
    initiatingPaneIndex: 0,
    paneCount: 2,
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders pane target group and directory name input", () => {
    render(<MakeDirectoryDialog {...defaultProps} />);
    expect(screen.getByTestId("make-in-this-pane")).toBeInTheDocument();
    expect(screen.getByTestId("make-in-all-panes")).toBeInTheDocument();
    expect(screen.getByTestId("make-directory-name-input")).toBeInTheDocument();
  });

  it("disables Apply when directory name is empty", () => {
    render(<MakeDirectoryDialog {...defaultProps} />);
    expect(screen.getByTestId("make-directory-apply")).toBeDisabled();
  });

  it("calls onApply with pane target and trimmed directory name", () => {
    const onApply = vi.fn();
    render(<MakeDirectoryDialog {...defaultProps} onApply={onApply} />);

    fireEvent.change(screen.getByTestId("make-directory-name-input"), {
      target: { value: "  newdir  " },
    });
    fireEvent.click(
      screen.getByTestId("make-in-all-panes").querySelector("input")!,
    );
    fireEvent.click(screen.getByTestId("make-directory-apply"));

    expect(onApply).toHaveBeenCalledWith({
      paneTarget: "allPanes",
      directoryName: "newdir",
    });
  });

  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — invalid basename disables Apply
  it("disables Apply when directory name fails validateRenameBasename", () => {
    render(<MakeDirectoryDialog {...defaultProps} />);
    fireEvent.change(screen.getByTestId("make-directory-name-input"), {
      target: { value: "bad/name" },
    });
    expect(screen.getByTestId("make-directory-apply")).toBeDisabled();
  });

  // [IMPL-MAKE_DIRECTORY_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — Escape calls onClose
  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<MakeDirectoryDialog {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("make-directory-dialog-overlay"), {
      key: "Escape",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
