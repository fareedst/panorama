// [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TouchFileDialog, parseSpecifiedMtime } from "./TouchFileDialog";
import type { FileStat } from "@/lib/files.types";

const file: FileStat = {
  name: "sample.txt",
  path: "/tmp/sample.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

const sharedPanes: FileStat[][] = [
  [file],
  [
    {
      ...file,
      path: "/other/sample.txt",
      mtime: new Date("2024-06-01T00:00:00.000Z"),
    },
  ],
];

describe("parseSpecifiedMtime [IMPL-TOUCH_DIALOG]", () => {
  it("parses local wall time", () => {
    const d = parseSpecifiedMtime("2025-03-15T14:30", "local");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(14);
    expect(d!.getMinutes()).toBe(30);
  });

  it("parses UTC wall time", () => {
    const d = parseSpecifiedMtime("2025-03-15T14:30", "utc");
    expect(d?.toISOString()).toBe("2025-03-15T14:30:00.000Z");
  });
});

describe("TouchFileDialog [IMPL-TOUCH_DIALOG]", () => {
  const defaultProps = {
    isOpen: true,
    initiatingPaneIndex: 0,
    paneCount: 2,
    file,
    marksAtOpen: new Set<string>(),
    paneFilesList: sharedPanes,
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders pane target and mtime mode groups", () => {
    render(<TouchFileDialog {...defaultProps} />);
    expect(screen.getByTestId("touch-in-this-pane")).toBeInTheDocument();
    expect(screen.getByTestId("touch-in-all-panes")).toBeInTheDocument();
    expect(screen.getByTestId("touch-mtime-now")).toBeInTheDocument();
    expect(screen.getByTestId("touch-mtime-specified")).toBeInTheDocument();
    expect(screen.getByTestId("touch-mtime-earliest")).toBeInTheDocument();
    expect(screen.getByTestId("touch-mtime-latest")).toBeInTheDocument();
  });

  it("disables earliest/latest when basename is not shared", () => {
    render(
      <TouchFileDialog
        {...defaultProps}
        file={{ ...file, name: "unique.txt", path: "/tmp/unique.txt" }}
        paneFilesList={[[{ ...file, name: "unique.txt", path: "/tmp/unique.txt" }], []]}
      />,
    );
    expect(screen.getByTestId("touch-mtime-earliest").querySelector("input")).toBeDisabled();
    expect(screen.getByTestId("touch-mtime-latest").querySelector("input")).toBeDisabled();
  });

  it("shows marked file count in header", () => {
    render(
      <TouchFileDialog
        {...defaultProps}
        marksAtOpen={new Set(["a.txt", "b.txt"])}
      />,
    );
    expect(screen.getByTestId("touch-file-target")).toHaveTextContent(
      "2 marked file(s)",
    );
  });

  it("calls onApply with selections when Apply clicked", () => {
    const onApply = vi.fn();
    render(<TouchFileDialog {...defaultProps} onApply={onApply} />);
    fireEvent.click(screen.getByTestId("touch-in-all-panes").querySelector("input")!);
    fireEvent.click(screen.getByTestId("touch-mtime-latest").querySelector("input")!);
    fireEvent.click(screen.getByTestId("touch-file-apply"));
    expect(onApply).toHaveBeenCalledWith({
      paneTarget: "allPanes",
      mtimeMode: "latest",
      specifiedDate: null,
    });
  });

  it("disables Apply until specified datetime is valid", () => {
    render(<TouchFileDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId("touch-mtime-specified").querySelector("input")!);
    expect(screen.getByTestId("touch-file-apply")).toBeDisabled();
    fireEvent.change(screen.getByTestId("touch-specified-datetime"), {
      target: { value: "2026-01-02T10:00" },
    });
    expect(screen.getByTestId("touch-file-apply")).not.toBeDisabled();
  });
});
