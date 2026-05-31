// [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RenameRegexDialog } from "./RenameRegexDialog";
import type { FileStat } from "@/lib/files.types";

const file: FileStat = {
  name: "sample.txt",
  path: "/tmp/sample.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

describe("RenameRegexDialog [IMPL-RENAME_REGEX_DIALOG]", () => {
  const defaultProps = {
    isOpen: true,
    initiatingPaneIndex: 0,
    paneCount: 2,
    file,
    marksAtOpen: new Set<string>(),
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders pane target and pattern fields", () => {
    render(<RenameRegexDialog {...defaultProps} />);
    expect(screen.getByTestId("rename-regex-in-this-pane")).toBeInTheDocument();
    expect(screen.getByTestId("rename-regex-in-all-panes")).toBeInTheDocument();
    expect(screen.getByTestId("rename-regex-match")).toBeInTheDocument();
    expect(screen.getByTestId("rename-regex-replacement")).toBeInTheDocument();
  });

  it("shows marked file count in header", () => {
    render(
      <RenameRegexDialog
        {...defaultProps}
        marksAtOpen={new Set(["a.txt", "b.txt"])}
      />,
    );
    expect(screen.getByTestId("rename-regex-target")).toHaveTextContent(
      "2 marked file(s)",
    );
  });

  it("calls onApply with selections when Apply clicked", () => {
    const onApply = vi.fn();
    render(<RenameRegexDialog {...defaultProps} onApply={onApply} />);
    fireEvent.click(
      screen.getByTestId("rename-regex-in-all-panes").querySelector("input")!,
    );
    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "\\.txt$" },
    });
    fireEvent.change(screen.getByTestId("rename-regex-replacement"), {
      target: { value: ".bak" },
    });
    fireEvent.click(screen.getByTestId("rename-regex-apply"));
    expect(onApply).toHaveBeenCalledWith({
      paneTarget: "allPanes",
      matchPattern: "\\.txt$",
      replacement: ".bak",
    });
  });

  it("disables Apply until match pattern is valid", () => {
    render(<RenameRegexDialog {...defaultProps} />);
    expect(screen.getByTestId("rename-regex-apply")).toBeDisabled();
    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "(" },
    });
    expect(screen.getByTestId("rename-regex-apply")).toBeDisabled();
    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "\\.txt$" },
    });
    expect(screen.getByTestId("rename-regex-apply")).not.toBeDisabled();
  });
});
