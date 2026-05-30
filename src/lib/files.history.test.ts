// [TEST-ADVANCED_NAV] [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
// Tests for directory history and navigation features

import { describe, it, expect, beforeEach } from "vitest";
import { DirectoryHistory } from "./files.history";

describe("DirectoryHistory [REQ-ADVANCED_NAV]", () => {
  let history: DirectoryHistory;

  beforeEach(() => {
    history = new DirectoryHistory();
  });

  // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
  // how: Before leaving a directory, store filename, cursor index, scrollTop, and timestamp in per-pane Map keyed by path; update recent list.

  describe("saveCursorPosition [IMPL-DIR_HISTORY]", () => {
    it("should save cursor position for directory", () => {
      history.saveCursorPosition(0, "/home/user", "file.txt", 5, 100);

      const restored = history.restoreCursorPosition(0, "/home/user", [
        "a.txt",
        "b.txt",
        "c.txt",
        "d.txt",
        "e.txt",
        "file.txt",
      ]);

      expect(restored.cursor).toBe(5); // Found by filename
      expect(restored.scrollTop).toBe(100);
    });

    it("should save separate histories for different panes", () => {
      history.saveCursorPosition(0, "/home", "file1.txt", 2, 50);
      history.saveCursorPosition(1, "/home", "file2.txt", 3, 75);

      const pane0 = history.restoreCursorPosition(0, "/home", [
        "a.txt",
        "b.txt",
        "file1.txt",
      ]);
      const pane1 = history.restoreCursorPosition(1, "/home", [
        "x.txt",
        "y.txt",
        "z.txt",
        "file2.txt",
      ]);

      expect(pane0.cursor).toBe(2);
      expect(pane1.cursor).toBe(3);
    });
  });

  // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
  // how: On revisit, prefer filename lookup in listing; fallback to saved index clamped to list bounds; default cursor 0 when no history.

  describe("restoreCursorPosition [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY]", () => {
    it("should restore cursor by filename when available", () => {
      history.saveCursorPosition(0, "/test", "target.txt", 10, 0);

      // Filename exists at different index
      const restored = history.restoreCursorPosition(0, "/test", [
        "a.txt",
        "target.txt",
        "z.txt",
      ]);

      expect(restored.cursor).toBe(1); // Found by name
    });

    it("should fallback to index if filename not found", () => {
      history.saveCursorPosition(0, "/test", "missing.txt", 5, 0);

      // Filename doesn't exist, fallback to index 5 (clamped to 2)
      const restored = history.restoreCursorPosition(0, "/test", [
        "a.txt",
        "b.txt",
        "c.txt",
      ]);

      expect(restored.cursor).toBe(2); // Clamped to max index
    });

    it("should return 0 if no history exists", () => {
      const restored = history.restoreCursorPosition(0, "/unknown", [
        "a.txt",
        "b.txt",
      ]);

      expect(restored.cursor).toBe(0);
      expect(restored.scrollTop).toBe(0);
    });

    it("should handle empty file list", () => {
      history.saveCursorPosition(0, "/empty", "file.txt", 5, 0);

      const restored = history.restoreCursorPosition(0, "/empty", []);

      expect(restored.cursor).toBe(0);
    });
  });

  describe("findSubdirectoryInParent [REQ-ADVANCED_NAV]", () => {
    // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
    // how: When navigating up, locate current directory basename among parent listing directories only.
    it("should find subdirectory in parent list", () => {
      const parentFiles = [
        { name: "a", isDirectory: true },
        { name: "subdir", isDirectory: true },
        { name: "file.txt", isDirectory: false },
      ];

      const index = history.findSubdirectoryInParent(
        "/home/user/subdir",
        parentFiles
      );

      expect(index).toBe(1);
    });

    it("should return 0 if subdirectory not found", () => {
      const parentFiles = [
        { name: "a", isDirectory: true },
        { name: "b", isDirectory: true },
      ];

      const index = history.findSubdirectoryInParent(
        "/home/user/missing",
        parentFiles
      );

      expect(index).toBe(0);
    });

    it("should return 0 for root directory", () => {
      const parentFiles = [{ name: "home", isDirectory: true }];

      const index = history.findSubdirectoryInParent("/", parentFiles);

      expect(index).toBe(0);
    });

    it("should ignore non-directory entries", () => {
      const parentFiles = [
        { name: "subdir", isDirectory: false }, // File with same name
        { name: "subdir", isDirectory: true }, // Directory
      ];

      const index = history.findSubdirectoryInParent(
        "/home/subdir",
        parentFiles
      );

      expect(index).toBe(1); // Finds directory, not file
    });
  });

  describe("recent directories [REQ-ADVANCED_NAV]", () => {
    // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
    // how: Maintain LRU-ordered recent path list per pane (max 20); revisiting moves path to front.
    it("should track recent directories", () => {
      history.saveCursorPosition(0, "/home", "a.txt", 0, 0);
      history.saveCursorPosition(0, "/usr", "b.txt", 0, 0);
      history.saveCursorPosition(0, "/var", "c.txt", 0, 0);

      const recents = history.getRecentDirectories(0);

      expect(recents).toHaveLength(3);
      expect(recents[0].path).toBe("/var"); // Most recent first
      expect(recents[1].path).toBe("/usr");
      expect(recents[2].path).toBe("/home");
    });

    it("should move revisited directory to front", () => {
      history.saveCursorPosition(0, "/home", "a.txt", 0, 0);
      history.saveCursorPosition(0, "/usr", "b.txt", 0, 0);
      history.saveCursorPosition(0, "/home", "a.txt", 0, 0); // Revisit

      const recents = history.getRecentDirectories(0);

      expect(recents[0].path).toBe("/home"); // Back to front
      expect(recents[1].path).toBe("/usr");
    });

    it("should limit recent directories to MAX_RECENT", () => {
      // Add 25 directories (MAX is 20)
      for (let i = 0; i < 25; i++) {
        history.saveCursorPosition(0, `/dir${i}`, "file.txt", 0, 0);
      }

      const recents = history.getRecentDirectories(0);

      expect(recents).toHaveLength(20);
      expect(recents[0].path).toBe("/dir24"); // Most recent
    });

    it("should maintain separate recent lists per pane", () => {
      history.saveCursorPosition(0, "/pane0-dir", "a.txt", 0, 0);
      history.saveCursorPosition(1, "/pane1-dir", "b.txt", 0, 0);

      const recents0 = history.getRecentDirectories(0);
      const recents1 = history.getRecentDirectories(1);

      expect(recents0[0].path).toBe("/pane0-dir");
      expect(recents1[0].path).toBe("/pane1-dir");
    });
  });

  describe("navigateBack/Forward [REQ-ADVANCED_NAV]", () => {
    // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
    // how: Walk recent list relative to current path; back moves toward older entries, forward toward newer.
    beforeEach(() => {
      history.saveCursorPosition(0, "/home", "a.txt", 0, 0);
      history.saveCursorPosition(0, "/usr", "b.txt", 0, 0);
      history.saveCursorPosition(0, "/var", "c.txt", 0, 0);
    });

    it("should navigate back through history", () => {
      const prev = history.navigateBack(0, "/var");
      expect(prev).toBe("/usr");

      const prev2 = history.navigateBack(0, "/usr");
      expect(prev2).toBe("/home");
    });

    it("should return null at start of history", () => {
      const prev = history.navigateBack(0, "/home");
      expect(prev).toBeNull();
    });

    it("should navigate forward through history", () => {
      const next = history.navigateForward(0, "/home");
      expect(next).toBe("/usr");

      const next2 = history.navigateForward(0, "/usr");
      expect(next2).toBe("/var");
    });

    it("should return null at end of history", () => {
      const next = history.navigateForward(0, "/var");
      expect(next).toBeNull();
    });
  });

  describe("clearHistory", () => {
    // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
    // how: Remove cursor and recent state for one pane (testing and reset).
    it("should clear all history for pane", () => {
      history.saveCursorPosition(0, "/home", "a.txt", 5, 100);
      history.clearHistory(0);

      const restored = history.restoreCursorPosition(0, "/home", ["a.txt"]);
      expect(restored.cursor).toBe(0);

      const recents = history.getRecentDirectories(0);
      expect(recents).toHaveLength(0);
    });
  });

  // [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] History follows pane content on reorder

  describe("swapPaneHistories [IMPL-PANE_MANAGEMENT]", () => {
    it("swaps history between pane indices", () => {
      history.saveCursorPosition(0, "/a", "a.txt", 1, 0);
      history.saveCursorPosition(1, "/b", "b.txt", 2, 0);

      history.swapPaneHistories(0, 1);

      expect(history.restoreCursorPosition(0, "/b", ["x", "y", "b.txt"]).cursor).toBe(2);
      expect(history.restoreCursorPosition(1, "/a", ["a.txt"]).cursor).toBe(0);
    });
  });

  describe("rotatePaneHistories [IMPL-PANE_MANAGEMENT]", () => {
    it("rotates histories forward with panes", () => {
      history.saveCursorPosition(0, "/p0", "p0.txt", 0, 0);
      history.saveCursorPosition(1, "/p1", "p1.txt", 0, 0);
      history.saveCursorPosition(2, "/p2", "p2.txt", 0, 0);

      history.rotatePaneHistories("forward", 3);

      expect(history.restoreCursorPosition(0, "/p1", ["p1.txt"]).cursor).toBe(0);
      expect(history.restoreCursorPosition(2, "/p0", ["p0.txt"]).cursor).toBe(0);
    });

    // [IMPL-PANE_MANAGEMENT_CyclePanes] [REQ-MULTI_PANE_LAYOUT]
    it("rotates histories backward with panes", () => {
      history.saveCursorPosition(0, "/p0", "p0.txt", 0, 0);
      history.saveCursorPosition(1, "/p1", "p1.txt", 0, 0);
      history.saveCursorPosition(2, "/p2", "p2.txt", 0, 0);

      history.rotatePaneHistories("backward", 3);

      expect(history.restoreCursorPosition(0, "/p2", ["p2.txt"]).cursor).toBe(0);
      expect(history.restoreCursorPosition(2, "/p1", ["p1.txt"]).cursor).toBe(0);
    });
  });

  describe("reorderPaneHistories [IMPL-PANE_MANAGEMENT]", () => {
    it("permutes histories by order mapping", () => {
      history.saveCursorPosition(0, "/a", "a.txt", 0, 0);
      history.saveCursorPosition(1, "/b", "b.txt", 0, 0);
      history.saveCursorPosition(2, "/c", "c.txt", 0, 0);

      history.reorderPaneHistories([2, 0, 1]);

      expect(history.restoreCursorPosition(0, "/c", ["c.txt"]).cursor).toBe(0);
      expect(history.restoreCursorPosition(1, "/a", ["a.txt"]).cursor).toBe(0);
      expect(history.restoreCursorPosition(2, "/b", ["b.txt"]).cursor).toBe(0);
    });
  });
});
