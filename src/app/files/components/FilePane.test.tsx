// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING]
// Tests for FilePane component

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilePane from "./FilePane";
import type { FileStat } from "@/lib/files.types";
import { DEFAULT_FILE_TYPES } from "@/lib/file-type-config";

describe("FilePane [REQ_FILE_LISTING]", () => {
  const mockFiles: FileStat[] = [
    {
      name: "Documents",
      path: "/home/user/Documents",
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-01-01"),
      extension: "",
    },
    {
      name: "file1.txt",
      path: "/home/user/file1.txt",
      isDirectory: false,
      size: 1024,
      mtime: new Date("2024-01-02"),
      extension: ".txt",
    },
    {
      name: "file2.md",
      path: "/home/user/file2.md",
      isDirectory: false,
      size: 2048,
      mtime: new Date("2024-01-03"),
      extension: ".md",
    },
  ];
  
  // [IMPL-FILE_COLUMN_CONFIG] [IMPL-FILE_AGE_DISPLAY] Mock column config
  const mockColumns = [
    { id: "mtime" as const, visible: true, format: "age" as const },
    { id: "size" as const, visible: true },
    { id: "name" as const, visible: true },
  ];
  const mockFileTypes = DEFAULT_FILE_TYPES;
  
  const mockBounds = { x: 0, y: 0, width: 400, height: 600 };
  const mockOnNavigate = vi.fn();
  const mockOnCursorMove = vi.fn();
  const mockOnToggleMark = vi.fn();
  
  it("should render file list", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    expect(screen.getByText("file2.md")).toBeInTheDocument();
  });
  
  it("should display current path in header", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    expect(screen.getByText("/home/user")).toBeInTheDocument();
  });
  
  it("should highlight cursor file", () => {
    const { rerender } = render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    // First file should have cursor highlight
    const firstFile = screen.getByText("Documents").closest("div");
    expect(firstFile).toHaveClass("bg-blue-100");
    
    // Move cursor to second file
    rerender(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={1}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const secondFile = screen.getByText("file1.txt").closest("div");
    expect(secondFile).toHaveClass("bg-blue-100");
  });
  
  it("should highlight marked files", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set(["/home/user/file1.txt"])}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const markedFile = screen.getByText("file1.txt").closest("div");
    expect(markedFile).toHaveClass("bg-yellow-100");
  });
  
  it("should show focus indicator when focused", () => {
    const { container, rerender } = render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const pane = container.firstChild as HTMLElement;
    expect(pane).toHaveClass("border-blue-500");
    
    // Unfocus
    rerender(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={false}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    expect(pane).toHaveClass("border-zinc-200");
  });
  
  it("should call onCursorMove when clicking a file", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const secondFile = screen.getByText("file1.txt").closest("div") as HTMLElement;
    fireEvent.click(secondFile);
    
    expect(mockOnCursorMove).toHaveBeenCalledWith(1);
  });
  
  const mockOnToggleExpand = vi.fn();
  
  it("should call onToggleExpand when double-clicking a directory", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onToggleExpand={mockOnToggleExpand}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const directory = screen.getByText("Documents").closest("div") as HTMLElement;
    fireEvent.doubleClick(directory);
    
    expect(mockOnToggleExpand).toHaveBeenCalledWith("/home/user/Documents");
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  // [IMPL-FILE_PANE] [IMPL-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: TREE_DEPTH_INDENT_CHEVRON — depth padding and expand indicator
  it("should render tree depth indent and expanded chevron on directory row [REQ-DIRECTORY_TREE]", () => {
    const treeFiles = [
      {
        ...mockFiles[0],
        depth: 1,
        isExpanded: true,
        hasLoadedChildren: true,
      },
    ];
    render(
      <FilePane
        path="/home/user"
        files={treeFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />,
    );

    expect(screen.getByText("▼")).toBeInTheDocument();
    const nameCell = screen.getByTestId("file-column-name");
    expect(nameCell.style.paddingLeft).toBe("24px");
  });
  
  it("should call onToggleMark when checking mark checkbox", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onToggleMark={mockOnToggleMark}
      />
    );
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Click checkbox for file1.txt
    
    expect(mockOnToggleMark).toHaveBeenCalledWith("/home/user/file1.txt");
  });
  
  it("should display empty message for empty directory", () => {
    render(
      <FilePane
        path="/home/user/empty"
        files={[]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    expect(screen.getByText("Empty directory")).toBeInTheDocument();
  });

  // [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED]: footer hidden when empty listing and no marks/hidden
  it("should not render footer when directory empty and no marks [REQ-FILE_SORTING_ADVANCED]", () => {
    render(
      <FilePane
        path="/home/user/empty"
        files={[]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />,
    );

    expect(screen.queryByText(/Sort:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });
  
  it("should display file count in footer", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={1}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
  
  it("should apply correct positioning from bounds", () => {
    const bounds = { x: 100, y: 200, width: 300, height: 400 };
    
    const { container } = render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={bounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const pane = container.firstChild as HTMLElement;
    expect(pane.style.left).toBe("100px");
    expect(pane.style.top).toBe("200px");
    expect(pane.style.width).toBe("300px");
    expect(pane.style.height).toBe("400px");
  });
  
  it("should distinguish directories visually", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />
    );
    
    const directoryName = screen.getByText("Documents");
    const directoryCell = directoryName.closest("[data-testid='file-column-name']");
    expect(directoryCell).toHaveClass("text-blue-600");
    expect(directoryCell).toHaveClass("font-semibold");
    
    const fileName = screen.getByText("file1.txt");
    const fileCell = fileName.closest("[data-testid='file-column-name']");
    expect(fileCell).toHaveClass("text-zinc-900");
  });

  // [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Focus request tests
  it("should call onFocusRequest when pane is clicked", () => {
    const mockOnFocusRequest = vi.fn();
    
    const { container } = render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={false}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onFocusRequest={mockOnFocusRequest}
      />
    );
    
    const pane = container.firstChild as HTMLElement;
    fireEvent.mouseDown(pane);
    
    expect(mockOnFocusRequest).toHaveBeenCalledTimes(1);
  });

  it("should call onFocusRequest when a file item is clicked (bubbling)", () => {
    const mockOnFocusRequest = vi.fn();
    
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={false}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onFocusRequest={mockOnFocusRequest}
      />
    );
    
    const secondFile = screen.getByText("file1.txt").closest("div") as HTMLElement;
    fireEvent.mouseDown(secondFile);
    
    expect(mockOnFocusRequest).toHaveBeenCalledTimes(1);
  });

  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Parent button tests
  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate
  it("should show Parent button when not at root [REQ-LINKED_PANES] [IMPL-LINKED_NAV]", () => {
    const mockOnNavigateParent = vi.fn();
    
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onNavigateParent={mockOnNavigateParent}
      />
    );
    
    expect(screen.getByLabelText("Parent directory")).toBeInTheDocument();
    expect(screen.getByText("..")).toBeInTheDocument();
  });

  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

  it("should hide Parent button when at root [REQ-LINKED_PANES] [IMPL-LINKED_NAV]", () => {
    const mockOnNavigateParent = vi.fn();
    
    render(
      <FilePane
        path="/"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onNavigateParent={mockOnNavigateParent}
      />
    );
    
    expect(screen.queryByLabelText("Parent directory")).not.toBeInTheDocument();
  });

  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

  it("should call onNavigateParent when Parent button is clicked [REQ-LINKED_PANES] [IMPL-LINKED_NAV]", () => {
    const mockOnNavigateParent = vi.fn();
    
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onNavigateParent={mockOnNavigateParent}
      />
    );
    
    const parentButton = screen.getByLabelText("Parent directory");
    fireEvent.click(parentButton);
    
    expect(mockOnNavigateParent).toHaveBeenCalledTimes(1);
  });

  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

  it("should show linked indicator when linked prop is true [REQ-LINKED_PANES] [IMPL-LINKED_NAV]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        linked={true}
      />
    );
    
    expect(screen.getByText("🔗")).toBeInTheDocument();
  });

  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: linkedMode boolean and syncingRef Set prevent recursive sync during handleNavigate

  it("should hide linked indicator when linked prop is false [REQ-LINKED_PANES] [IMPL-LINKED_NAV]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        linked={false}
      />
    );
    
    expect(screen.queryByText("🔗")).not.toBeInTheDocument();
  });

  it("PANE_HEADER_SELECTOR shows active spec name and hidden count [REQ-PANE_DISPLAY_FILTER] [IMPL-PANE_DISPLAY_FILTER_UI]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        onToggleMark={mockOnToggleMark}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        activeDisplaySpecId="spec-1"
        activeDisplaySpecName="No logs"
        hiddenCount={3}
        displaySpecs={[
          {
            id: "spec-1",
            name: "No logs",
            version: 1,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            rules: [],
          },
        ]}
        onDisplaySpecSelect={vi.fn()}
        onManageDisplaySpecs={vi.fn()}
      />,
    );

    expect(screen.getByText(/Filter: No logs/)).toBeInTheDocument();
    expect(screen.getByText(/Hidden: 3/)).toBeInTheDocument();
    expect(screen.getByTestId("pane-display-spec-selector")).toBeInTheDocument();
  });

  it("renders columns in configured order in grid [IMPL-FILE_COLUMN_CONFIG]", () => {
    const orderedColumns = [
      { id: "name" as const, visible: true },
      { id: "size" as const, visible: true },
      { id: "mtime" as const, visible: true, format: "age" as const },
    ];
    const { container } = render(
      <FilePane
        path="/home/user"
        files={[mockFiles[1]]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={orderedColumns}
        fileTypes={mockFileTypes}
      />,
    );
    const row = container.querySelector('[data-testid="file-row-grid"]');
    expect(row).toBeTruthy();
    const cells = row?.querySelectorAll("[data-testid^='file-column-']");
    expect(cells?.[0]).toHaveAttribute("data-testid", "file-column-name");
    expect(cells?.[1]).toHaveAttribute("data-testid", "file-column-size");
    expect(cells?.[2]).toHaveAttribute("data-testid", "file-column-mtime");
  });

  it("does not render column header row [IMPL-FILE_COLUMN_CONFIG]", () => {
    render(
      <FilePane
        path="/home/user"
        files={[mockFiles[1]]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />,
    );
    expect(screen.queryByTestId("file-row-grid-header")).not.toBeInTheDocument();
  });

  it("per-pane measure uses ch tracks for size and mtime [IMPL-FILE_COLUMN_CONFIG]", () => {
    const { container } = render(
      <FilePane
        path="/home/user"
        files={[mockFiles[1]]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />,
    );
    const row = container.querySelector('[data-testid="file-row-grid"]') as HTMLElement;
    expect(row.style.gridTemplateColumns).toMatch(/\d+ch/);
    expect(row.style.gridTemplateColumns).toContain("minmax(0, 1fr)");
  });

  it("uses injected metadataColumnWidths for grid tracks [IMPL-FILE_COLUMN_CONFIG]", () => {
    const { container } = render(
      <FilePane
        path="/home/user"
        files={[mockFiles[0]]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        metadataColumnWidths={{ size: 20, mtime: 22 }}
      />,
    );
    const row = container.querySelector('[data-testid="file-row-grid"]') as HTMLElement;
    expect(row.style.gridTemplateColumns).toBe("auto auto 22ch 20ch minmax(0, 1fr)");
  });

  // FILE_COLUMN_CONTEXT_MENU_WIRING — [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
  it("shows unified context menu with clipboard actions on file column right-click [REQ-MOUSE_INTERACTION]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        paneFilesList={[mockFiles]}
      />,
    );

    const nameCells = screen.getAllByTestId("file-column-name");
    fireEvent.contextMenu(nameCells[1]);

    expect(screen.getByTestId("file-column-context-menu")).toBeInTheDocument();
    expect(screen.getByTestId("file-column-copy-filename")).toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "File operations menu" })).toBeInTheDocument();
    expect(mockOnCursorMove).toHaveBeenCalledWith(1);
  });

  // Unified menu — column and row right-click share the same context menu
  it("column right-click opens the same file operations menu as row padding [REQ-MOUSE_INTERACTION]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        onCopy={vi.fn()}
        paneFilesList={[mockFiles]}
      />,
    );

    fireEvent.contextMenu(screen.getAllByTestId("file-column-size")[1]);

    expect(screen.getByTestId("file-column-context-menu")).toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "File operations menu" })).toBeInTheDocument();
  });

  // [REQ-CONFIG_DRIVEN_APPEARANCE] [IMPL-CONFIG_DRIVEN_APPEARANCE]
  it("renders theme file type icons for directories and files", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
      />,
    );

    const icons = screen.getAllByTestId("file-type-icon");
    expect(icons).toHaveLength(3);
    expect(icons[0]).toHaveTextContent("📁");
    expect(icons[1]).toHaveTextContent("📝");
    expect(icons[2]).toHaveTextContent("📝");
  });

  // [IMPL-RESPONSIVE_CLASSES]: pane shell stacks header list and footer in flex column with scrollable list region
  it("file_pane_uses_flex_col_layout_with_scrollable_list [IMPL-RESPONSIVE_CLASSES]", () => {
    const { container } = render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        data-testid="file-pane-responsive"
      />,
    );

    const pane = screen.getByTestId("file-pane-responsive");
    expect(pane.className).toMatch(/flex flex-col/);

    const fileListRegion = container.querySelector(".flex-1.overflow-y-auto");
    expect(fileListRegion).not.toBeNull();
    expect(screen.getByTestId("file-list-table").parentElement).toBe(fileListRegion);
  });

  // [IMPL-FILE_PANE] [IMPL-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING]: how — footer segment with compact format, aria-label, status variants; empty dir shows capacity
  it("RENDER_PANE_VOLUME_STATS shows compact capacity and accessible values [REQ-PANE_VOLUME_CAPACITY]", () => {
    render(
      <FilePane
        path="/home/user"
        files={mockFiles}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        volumeStats={{
          totalBytes: 1_000_000_000,
          availableBytes: 412_000_000,
          freePercent: 41.2,
          deviceId: 1,
          sourcePath: "/home/user",
          status: "available",
        }}
      />,
    );

    expect(screen.getByTestId("pane-volume-stats")).toHaveTextContent("Free");
    expect(screen.getByTestId("pane-volume-stats")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Available:"),
    );
  });

  // [IMPL-FILE_PANE] [IMPL-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING]: how — footer segment with compact format, aria-label, status variants; empty dir shows capacity
  it("FOOTER_VISIBILITY_INCLUDES_CAPACITY shows unavailable state for empty directories [REQ-PANE_VOLUME_CAPACITY]", () => {
    render(
      <FilePane
        path="/home/user/empty"
        files={[]}
        cursor={0}
        marks={new Set()}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
        columns={mockColumns}
        fileTypes={mockFileTypes}
        volumeStats={{
          totalBytes: 0,
          availableBytes: 0,
          freePercent: 0,
          deviceId: null,
          sourcePath: "/home/user/empty",
          status: "unavailable",
          errorCode: "STAT_FAILED",
        }}
      />,
    );

    expect(screen.getByTestId("pane-volume-stats-unavailable")).toHaveTextContent(
      "Storage: unavailable",
    );
  });

  // [RENDER_ARCHIVE_READ_ONLY] [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILE_PANE] [IMPL-ARCHIVE_DIRECTORY_PANES]
  describe("archive read-only presentation [REQ-ARCHIVE_DIRECTORY_PANES]", () => {
    const archiveLocator =
      "@archive/v1/eyJhIjoiL2Rvd25sb2Fkcy9zYW1wbGUuemlwIiwiZSI6IiJ9";
    const archiveEntry: FileStat = {
      name: "readme.txt",
      path: `${archiveLocator}-entry`,
      isDirectory: false,
      size: 12,
      mtime: new Date("2024-01-01"),
      extension: "txt",
      archiveSource: {
        archivePath: "/downloads/sample.zip",
        entryPath: "readme.txt",
        isArchiveRoot: false,
        isVirtual: true,
        format: "zip",
        readOnly: true,
      },
    };

    it("shows Archive header label and pane-archive-readonly badge", () => {
      render(
        <FilePane
          path={archiveLocator}
          files={[archiveEntry]}
          cursor={0}
          marks={new Set()}
          bounds={mockBounds}
          focused={true}
          isArchiveReadOnly
          onNavigate={mockOnNavigate}
          onCursorMove={mockOnCursorMove}
          columns={mockColumns}
          fileTypes={mockFileTypes}
        />,
      );

      expect(screen.getByTestId("pane-archive-readonly")).toHaveTextContent("Archive");
      expect(screen.getByText(/Archive: sample\.zip/)).toBeInTheDocument();
    });

    it("shows Extract in context menu and hides Delete for archive file rows", () => {
      render(
        <FilePane
          path={archiveLocator}
          files={[archiveEntry]}
          cursor={0}
          marks={new Set()}
          bounds={mockBounds}
          focused={true}
          isArchiveReadOnly
          onNavigate={mockOnNavigate}
          onCursorMove={mockOnCursorMove}
          onCopy={vi.fn()}
          onMove={vi.fn()}
          onDelete={vi.fn()}
          onRename={vi.fn()}
          onExtract={vi.fn()}
          columns={mockColumns}
          fileTypes={mockFileTypes}
        />,
      );

      fireEvent.contextMenu(screen.getByText("readme.txt"));

      expect(screen.getByTestId("archive-extract-menu-item")).toBeInTheDocument();
      expect(screen.queryByText(/^Delete/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Move/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Copy \(/)).not.toBeInTheDocument();
    });

    it("disables row drag when isArchiveReadOnly", () => {
      const { container } = render(
        <FilePane
          path={archiveLocator}
          files={[archiveEntry]}
          cursor={0}
          marks={new Set()}
          bounds={mockBounds}
          focused={true}
          isArchiveReadOnly
          onNavigate={mockOnNavigate}
          onCursorMove={mockOnCursorMove}
          columns={mockColumns}
          fileTypes={mockFileTypes}
        />,
      );

      const row = container.querySelector('[data-testid="file-row-grid"]');
      expect(row?.getAttribute("draggable")).toBe("false");
    });

    it("shows empty archive directory message with read-only chrome", () => {
      render(
        <FilePane
          path={archiveLocator}
          files={[]}
          cursor={0}
          marks={new Set()}
          bounds={mockBounds}
          focused={true}
          isArchiveReadOnly
          onNavigate={mockOnNavigate}
          onCursorMove={mockOnCursorMove}
          columns={mockColumns}
          fileTypes={mockFileTypes}
          volumeStats={{
            totalBytes: 1000,
            availableBytes: 500,
            freePercent: 50,
            deviceId: 1,
            sourcePath: "/downloads/sample.zip",
            status: "available",
          }}
        />,
      );

      expect(screen.getByText("Empty archive directory")).toBeInTheDocument();
      expect(screen.getByTestId("pane-archive-readonly")).toBeInTheDocument();
    });
  });
});
