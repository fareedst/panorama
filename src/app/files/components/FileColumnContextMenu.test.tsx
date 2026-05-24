// [TEST-MOUSE_INTERACTION] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]
// FILE_COLUMN_CONTEXT_MENU — how: component unit tests for clipboard menu actions and disabled cross-pane state

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FileColumnContextMenu from "./FileColumnContextMenu";
import type { FileStat } from "@/lib/files.types";

describe("[TEST-MOUSE_INTERACTION] FILE_COLUMN_CONTEXT_MENU", () => {
  const mockFile: FileStat = {
    name: "shared.txt",
    path: "/left/shared.txt",
    size: 10,
    mtime: new Date(),
    isDirectory: false,
    extension: ".txt",
  };

  const paneFilesList: FileStat[][] = [
    [mockFile],
    [
      {
        name: "other.md",
        path: "/right/other.md",
        size: 1,
        mtime: new Date(),
        isDirectory: false,
        extension: ".md",
      },
      {
        name: "shared.txt",
        path: "/right/shared.txt",
        size: 10,
        mtime: new Date(),
        isDirectory: false,
        extension: ".txt",
      },
    ],
  ];

  const copyText = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders file column context menu", () => {
    render(
      <FileColumnContextMenu
        x={100}
        y={120}
        file={mockFile}
        paneFilesList={paneFilesList}
        onClose={onClose}
        copyText={copyText}
      />,
    );
    expect(screen.getByTestId("file-column-context-menu")).toBeInTheDocument();
    expect(screen.getByText("shared.txt")).toBeInTheDocument();
  });

  it("copies cursor filename on Copy filename", async () => {
    render(
      <FileColumnContextMenu
        x={100}
        y={120}
        file={mockFile}
        paneFilesList={paneFilesList}
        onClose={onClose}
        copyText={copyText}
      />,
    );
    fireEvent.click(screen.getByTestId("file-column-copy-filename"));
    expect(copyText).toHaveBeenCalledWith("shared.txt");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("copies absolute path on Copy path", async () => {
    render(
      <FileColumnContextMenu
        x={100}
        y={120}
        file={mockFile}
        paneFilesList={paneFilesList}
        onClose={onClose}
        copyText={copyText}
      />,
    );
    fireEvent.click(screen.getByTestId("file-column-copy-path"));
    expect(copyText).toHaveBeenCalledWith("/left/shared.txt");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("copies cross-pane paths when name exists in multiple panes", async () => {
    render(
      <FileColumnContextMenu
        x={100}
        y={120}
        file={mockFile}
        paneFilesList={paneFilesList}
        onClose={onClose}
        copyText={copyText}
      />,
    );
    fireEvent.click(screen.getByTestId("file-column-copy-cross-pane-paths"));
    expect(copyText).toHaveBeenCalledWith(
      "Pane 1: /left/shared.txt\nPane 2: /right/shared.txt",
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("disables cross-pane action when name missing from all pane listings", () => {
    render(
      <FileColumnContextMenu
        x={100}
        y={120}
        file={mockFile}
        paneFilesList={[[]]}
        onClose={onClose}
        copyText={copyText}
      />,
    );
    expect(screen.getByTestId("file-column-copy-cross-pane-paths")).toBeDisabled();
  });
});
