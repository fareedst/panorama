// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: Top-level Directory History with localStorage Bookmarks: Map-based history in React state, localStorage for bookmarks
// Bookmark management with localStorage persistence

/**
 * Bookmark entry
 */
export interface Bookmark {
  id: string;
  path: string;
  label: string;
  created: number;
}

/**
 * Bookmark manager with localStorage persistence
 * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
 */
export class BookmarkManager {
  private readonly STORAGE_KEY = "nx1-file-bookmarks";
  private bookmarks: Bookmark[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: Hydrate bookmarks from localStorage key nx1-file-bookmarks; empty array on SSR, missing, or corrupt data.
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") {
      return; // Server-side rendering guard
    }

    try {
      // Check if localStorage is actually functional
      if (!localStorage || typeof localStorage.getItem !== "function") {
        return;
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.bookmarks = JSON.parse(stored);
      }
    } catch {
      // Silent fail in test environment
      this.bookmarks = [];
    }
  }

  /**
   * Save bookmarks to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Check if localStorage is actually functional
      if (!localStorage || typeof localStorage.setItem !== "function") {
        return;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.bookmarks));
    } catch {
      // Silent fail in test environment
    }
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: Append { id, path, label, created }; persist JSON array; generate unique bm- prefixed id.
   */
  addBookmark(path: string, label: string): Bookmark {
    const bookmark: Bookmark = {
      id: this.generateId(),
      path,
      label,
      created: Date.now(),
    };

    this.bookmarks.push(bookmark);
    this.saveToStorage();
    return bookmark;
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: Remove by id; persist; return false when id not found.
   */
  removeBookmark(id: string): boolean {
    const index = this.bookmarks.findIndex((b) => b.id === id);
    if (index === -1) {
      return false;
    }

    this.bookmarks.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: Change label for existing id; persist; return false when id not found.
   */
  updateBookmark(id: string, label: string): boolean {
    const bookmark = this.bookmarks.find((b) => b.id === id);
    if (!bookmark) {
      return false;
    }

    bookmark.label = label;
    this.saveToStorage();
    return true;
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: Return shallow copy of bookmarks array preserving insertion order.
   */
  getAllBookmarks(): Bookmark[] {
    return [...this.bookmarks];
  }

  /**
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   * how: True when any bookmark.path equals given path.
   */
  isBookmarked(path: string): boolean {
    return this.bookmarks.some((b) => b.path === path);
  }

  /**
   * Clear all bookmarks (useful for testing)
   */
  clearAllBookmarks(): void {
    this.bookmarks = [];
    this.saveToStorage();
  }

  /**
   * Generate unique bookmark ID
   */
  private generateId(): string {
    return `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global bookmark manager instance
 * Shared across WorkspaceView for persistent bookmarks
 */
export const globalBookmarkManager = new BookmarkManager();
