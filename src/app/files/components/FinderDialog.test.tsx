// [TEST-FILE_SEARCH] [IMPL-FILE_SEARCH] [REQ-FILE_SEARCH]
// Tests for FinderDialog component

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FinderDialog } from "./FinderDialog";
import type { FileStat } from "@/lib/files.types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.localStorage = localStorageMock as any;

describe("FinderDialog [TEST-FILE_SEARCH] [REQ-FILE_SEARCH]", () => {
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
      name: "test_file.js",
      path: "/home/user/test_file.js",
      isDirectory: false,
      size: 2048,
      mtime: new Date("2024-01-03"),
      extension: ".js",
    },
    {
      name: "README.md",
      path: "/home/user/README.md",
      isDirectory: false,
      size: 512,
      mtime: new Date("2024-01-04"),
      extension: ".md",
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const mockCopy = {
    finderTitle: "Find Files",
    finderPlaceholder: "Type to filter...",
    finderNoResults: "No matches",
    finderResultsCount: "{count} files",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("Rendering [IMPL-FILE_SEARCH]", () => {
    it("should not render when closed [REQ-FILE_SEARCH]", () => {
      const { container } = render(
        <FinderDialog
          isOpen={false}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when open [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("Find Files")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Type to filter...")).toBeInTheDocument();
    });

    it("should display all files initially [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("test_file.js")).toBeInTheDocument();
      expect(screen.getByText("README.md")).toBeInTheDocument();
    });

    it("should show result count [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("4 files")).toBeInTheDocument();
    });

    it("should show directory indicator [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      // Check for directory emoji
      expect(screen.getByText("📁")).toBeInTheDocument();
    });
  });

  describe("Filtering [IMPL-FILE_SEARCH]", () => {
    it("should filter files by pattern [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      // All files should be visible initially
      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("test_file.js")).toBeInTheDocument();
      expect(screen.getByText("README.md")).toBeInTheDocument();

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.change(input, { target: { value: "file" } });

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that filtering occurred (Documents and README should be gone)
      expect(screen.queryByText("Documents")).not.toBeInTheDocument();
      expect(screen.queryByText("README.md")).not.toBeInTheDocument();
    });

    it("should filter case-insensitively [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.change(input, { target: { value: "TEST" } });

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // test_file.js should match (case-insensitive)
      // file1.txt should not match
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
      expect(screen.queryByText("README.md")).not.toBeInTheDocument();
    });

    it("should show no results message [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.change(input, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.getByText("No matches")).toBeInTheDocument();
      });
    });

    it("should show all files when pattern is empty [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // Type something
      fireEvent.change(input, { target: { value: "file" } });
      await waitFor(() => {
        expect(screen.queryByText("Documents")).not.toBeInTheDocument();
      });

      // Clear it
      fireEvent.change(input, { target: { value: "" } });
      await waitFor(() => {
        expect(screen.getByText("Documents")).toBeInTheDocument();
        expect(screen.getByText("file1.txt")).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Navigation [IMPL-FILE_SEARCH]", () => {
    it("should close on Escape key [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.keyDown(input, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should navigate down with ArrowDown [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // First item should be selected by default (index 0)
      let items = screen.getAllByRole("generic").filter(el => 
        el.className.includes("cursor-pointer")
      );
      expect(items[0]).toHaveClass("bg-blue-100");

      // Press ArrowDown
      fireEvent.keyDown(input, { key: "ArrowDown" });

      // Second item should be selected
      items = screen.getAllByRole("generic").filter(el => 
        el.className.includes("cursor-pointer")
      );
      expect(items[1]).toHaveClass("bg-blue-100");
    });

    it("should navigate up with ArrowUp [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // Move down twice
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });

      // Move up once
      fireEvent.keyDown(input, { key: "ArrowUp" });

      // Second item should be selected
      const items = screen.getAllByRole("generic").filter(el => 
        el.className.includes("cursor-pointer")
      );
      expect(items[1]).toHaveClass("bg-blue-100");
    });

    it("should select file with Enter key [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnSelect).toHaveBeenCalledWith(mockFiles[0]);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not go below 0 with ArrowUp [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // Try to go up when already at index 0
      fireEvent.keyDown(input, { key: "ArrowUp" });

      // First item should still be selected
      const items = screen.getAllByRole("generic").filter(el => 
        el.className.includes("cursor-pointer")
      );
      expect(items[0]).toHaveClass("bg-blue-100");
    });

    it("should not go beyond last item with ArrowDown [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // Press ArrowDown many times
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      }

      // Last item should be selected
      const items = screen.getAllByRole("generic").filter(el => 
        el.className.includes("cursor-pointer")
      );
      expect(items[items.length - 1]).toHaveClass("bg-blue-100");
    });
  });

  describe("Mouse Interaction [IMPL-FILE_SEARCH]", () => {
    it("should select file on click [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const fileItem = screen.getByText("file1.txt").closest("div");
      if (fileItem) {
        fireEvent.click(fileItem);
      }

      expect(mockOnSelect).toHaveBeenCalledWith(mockFiles[1]);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should close when clicking backdrop [REQ-FILE_SEARCH]", () => {
      const { container } = render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      // Click the backdrop (fixed inset-0 div)
      const backdrop = container.querySelector(".fixed");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not close when clicking dialog content [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const title = screen.getByText("Find Files");
      fireEvent.click(title);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Search History [IMPL-FILE_SEARCH]", () => {
    it("should save pattern to history on selection [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Check localStorage was called
      const historyKey = "files:search:finder:history";
      const stored = localStorage.getItem(historyKey);
      expect(stored).toBeTruthy();
    });

    it("should toggle history dropdown with Tab key [REQ-FILE_SEARCH]", () => {
      // Add some history first
      const historyKey = "files:search:finder:history";
      localStorage.setItem(
        historyKey,
        JSON.stringify([
          { pattern: "old search", timestamp: Date.now() },
        ])
      );

      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      
      // Press Tab to show history
      fireEvent.keyDown(input, { key: "Tab" });

      // History should be visible
      expect(screen.getByText("old search")).toBeInTheDocument();
    });
  });

  describe("Match Highlighting [IMPL-FILE_SEARCH]", () => {
    it("should highlight matching text [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Type to filter...");
      fireEvent.change(input, { target: { value: "file" } });

      await waitFor(() => {
        // Check for highlighted spans
        const highlighted = document.querySelectorAll(".bg-yellow-400");
        expect(highlighted.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases [IMPL-FILE_SEARCH]", () => {
    it("should handle empty file list [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={[]}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("0 files")).toBeInTheDocument();
    });

    it("should handle undefined copy prop [REQ-FILE_SEARCH]", () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={undefined}
        />
      );

      // Should render with default text
      expect(screen.getByText("Find Files")).toBeInTheDocument();
    });

    it("should focus input when opened [REQ-FILE_SEARCH]", async () => {
      render(
        <FinderDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          files={mockFiles}
          copy={mockCopy}
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Type to filter...");
        expect(document.activeElement).toBe(input);
      }, { timeout: 100 });
    });
  });
});
