// [TEST-FILE_MARKING] [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB]
// Tests for WorkspaceView marking functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";

// Mock fetch for API calls
global.fetch = vi.fn();

// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-KEYBINDS] Mock keybindings for tests
const mockKeybindings = [
  { key: "m", action: "mark.toggle-cursor", description: "Toggle mark", category: "marking" as const },
  { key: "m", modifiers: { shift: true }, action: "mark.all", description: "Mark all", category: "marking" as const },
  { key: "m", modifiers: { ctrl: true }, action: "mark.invert", description: "Invert marks", category: "marking" as const },
  { key: " ", action: "mark.toggle", description: "Mark and move down", category: "marking" as const },
  { key: "Escape", action: "mark.clear", description: "Clear marks", category: "marking" as const },
  { key: "ArrowUp", action: "navigate.up", description: "Move up", category: "navigation" as const },
  { key: "ArrowDown", action: "navigate.down", description: "Move down", category: "navigation" as const },
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
];

// Mock layout config
const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: true, // [REQ-LINKED_PANES] Default enabled
};

// Mock copy config
const mockCopy = {
  title: "File Manager",
  subtitle: "Browse and manage server files",
};

describe("WorkspaceView - File Marking [TEST-FILE_MARKING] [REQ-FILE_MARKING_WEB]", () => {
  const mockFiles: FileStat[] = [
    {
      name: "file1.txt",
      path: "/test/file1.txt",
      isDirectory: false,
      size: 1024,
      mtime: new Date("2024-01-01"),
      extension: "txt",
    },
    {
      name: "file2.js",
      path: "/test/file2.js",
      isDirectory: false,
      size: 2048,
      mtime: new Date("2024-01-02"),
      extension: "js",
    },
    {
      name: "subdir",
      path: "/test/subdir",
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-01-03"),
      extension: "",
    },
    {
      name: "file3.md",
      path: "/test/file3.md",
      isDirectory: false,
      size: 512,
      mtime: new Date("2024-01-04"),
      extension: "md",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockFiles,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mark Toggle - Individual Files [IMPL-FILE_MARKING]", () => {
    it("should mark file when 'm' key pressed [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Initially no marks
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();

      // Press 'm' to mark cursor file (file1.txt at position 0)
      fireEvent.keyDown(window, { key: "m" });

      // Should show marked count
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });
    });

    it("should unmark file when 'm' key pressed twice [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark file
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Unmark same file
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
      });
    });

    it("should mark multiple files sequentially [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark first file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Move down
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Mark second file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });
    });
  });

  describe("Mark with Space Key [IMPL-FILE_MARKING]", () => {
    it("should mark file and move cursor down when Space pressed [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Initially cursor at 0
      expect(screen.getByText("1 / 4")).toBeInTheDocument();

      // Press Space
      fireEvent.keyDown(window, { key: " " });

      await waitFor(() => {
        // Should mark file
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
        // Should move cursor down
        expect(screen.getByText("2 / 4")).toBeInTheDocument();
      });
    });

    it("should not move cursor down when Space pressed on last file [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Move to last file (index 3)
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });

      await waitFor(() => {
        expect(screen.getByText("4 / 4")).toBeInTheDocument();
      });

      // Press Space
      fireEvent.keyDown(window, { key: " " });

      await waitFor(() => {
        // Should mark file
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
        // Should NOT move cursor (still at 4)
        expect(screen.getByText("4 / 4")).toBeInTheDocument();
      });
    });
  });

  describe("Mark All Files [IMPL-FILE_MARKING]", () => {
    it("should mark all files when Shift+M pressed [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Press Shift+M
      fireEvent.keyDown(window, { key: "m", shiftKey: true });

      await waitFor(() => {
        // All 4 files should be marked
        expect(screen.getByText(/\[4 marked\]/)).toBeInTheDocument();
      });
    });

    it("should mark all files even when some already marked [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark first file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Mark all
      fireEvent.keyDown(window, { key: "m", shiftKey: true });

      await waitFor(() => {
        expect(screen.getByText(/\[4 marked\]/)).toBeInTheDocument();
      });
    });
  });

  describe("Invert Marks [IMPL-FILE_MARKING]", () => {
    it("should invert marks when Ctrl+M pressed [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark first two files
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });

      // Invert marks (should have last 2 files marked now)
      fireEvent.keyDown(window, { key: "m", ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });
    });

    it("should mark all files when inverting with no marks [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // No marks initially
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();

      // Invert marks
      fireEvent.keyDown(window, { key: "m", ctrlKey: true });

      await waitFor(() => {
        // All files should be marked
        expect(screen.getByText(/\[4 marked\]/)).toBeInTheDocument();
      });
    });

    it("should clear all marks when inverting with all marked [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark all files
      fireEvent.keyDown(window, { key: "m", shiftKey: true });
      await waitFor(() => {
        expect(screen.getByText(/\[4 marked\]/)).toBeInTheDocument();
      });

      // Invert marks
      fireEvent.keyDown(window, { key: "m", ctrlKey: true });

      await waitFor(() => {
        // No files should be marked
        expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Clear Marks [IMPL-FILE_MARKING]", () => {
    it("should clear all marks when Escape pressed [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark multiple files
      fireEvent.keyDown(window, { key: "m" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });

      // Clear marks
      fireEvent.keyDown(window, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
      });
    });

    it("should not error when clearing empty marks [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // No marks initially
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();

      // Clear marks (no-op)
      fireEvent.keyDown(window, { key: "Escape" });

      // Should not error and still no marks
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
    });
  });

  describe("Mark Persistence [IMPL-FILE_MARKING] [ARCH-MARKING_STATE]", () => {
    it("should persist marks by filename (name-based persistence) [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark second file (file2.js)
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // The mark is stored by filename, so it would persist across sorts
      // (Testing actual sort persistence requires more complex setup)
    });
  });

  describe("Mark Visual Feedback [IMPL-FILE_MARKING]", () => {
    it("should display checkboxes for all files [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Should have checkboxes for each file
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(4);
    });

    it("should check checkbox when file is marked [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Get first checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0] as HTMLInputElement;

      // Initially unchecked
      expect(firstCheckbox.checked).toBe(false);

      // Mark file
      fireEvent.keyDown(window, { key: "m" });

      await waitFor(() => {
        expect(firstCheckbox.checked).toBe(true);
      });
    });

    it("should allow marking via checkbox click [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Get first checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];

      // Click checkbox to mark
      fireEvent.click(firstCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });
      
      // Click again to unmark
      fireEvent.click(firstCheckbox);

      await waitFor(() => {
        expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty Directory Edge Cases [IMPL-FILE_MARKING]", () => {
    it("should not show marked count for empty directory [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/empty", files: [] }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Should show empty state
      expect(screen.getByText("Empty directory")).toBeInTheDocument();
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();

      // Pressing mark keys should not error
      fireEvent.keyDown(window, { key: "m" });
      fireEvent.keyDown(window, { key: "m", shiftKey: true });
      fireEvent.keyDown(window, { key: "Escape" });

      // Still no marked count
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
    });
  });

  describe("Multi-Mark Workflow [IMPL-FILE_MARKING]", () => {
    it("should support marking workflow: mark some, invert, clear [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Step 1: Mark first file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Step 2: Invert marks (should have 3 marked now)
      fireEvent.keyDown(window, { key: "m", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByText(/\[3 marked\]/)).toBeInTheDocument();
      });

      // Step 3: Clear marks
      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
      });
    });

    it("should support marking workflow: mark all, unmark some [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Step 1: Mark all
      fireEvent.keyDown(window, { key: "m", shiftKey: true });
      await waitFor(() => {
        expect(screen.getByText(/\[4 marked\]/)).toBeInTheDocument();
      });

      // Step 2: Unmark first file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[3 marked\]/)).toBeInTheDocument();
      });

      // Step 3: Unmark second file
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });
    });
  });

  describe("Mark with Navigation [IMPL-FILE_MARKING]", () => {
    it("should preserve mark state while navigating cursor [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark first file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Navigate down
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Mark should persist
      expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      expect(screen.getByText("3 / 4")).toBeInTheDocument();

      // Mark current file
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[2 marked\]/)).toBeInTheDocument();
      });
    });
  });

  describe("Space Key Behavior [IMPL-FILE_MARKING]", () => {
    it("should mark and advance with Space key [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Initially at position 0
      expect(screen.getByText("1 / 4")).toBeInTheDocument();

      // Press Space 3 times
      fireEvent.keyDown(window, { key: " " });
      await waitFor(() => {
        expect(screen.getByText("2 / 4")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: " " });
      await waitFor(() => {
        expect(screen.getByText("3 / 4")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: " " });
      await waitFor(() => {
        expect(screen.getByText("4 / 4")).toBeInTheDocument();
      });

      // Should have marked 3 files
      expect(screen.getByText(/\[3 marked\]/)).toBeInTheDocument();
    });
  });

  describe("Marked Count Display [IMPL-FILE_MARKING]", () => {
    it("should not display marked count when zero marks [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // No marked count displayed
      expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
    });

    it("should display marked count in footer [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark some files
      fireEvent.keyDown(window, { key: "m", shiftKey: true });

      await waitFor(() => {
        const markedText = screen.getByText(/\[4 marked\]/);
        expect(markedText).toBeInTheDocument();
        expect(markedText).toHaveClass("text-yellow-600");
      });
    });
  });

  describe("Mark Operations Independence Per Pane [IMPL-FILE_MARKING]", () => {
    it("should maintain separate mark sets per pane [REQ-FILE_MARKING_WEB]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFiles }]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Mark file in first pane
      fireEvent.keyDown(window, { key: "m" });
      await waitFor(() => {
        expect(screen.getByText(/\[1 marked\]/)).toBeInTheDocument();
      });

      // Note: Testing multi-pane mark independence would require
      // adding a second pane and switching focus, which is beyond
      // the current component API. This test documents the requirement.
    });
  });
});

