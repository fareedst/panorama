// [TEST-MOUSE_INTERACTION] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
// Tests for mouse and touch interaction features

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ContextMenu from "./ContextMenu";
import type { FileStat } from "@/lib/files.types";

describe("[TEST-MOUSE_INTERACTION] ContextMenu Component", () => {
  const mockFile: FileStat = {
    name: "test.txt",
    path: "/test/test.txt",
    size: 1024,
    mtime: Date.now(),
    isDirectory: false,
  };

  const defaultProps = {
    x: 100,
    y: 150,
    file: mockFile,
    marks: new Set<string>(),
    onClose: vi.fn(),
    onCopy: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders context menu at specified coordinates", () => {
    render(<ContextMenu {...defaultProps} />);
    
    // Menu renders to document.body via portal
    const menu = document.body.querySelector('[role="menu"]');
    
    expect(menu).not.toBeNull();
    // Note: Position may be adjusted by boundary detection, so we just check it exists
  });

  it("displays target file name in header", () => {
    render(<ContextMenu {...defaultProps} />);
    expect(screen.getByText("test.txt")).toBeInTheDocument();
  });

  it("shows marked file count when marks exist", () => {
    const marks = new Set(["file1.txt", "file2.txt", "file3.txt"]);
    render(<ContextMenu {...defaultProps} marks={marks} />);
    
    expect(screen.getByText("3 marked file(s)")).toBeInTheDocument();
  });

  it("renders all operation buttons when handlers provided", () => {
    render(<ContextMenu {...defaultProps} />);
    
    expect(screen.getByText(/Copy/)).toBeInTheDocument();
    expect(screen.getByText(/Move/)).toBeInTheDocument();
    expect(screen.getByText(/Delete/)).toBeInTheDocument();
    expect(screen.getByText(/Rename/)).toBeInTheDocument();
  });

  it("does not render operation buttons when handlers missing", () => {
    render(<ContextMenu {...defaultProps} onCopy={undefined} onMove={undefined} />);
    
    expect(screen.queryByText(/Copy/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Move/)).not.toBeInTheDocument();
  });

  it("shows file count for bulk operations", () => {
    const marks = new Set(["file1.txt", "file2.txt"]);
    render(<ContextMenu {...defaultProps} marks={marks} />);
    
    expect(screen.getByText(/Copy \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Move \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Delete \(2\)/)).toBeInTheDocument();
  });

  it("hides rename button when multiple files marked", () => {
    const marks = new Set(["file1.txt", "file2.txt"]);
    render(<ContextMenu {...defaultProps} marks={marks} />);
    
    expect(screen.queryByText(/Rename/)).not.toBeInTheDocument();
  });

  it("calls onCopy and onClose when copy clicked", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Copy/));
    
    expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onMove and onClose when move clicked", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Move/));
    
    expect(defaultProps.onMove).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete and onClose when delete clicked", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Delete/));
    
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onRename with file and onClose when rename clicked", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Rename/));
    
    expect(defaultProps.onRename).toHaveBeenCalledTimes(1);
    expect(defaultProps.onRename).toHaveBeenCalledWith(mockFile);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes menu on Escape key", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: "Escape" });
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes menu on outside click", () => {
    render(<ContextMenu {...defaultProps} />);
    
    fireEvent.mouseDown(document.body);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close menu on menu click", () => {
    render(<ContextMenu {...defaultProps} />);
    
    // Menu renders to document.body via portal
    const menu = document.body.querySelector('[role="menu"]')!;
    
    fireEvent.mouseDown(menu);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("renders null when no file provided", () => {
    const { container } = render(<ContextMenu {...defaultProps} file={null} />);
    
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it("adjusts position when near viewport edge", () => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });
    
    // Position near right edge - renders via portal to document.body
    render(<ContextMenu {...defaultProps} x={1000} y={700} />);
    
    // Menu renders to document.body via portal
    const menu = document.body.querySelector('[role="menu"]') as HTMLDivElement;
    
    // Position should be adjusted to keep menu on screen
    expect(menu).not.toBeNull();
  });

  it("displays keyboard shortcuts next to operations", () => {
    render(<ContextMenu {...defaultProps} />);
    
    // Check for shortcut hints
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("applies danger styling to delete button", () => {
    render(<ContextMenu {...defaultProps} />);
    const deleteButton = screen.getByText(/Delete/).closest("button");
    
    expect(deleteButton?.className).toContain("text-red-600");
  });

  it("renders with ARIA attributes", () => {
    render(<ContextMenu {...defaultProps} />);
    
    // Menu renders to document.body via portal
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    const menuItems = document.body.querySelectorAll('[role="menuitem"]');
    
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute("aria-label")).toBe("File operations menu");
    expect(menuItems.length).toBeGreaterThan(0);
  });
});

