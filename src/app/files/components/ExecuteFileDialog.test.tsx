// [TEST-PANE_COMMAND_EXEC] [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExecuteFileDialog } from "./ExecuteFileDialog";
import type { FileStat } from "@/lib/files.types";

const file: FileStat = {
  name: "sample.txt",
  path: "/tmp/sample.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

describe("ExecuteFileDialog [IMPL-EXECUTE_DIALOG]", () => {
  const defaultProps = {
    isOpen: true,
    initiatingPaneIndex: 0,
    paneCount: 2,
    file,
    marksAtOpen: new Set<string>(),
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders pane target group and command input", () => {
    render(<ExecuteFileDialog {...defaultProps} />);
    expect(screen.getByTestId("execute-in-this-pane")).toBeInTheDocument();
    expect(screen.getByTestId("execute-in-all-panes")).toBeInTheDocument();
    expect(screen.getByTestId("execute-command-input")).toBeInTheDocument();
  });

  it("disables Apply when command is empty", () => {
    render(<ExecuteFileDialog {...defaultProps} />);
    expect(screen.getByTestId("execute-file-apply")).toBeDisabled();
  });

  it("calls onApply with pane target and trimmed command", () => {
    const onApply = vi.fn();
    render(<ExecuteFileDialog {...defaultProps} onApply={onApply} />);

    fireEvent.change(screen.getByTestId("execute-command-input"), {
      target: { value: "  echo $FILE  " },
    });
    fireEvent.click(
      screen.getByTestId("execute-in-all-panes").querySelector("input")!,
    );
    fireEvent.click(screen.getByTestId("execute-file-apply"));

    expect(onApply).toHaveBeenCalledWith({
      paneTarget: "allPanes",
      command: "echo $FILE",
    });
  });

  it("shows marked file count in header", () => {
    render(
      <ExecuteFileDialog
        {...defaultProps}
        marksAtOpen={new Set(["a.txt", "b.txt"])}
      />,
    );
    expect(screen.getByTestId("execute-file-target")).toHaveTextContent(
      "2 marked file(s)",
    );
  });
});
