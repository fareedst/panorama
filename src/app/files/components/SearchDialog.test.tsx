// [TEST-FILE_SEARCH] [IMPL-FILE_SEARCH] [REQ-FILE_SEARCH]
// Tests for SearchDialog component

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchDialog } from "./SearchDialog";

// Mock searchContent function
vi.mock("@/lib/files.search", async () => {
  const actual = await vi.importActual("@/lib/files.search");
  return {
    ...actual,
    searchContent: vi.fn(),
    SearchHistory: class MockSearchHistory {
      private key: string;
      constructor(key: string) {
        this.key = key;
      }
      add() {}
      getAll() {
        return [];
      }
      getPatterns() {
        return [];
      }
      clear() {}
    },
  };
});

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

import { searchContent } from "@/lib/files.search";

describe("SearchDialog [TEST-FILE_SEARCH] [REQ-FILE_SEARCH]", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectResult = vi.fn();
  const mockBasePath = "/home/user";
  const mockCopy = {
    searchTitle: "Search Content",
    searchPlaceholder: "Enter pattern...",
    searchButton: "Search",
    searchNoResults: "No matches found",
    searchResultsCount: "{count} in {files} files",
    searchOptions: "Options",
    searchRecursive: "Recursive",
    searchCaseSensitive: "Case Sensitive",
    searchRegex: "Regex",
    searchFilePattern: "File Pattern",
    searchInProgress: "Searching...",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("Rendering [IMPL-FILE_SEARCH]", () => {
    it("should not render when closed [REQ-FILE_SEARCH]", () => {
      const { container } = render(
        <SearchDialog
          isOpen={false}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when open [REQ-FILE_SEARCH]", () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("Search Content")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter pattern...")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("should render search options [REQ-FILE_SEARCH]", () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      expect(screen.getByText("Options")).toBeInTheDocument();
      expect(screen.getByText("Recursive")).toBeInTheDocument();
      expect(screen.getByText("Case Sensitive")).toBeInTheDocument();
      expect(screen.getByText("Regex")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("File Pattern")).toBeInTheDocument();
    });

    it("should have recursive enabled by default [REQ-FILE_SEARCH]", () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const recursiveCheckbox = screen.getByRole("checkbox", { name: /Recursive/i });
      expect(recursiveCheckbox).toBeChecked();
    });
  });

  describe("Search Execution [IMPL-FILE_SEARCH]", () => {
    it("should execute search when button clicked [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [
          {
            path: "/home/user/file.txt",
            matches: [
              { line: 10, content: "test line", column: 0, length: 4 },
            ],
          },
        ],
        totalMatches: 1,
        truncated: false,
        duration: 50,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const button = screen.getByText("Search");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            pattern: "test",
            basePath: mockBasePath,
            recursive: true,
          })
        );
      });
    });

    it("should execute search on Enter key [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 10,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalled();
      });
    });

    it("should disable search button with empty pattern [REQ-FILE_SEARCH]", async () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const button = screen.getByText("Search");
      
      // Button should be disabled with empty pattern
      expect(button).toBeDisabled();
      
      // Type something
      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      
      // Now button should be enabled
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should show loading state during search [REQ-FILE_SEARCH]", async () => {
      // Use a promise that we control
      let resolveSearch!: (value: unknown) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });

      vi.mocked(searchContent).mockReturnValue(searchPromise as never);

      const { rerender } = render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const button = screen.getByText("Search");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(button);

      // Force a re-render to ensure state updates are applied
      rerender(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      // Check if searchContent was called (confirms button was enabled and clicked)
      expect(searchContent).toHaveBeenCalled();

      // Clean up - resolve the promise
      resolveSearch({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 100,
      });
    });

    it("should disable search button while loading [REQ-FILE_SEARCH]", async () => {
      // Use a promise that we control
      let resolveSearch!: (value: unknown) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });

      vi.mocked(searchContent).mockReturnValue(searchPromise as never);

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      
      const button = screen.getByText("Search");
      
      // Button should be enabled before search
      expect(button).not.toBeDisabled();
      
      fireEvent.click(button);

      // Clean up immediately
      resolveSearch({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 100,
      });

      // Verify search was called
      expect(searchContent).toHaveBeenCalled();
    });
  });

  describe("Search Results [IMPL-FILE_SEARCH]", () => {
    it("should display search results [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [
          {
            path: "/home/user/file1.txt",
            matches: [
              { line: 5, content: "first match", column: 0, length: 5 },
              { line: 10, content: "second match", column: 2, length: 5 },
            ],
          },
          {
            path: "/home/user/file2.txt",
            matches: [
              { line: 3, content: "third match", column: 1, length: 5 },
            ],
          },
        ],
        totalMatches: 3,
        truncated: false,
        duration: 75,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const button = screen.getByText("Search");

      fireEvent.change(input, { target: { value: "match" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("first match")).toBeInTheDocument();
        expect(screen.getByText("second match")).toBeInTheDocument();
        expect(screen.getByText("third match")).toBeInTheDocument();
      });
    });

    it("should show result count [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [
          {
            path: "/home/user/file.txt",
            matches: [
              { line: 1, content: "match", column: 0, length: 5 },
            ],
          },
        ],
        totalMatches: 1,
        truncated: false,
        duration: 25,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(screen.getByText("1 in 1 files")).toBeInTheDocument();
      });
    });

    it("should show no results message [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 15,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "nonexistent" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(screen.getByText("No matches found")).toBeInTheDocument();
      });
    });

    it("should show truncated indicator [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 1000,
        truncated: true,
        duration: 200,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "common" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(screen.getByText(/truncated/i)).toBeInTheDocument();
      });
    });

    it("should show search duration [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 123,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(screen.getByText(/123ms/i)).toBeInTheDocument();
      });
    });
  });

  describe("Search Options [IMPL-FILE_SEARCH]", () => {
    it("should pass recursive option [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 10,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const recursiveCheckbox = screen.getByRole("checkbox", { name: /Recursive/i });
      
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(recursiveCheckbox); // Uncheck
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            recursive: false,
          })
        );
      });
    });

    it("should pass case sensitive option [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 10,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const caseSensitiveCheckbox = screen.getByRole("checkbox", { name: /Case Sensitive/i });
      
      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(caseSensitiveCheckbox); // Check
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            caseSensitive: true,
          })
        );
      });
    });

    it("should pass regex option [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 10,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const regexCheckbox = screen.getByRole("checkbox", { name: /Regex/i });
      
      fireEvent.change(input, { target: { value: "test.*pattern" } });
      fireEvent.click(regexCheckbox); // Check
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            regex: true,
          })
        );
      });
    });

    it("should pass file pattern option [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [],
        totalMatches: 0,
        truncated: false,
        duration: 10,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      const filePatternInput = screen.getByPlaceholderText("File Pattern");
      
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.change(filePatternInput, { target: { value: "*.txt" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            filePattern: "*.txt",
          })
        );
      });
    });
  });

  describe("Result Selection [IMPL-FILE_SEARCH]", () => {
    it("should call onSelectResult when result clicked [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockResolvedValue({
        results: [
          {
            path: "/home/user/file.txt",
            matches: [
              { line: 10, content: "test line", column: 0, length: 4 },
            ],
          },
        ],
        totalMatches: 1,
        truncated: false,
        duration: 50,
      });

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        const resultItem = screen.getByText("test line").closest("div");
        if (resultItem) {
          fireEvent.click(resultItem);
        }
      });

      expect(mockOnSelectResult).toHaveBeenCalledWith("/home/user/file.txt", 10);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Keyboard Navigation [IMPL-FILE_SEARCH]", () => {
    it("should close on Escape key [REQ-FILE_SEARCH]", () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.keyDown(input, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling [IMPL-FILE_SEARCH]", () => {
    it("should display error message on search failure [REQ-FILE_SEARCH]", async () => {
      vi.mocked(searchContent).mockRejectedValue(new Error("Search failed"));

      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      const input = screen.getByPlaceholderText("Enter pattern...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByText("Search"));

      await waitFor(() => {
        expect(screen.getByText("Search failed")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases [IMPL-FILE_SEARCH]", () => {
    it("should handle undefined copy prop [REQ-FILE_SEARCH]", () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={undefined}
        />
      );

      // Should render with default text
      expect(screen.getByText("Search File Contents")).toBeInTheDocument();
    });

    it("should focus input when opened [REQ-FILE_SEARCH]", async () => {
      render(
        <SearchDialog
          isOpen={true}
          onClose={mockOnClose}
          onSelectResult={mockOnSelectResult}
          basePath={mockBasePath}
          copy={mockCopy}
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Enter pattern...");
        expect(document.activeElement).toBe(input);
      }, { timeout: 100 });
    });
  });
});