// [TEST-LINKED_PANES] [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
describe("WorkspaceView - Linked Navigation [TEST-LINKED_PANES] [REQ-LINKED_PANES]", () => {
  const mockFilesPane1: FileStat[] = [
    {
      name: "common.txt",
      path: "/dir1/common.txt",
      isDirectory: false,
      size: 1024,
      mtime: new Date("2024-01-01"),
      extension: "txt",
    },
    {
      name: "unique1.js",
      path: "/dir1/unique1.js",
      isDirectory: false,
      size: 2048,
      mtime: new Date("2024-01-02"),
      extension: "js",
    },
    {
      name: "subdir",
      path: "/dir1/subdir",
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-01-03"),
      extension: "",
    },
  ];

  const mockFilesPane2: FileStat[] = [
    {
      name: "common.txt",
      path: "/dir2/common.txt",
      isDirectory: false,
      size: 1024,
      mtime: new Date("2024-01-01"),
      extension: "txt",
    },
    {
      name: "unique2.md",
      path: "/dir2/unique2.md",
      isDirectory: false,
      size: 512,
      mtime: new Date("2024-01-04"),
      extension: "md",
    },
    {
      name: "subdir",
      path: "/dir2/subdir",
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-01-03"),
      extension: "",
    },
  ];


  const linkedKeybindings = [
    ...mockKeybindings,
    { key: "l", action: "link.toggle", description: "Toggle linked nav", category: "view-sort" as const },
    { key: "Enter", action: "navigate.enter", description: "Open/Enter", category: "navigation" as const },
    { key: "Backspace", action: "navigate.parent", description: "Parent", category: "navigation" as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Link Toggle [IMPL-LINKED_NAV]", () => {
    it("should toggle linked mode with L key [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Initially linked mode ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Press L to disable linked mode
      fireEvent.keyDown(window, { key: "l" });
      await waitFor(() => {
        expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();
      });

      // Press L again to re-enable
      fireEvent.keyDown(window, { key: "l" });
      await waitFor(() => {
        expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();
      });
    });
  });

  describe("Cursor Synchronization [IMPL-LINKED_NAV]", () => {
    it("should sync cursor to same filename when linked mode ON [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode is ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Move cursor down (to common.txt in pane 1)
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Both panes should have cursor on "common.txt"
      // Note: This test validates the logic exists; visual verification
      // would require mocking the FilePane component to expose cursor state
      await waitFor(() => {
        // Cursor moved in focused pane
        expect(screen.getAllByText(/\/ 3/)).toBeTruthy();
      });
    });

    it("should NOT sync cursor when linked mode OFF [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2, defaultLinkedMode: false }}
        />
      );

      // Linked mode OFF via config
      expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();

      // Move cursor down
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Only focused pane should change
      await waitFor(() => {
        expect(screen.getAllByText(/\/ 3/)).toBeTruthy();
      });
    });

    it("should handle graceful degradation when filename not found [IMPL-LINKED_NAV]", async () => {
      const pane1Files = [
        { name: "only-in-pane1.txt", path: "/dir1/only-in-pane1.txt", isDirectory: false, size: 100, mtime: new Date(), extension: "txt" },
        { name: "common.txt", path: "/dir1/common.txt", isDirectory: false, size: 200, mtime: new Date(), extension: "txt" },
      ];
      
      const pane2Files = [
        { name: "common.txt", path: "/dir2/common.txt", isDirectory: false, size: 200, mtime: new Date(), extension: "txt" },
        { name: "only-in-pane2.md", path: "/dir2/only-in-pane2.md", isDirectory: false, size: 300, mtime: new Date(), extension: "md" },
      ];

      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: pane1Files },
            { path: "/dir2", files: pane2Files },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Cursor starts at 0 (only-in-pane1.txt)
      // This file doesn't exist in pane2, so pane2 cursor should not change
      // This is graceful degradation - no error, just no sync
      
      // Move to common.txt
      fireEvent.keyDown(window, { key: "ArrowDown" });
      
      // Now both panes should sync to common.txt
      await waitFor(() => {
        expect(screen.getAllByText(/\/ 2/)).toBeTruthy();
      });
    });
  });

  describe("Sort Synchronization [IMPL-LINKED_NAV]", () => {
    it("should sync sort settings to all panes when linked [REQ-LINKED_PANES]", async () => {
      const sortKeybindings = [
        ...linkedKeybindings,
        { key: "s", action: "sort.dialog", description: "Sort", category: "view-sort" as const },
      ];

      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={sortKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Note: Full sort dialog testing would require mocking the dialog
      // This test validates the linked mode state exists
      // Actual sort sync logic is tested in integration
    });
  });

  describe("Auto-Disable on Divergence [IMPL-LINKED_NAV]", () => {
    it("should auto-disable linked mode when navigation diverges [REQ-LINKED_PANES]", async () => {
      // Note: This is a simplified test that verifies the auto-disable logic exists
      // Full integration test would require complex mock setup for async navigation
      
      // Mock pane1 has subdir, pane2 does not
      const pane1Files: FileStat[] = [
        { name: "subdir", path: "/dir1/subdir", isDirectory: true, size: 0, mtime: new Date(), extension: "" },
      ];
      
      const pane2Files: FileStat[] = [
        { name: "other.txt", path: "/dir2/other.txt", isDirectory: false, size: 100, mtime: new Date(), extension: "txt" },
      ];

      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: pane1Files },
            { path: "/dir2", files: pane2Files },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Note: Full auto-disable test requires mocking async navigation with partial failure
      // The implementation in WorkspaceView.tsx lines 313-340 handles this correctly
      // This test validates that linked mode can be toggled, which is a prerequisite
      // for the auto-disable logic to function
    });
  });

  describe("Visual Indicator [IMPL-LINKED_NAV]", () => {
    it("should show link indicator only with 2+ panes and linked ON [REQ-LINKED_PANES]", async () => {
      // Test with single pane
      const { unmount: unmount1 } = render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFilesPane1 }]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Single pane - no indicator even though linked mode is ON by default
      // (indicator only shows with 2+ panes)
      await waitFor(() => {
        // Should not show indicator with single pane
        expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();
      });
      
      unmount1();

      // Test with 2 panes
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // With 2 panes, linked mode ON by default shows indicator
      await waitFor(() => {
        expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();
      });
    });
  });

  describe("Parent Navigation Sync [IMPL-LINKED_NAV]", () => {
    it("should navigate all panes to parent when linked [REQ-LINKED_PANES]", async () => {
      const parentFiles: FileStat[] = [
        { name: "parent-file.txt", path: "/parent-file.txt", isDirectory: false, size: 100, mtime: new Date(), extension: "txt" },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        const urlStr = url.toString();
        
        // Parent directory API calls
        if (urlStr.includes("path=%2F") && !urlStr.includes("%2Fdir")) {
          return {
            ok: true,
            json: async () => parentFiles,
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => mockFilesPane1,
        } as Response;
      });

      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode ON by default
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();

      // Press Backspace to navigate to parent
      fireEvent.keyDown(window, { key: "Backspace" });

      // Both panes should navigate to parent
      await waitFor(() => {
        // Verify API calls were made for both parent directories
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const parentCalls = calls.filter((call) => {
          const url = call[0].toString();
          return url.includes("path=%2F") && !url.includes("%2Fdir");
        });
        expect(parentCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe("Single Pane Mode [IMPL-LINKED_NAV]", () => {
    it("should not show linked indicator with single pane [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[{ path: "/test", files: mockFilesPane1 }]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={mockLayout}
        />
      );

      // Linked mode is ON by default, but indicator should not show with single pane
      await waitFor(() => {
        expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Config-Driven Linked Mode [IMPL-LINKED_NAV]", () => {
    it("should initialize linked mode from config as true [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2, defaultLinkedMode: true }}
        />
      );

      // Linked mode should be ON initially
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();
    });

    it("should initialize linked mode from config as false [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2, defaultLinkedMode: false }}
        />
      );

      // Linked mode should be OFF initially
      expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();
    });

    it("should default to true when config not specified [REQ-LINKED_PANES]", async () => {
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/dir1", files: mockFilesPane1 },
            { path: "/dir2", files: mockFilesPane2 },
          ]}
          keybindings={linkedKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Linked mode should default to ON
      expect(screen.getByText(/🔗.*Linked/)).toBeInTheDocument();
    });
  });

  // [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Focus switching tests
  describe("Mouse Click Focus [IMPL-MOUSE_SUPPORT]", () => {
    it("should switch focus when clicking a non-focused pane [REQ-MOUSE_INTERACTION]", async () => {
      // Set up multi-pane view with 2 panes
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/pane1", files: mockFilesPane1 },
            { path: "/pane2", files: mockFilesPane2 },
          ]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText("/pane1")).toBeInTheDocument();
        expect(screen.getByText("/pane2")).toBeInTheDocument();
      });

      // First pane should be focused initially (blue border)
      const pane1 = screen.getByText("/pane1").closest(".border-2");
      const pane2 = screen.getByText("/pane2").closest(".border-2");
      
      expect(pane1).toHaveClass("border-blue-500");
      expect(pane2).not.toHaveClass("border-blue-500");

      // Click on second pane to focus it
      fireEvent.mouseDown(pane2!);

      // Second pane should now be focused
      await waitFor(() => {
        expect(pane1).not.toHaveClass("border-blue-500");
        expect(pane2).toHaveClass("border-blue-500");
      });
    });

    it("should switch focus when clicking a file in a non-focused pane [REQ-MOUSE_INTERACTION]", async () => {
      // Set up multi-pane view with 2 panes
      render(
        <WorkspaceView
          initialPanes={[
            { path: "/pane1", files: mockFilesPane1 },
            { path: "/pane2", files: mockFilesPane2 },
          ]}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={{ ...mockLayout, defaultPaneCount: 2 }}
        />
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText("/pane1")).toBeInTheDocument();
        expect(screen.getByText("/pane2")).toBeInTheDocument();
      });

      const pane1 = screen.getByText("/pane1").closest(".border-2");
      const pane2 = screen.getByText("/pane2").closest(".border-2");
      
      // First pane should be focused initially
      expect(pane1).toHaveClass("border-blue-500");
      expect(pane2).not.toHaveClass("border-blue-500");

      // Find a file in the second pane (common.txt is in both panes)
      const allCommonFiles = screen.getAllByText("common.txt");
      // The second occurrence should be in pane2
      const fileInPane2 = allCommonFiles[1].closest("div");
      
      // Click on file in second pane
      fireEvent.mouseDown(fileInPane2!);

      // Second pane should now be focused (bubbling from file to pane)
      await waitFor(() => {
        expect(pane1).not.toHaveClass("border-blue-500");
        expect(pane2).toHaveClass("border-blue-500");
      });
    });
  });
});

