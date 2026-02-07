// [TEST-ADVANCED_NAV] [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV]
// Tests for bookmark management

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BookmarkManager } from "./files.bookmarks";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("BookmarkManager [REQ-ADVANCED_NAV]", () => {
  let manager: BookmarkManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new BookmarkManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("addBookmark [IMPL-DIR_HISTORY]", () => {
    it("should add new bookmark", () => {
      const bookmark = manager.addBookmark("/home/user", "Home Directory");

      expect(bookmark.path).toBe("/home/user");
      expect(bookmark.label).toBe("Home Directory");
      expect(bookmark.id).toBeTruthy();
      expect(bookmark.created).toBeGreaterThan(0);
    });

    it("should save bookmark to localStorage", () => {
      manager.addBookmark("/test", "Test");

      const stored = localStorage.getItem("nx1-file-bookmarks");
      expect(stored).toBeTruthy();

      const bookmarks = JSON.parse(stored!);
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].path).toBe("/test");
    });

    it("should generate unique IDs", () => {
      const bm1 = manager.addBookmark("/path1", "Label1");
      const bm2 = manager.addBookmark("/path2", "Label2");

      expect(bm1.id).not.toBe(bm2.id);
    });
  });

  describe("removeBookmark [IMPL-DIR_HISTORY]", () => {
    it("should remove bookmark by ID", () => {
      const bookmark = manager.addBookmark("/test", "Test");
      const removed = manager.removeBookmark(bookmark.id);

      expect(removed).toBe(true);
      expect(manager.getAllBookmarks()).toHaveLength(0);
    });

    it("should return false if ID not found", () => {
      const removed = manager.removeBookmark("non-existent-id");
      expect(removed).toBe(false);
    });

    it("should update localStorage after removal", () => {
      const bm1 = manager.addBookmark("/path1", "Label1");
      manager.addBookmark("/path2", "Label2");
      manager.removeBookmark(bm1.id);

      const stored = localStorage.getItem("nx1-file-bookmarks");
      const bookmarks = JSON.parse(stored!);

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].path).toBe("/path2");
    });
  });

  describe("updateBookmark [IMPL-DIR_HISTORY]", () => {
    it("should update bookmark label", () => {
      const bookmark = manager.addBookmark("/test", "Original Label");
      const updated = manager.updateBookmark(bookmark.id, "New Label");

      expect(updated).toBe(true);

      const all = manager.getAllBookmarks();
      expect(all[0].label).toBe("New Label");
    });

    it("should return false if ID not found", () => {
      const updated = manager.updateBookmark("non-existent-id", "New Label");
      expect(updated).toBe(false);
    });

    it("should persist update to localStorage", () => {
      const bookmark = manager.addBookmark("/test", "Original");
      manager.updateBookmark(bookmark.id, "Updated");

      const stored = localStorage.getItem("nx1-file-bookmarks");
      const bookmarks = JSON.parse(stored!);

      expect(bookmarks[0].label).toBe("Updated");
    });
  });

  describe("getAllBookmarks [REQ-ADVANCED_NAV]", () => {
    it("should return all bookmarks", () => {
      manager.addBookmark("/path1", "Label1");
      manager.addBookmark("/path2", "Label2");
      manager.addBookmark("/path3", "Label3");

      const all = manager.getAllBookmarks();

      expect(all).toHaveLength(3);
      expect(all[0].path).toBe("/path1");
      expect(all[1].path).toBe("/path2");
      expect(all[2].path).toBe("/path3");
    });

    it("should return copy of bookmarks array", () => {
      manager.addBookmark("/test", "Test");

      const all1 = manager.getAllBookmarks();
      const all2 = manager.getAllBookmarks();

      expect(all1).not.toBe(all2); // Different array instances
      expect(all1).toEqual(all2); // Same content
    });

    it("should return empty array if no bookmarks", () => {
      const all = manager.getAllBookmarks();
      expect(all).toEqual([]);
    });
  });

  describe("isBookmarked", () => {
    it("should check if path is bookmarked", () => {
      manager.addBookmark("/bookmarked", "Label");

      expect(manager.isBookmarked("/bookmarked")).toBe(true);
      expect(manager.isBookmarked("/not-bookmarked")).toBe(false);
    });
  });

  describe("clearAllBookmarks", () => {
    it("should clear all bookmarks", () => {
      manager.addBookmark("/path1", "Label1");
      manager.addBookmark("/path2", "Label2");

      manager.clearAllBookmarks();

      expect(manager.getAllBookmarks()).toHaveLength(0);

      const stored = localStorage.getItem("nx1-file-bookmarks");
      expect(JSON.parse(stored!)).toEqual([]);
    });
  });

  describe("localStorage persistence", () => {
    it("should load bookmarks from localStorage on init", () => {
      // Manually set localStorage
      const bookmarks = [
        {
          id: "bm-1",
          path: "/existing",
          label: "Existing",
          created: Date.now(),
        },
      ];
      localStorage.setItem("nx1-file-bookmarks", JSON.stringify(bookmarks));

      // Create new manager (should load from storage)
      const newManager = new BookmarkManager();
      const all = newManager.getAllBookmarks();

      expect(all).toHaveLength(1);
      expect(all[0].path).toBe("/existing");
    });

    it("should handle missing localStorage gracefully", () => {
      localStorage.clear();

      const newManager = new BookmarkManager();
      expect(newManager.getAllBookmarks()).toEqual([]);
    });

    it("should handle corrupt localStorage data", () => {
      localStorage.setItem("nx1-file-bookmarks", "invalid json {");

      const newManager = new BookmarkManager();
      expect(newManager.getAllBookmarks()).toEqual([]);
      // Corrupt data is handled gracefully with silent fail
    });
  });
});
