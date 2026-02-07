// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING]
// Tests for FilePane component

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilePane from "./FilePane";
import type { FileStat } from "@/lib/files.types";

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
        marks={new Set(["file1.txt"])}
        bounds={mockBounds}
        focused={true}
        onNavigate={mockOnNavigate}
        onCursorMove={mockOnCursorMove}
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
      />
    );
    
    const secondFile = screen.getByText("file1.txt").closest("div") as HTMLElement;
    fireEvent.click(secondFile);
    
    expect(mockOnCursorMove).toHaveBeenCalledWith(1);
  });
  
  it("should call onNavigate when double-clicking a directory", () => {
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
      />
    );
    
    const directory = screen.getByText("Documents").closest("div") as HTMLElement;
    fireEvent.doubleClick(directory);
    
    expect(mockOnNavigate).toHaveBeenCalledWith("/home/user/Documents");
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
        onToggleMark={mockOnToggleMark}
      />
    );
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Click checkbox for file1.txt
    
    expect(mockOnToggleMark).toHaveBeenCalledWith("file1.txt");
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
      />
    );
    
    expect(screen.getByText("Empty directory")).toBeInTheDocument();
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
      />
    );
    
    const directoryName = screen.getByText("Documents");
    expect(directoryName).toHaveClass("text-blue-600");
    expect(directoryName).toHaveClass("font-semibold");
    
    const fileName = screen.getByText("file1.txt");
    expect(fileName).toHaveClass("text-zinc-900");
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
        onFocusRequest={mockOnFocusRequest}
      />
    );
    
    const secondFile = screen.getByText("file1.txt").closest("div") as HTMLElement;
    fireEvent.mouseDown(secondFile);
    
    expect(mockOnFocusRequest).toHaveBeenCalledTimes(1);
  });
});
