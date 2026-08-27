// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockFiles: FileStat[] = [
  {
    name: "a.txt",
    path: "/test/a.txt",
    isDirectory: false,
    size: 100,
    mtime: new Date("2024-01-01"),
    extension: "txt",
  },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [
  { id: "mtime" as const, visible: true, format: "age" as const },
  { id: "size" as const, visible: true },
  { id: "name" as const, visible: true },
];

const mockCopy = {
  title: "File Manager",
  subtitle: "Browse",
};

describe("WorkspaceView flex layout [IMPL-FLEX_LAYOUT] [REQ-ROOT_LAYOUT]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-FLEX_LAYOUT]: workspace shell uses flex-col full-height wrapper and flex-1 min-h-0 workspace area
  it("workspace_shell_uses_flex_col_and_flex_1_workspace_area [IMPL-FLEX_LAYOUT]", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/test", files: mockFiles }]}
        keybindings={[]}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    const workspaceArea = screen.getByTestId("workspace-area");
    expect(workspaceArea.className).toMatch(/flex-1/);
    expect(workspaceArea.className).toMatch(/min-h-0/);

    const rootShell = workspaceArea.parentElement;
    expect(rootShell?.className).toMatch(/h-screen/);
    expect(rootShell?.className).toMatch(/flex flex-col/);
  });

  // [IMPL-FLEX_LAYOUT]: header toolbar row uses flex items-center justify-between
  it("workspace_header_uses_flex_row_alignment [IMPL-FLEX_LAYOUT]", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/test", files: mockFiles }]}
        keybindings={[]}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    const headerRow = screen.getByRole("heading", { name: "File Manager" }).parentElement
      ?.parentElement;
    expect(headerRow?.className).toMatch(/flex/);
    expect(headerRow?.className).toMatch(/items-center/);
    expect(headerRow?.className).toMatch(/justify-between/);
  });
});