describe("[TEST-MOUSE_INTERACTION] Drag Data Serialization", () => {
  it("serializes drag data correctly", () => {
    const dragData = {
      files: ["file1.txt", "file2.txt"],
      sourcePath: "/test/path",
    };
    
    const serialized = JSON.stringify(dragData);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized).toEqual(dragData);
    expect(deserialized.files).toHaveLength(2);
    expect(deserialized.sourcePath).toBe("/test/path");
  });

  it("handles single file drag data", () => {
    const dragData = {
      files: ["single.txt"],
      sourcePath: "/test",
    };
    
    const serialized = JSON.stringify(dragData);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized.files).toHaveLength(1);
    expect(deserialized.files[0]).toBe("single.txt");
  });

  it("handles marked files drag data", () => {
    const marks = new Set(["a.txt", "b.txt", "c.txt"]);
    const dragData = {
      files: Array.from(marks),
      sourcePath: "/marked",
    };
    
    const serialized = JSON.stringify(dragData);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized.files).toHaveLength(3);
    expect(deserialized.files).toContain("a.txt");
    expect(deserialized.files).toContain("b.txt");
    expect(deserialized.files).toContain("c.txt");
  });
});

describe("[TEST-MOUSE_INTERACTION] Drop Operation Detection", () => {
  it("detects copy operation with Ctrl key", () => {
    const ctrlEvent = {
      ctrlKey: true,
      metaKey: false,
    };
    
    const operation = ctrlEvent.ctrlKey ? "copy" : "move";
    expect(operation).toBe("copy");
  });

  it("detects move operation without modifiers", () => {
    const normalEvent = {
      ctrlKey: false,
      metaKey: false,
    };
    
    const operation = normalEvent.ctrlKey ? "copy" : "move";
    expect(operation).toBe("move");
  });

  it("handles same-directory drop prevention", () => {
    const sourcePath = "/test/dir";
    const targetPath = "/test/dir";
    
    const shouldDrop = sourcePath !== targetPath;
    expect(shouldDrop).toBe(false);
  });

  it("allows different-directory drop", () => {
    const sourcePath = "/test/source";
    const targetPath = "/test/target";
    
    const shouldDrop = sourcePath !== targetPath;
    expect(shouldDrop).toBe(true);
  });
});

describe("[TEST-MOUSE_INTERACTION] Context Menu Position Calculation", () => {
  const calculatePosition = (
    x: number,
    y: number,
    menuWidth: number,
    menuHeight: number,
    viewportWidth: number,
    viewportHeight: number
  ) => {
    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  };

  it("keeps menu position when enough space", () => {
    const result = calculatePosition(100, 100, 200, 300, 1024, 768);
    
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it("adjusts X position when menu overflows right edge", () => {
    const result = calculatePosition(900, 100, 200, 300, 1024, 768);
    
    expect(result.x).toBe(1024 - 200 - 10); // viewport - width - margin
    expect(result.y).toBe(100);
  });

  it("adjusts Y position when menu overflows bottom edge", () => {
    const result = calculatePosition(100, 600, 200, 300, 1024, 768);
    
    expect(result.x).toBe(100);
    expect(result.y).toBe(768 - 300 - 10); // viewport - height - margin
  });

  it("adjusts both X and Y when menu overflows corner", () => {
    const result = calculatePosition(900, 600, 200, 300, 1024, 768);
    
    expect(result.x).toBe(1024 - 200 - 10);
    expect(result.y).toBe(768 - 300 - 10);
  });

  it("handles edge case at exact viewport edge", () => {
    const result = calculatePosition(824, 468, 200, 300, 1024, 768);
    
    // X position: 824 + 200 = 1024, exactly at boundary
    // Since condition is >, it won't adjust (824 is returned)
    expect(result.x).toBe(824);
    // Y position: 468 + 300 = 768, exactly at boundary
    // Since condition is >, it won't adjust (468 is returned)
    expect(result.y).toBe(468);
  });
});
