// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]: Top-level Directory History with localStorage Bookmarks: Map-based history in React state, localStorage for bookmarks
// Directory navigation history with per-directory cursor position persistence

/**
 * Per-directory cursor state for restoring position on revisit
 */
export interface DirectoryCursorState {
  /** Filename at cursor position (for robust restoration) */
  filename: string;
  /** Cursor index (fallback if filename not found) */
  cursorIndex: number;
  /** Scroll position in pixels */
  scrollTop: number;
  /** Last visit timestamp */
  timestamp: number;
}

/**
 * Per-pane directory history
 * Map: path -> cursor state
 */
export type PaneHistory = Map<string, DirectoryCursorState>;

/**
 * Recent directory entry for navigation
 */
export interface RecentDirectory {
  path: string;
  lastVisit: number;
}

/**
 * Directory history manager
 * Maintains cursor positions and recent directory lists per pane
 */
export class DirectoryHistory {
  private histories: Map<number, PaneHistory> = new Map();
  private recentDirs: Map<number, RecentDirectory[]> = new Map();
  private readonly MAX_RECENT = 20;

  /**
   * Save cursor position before navigating away from directory
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY]
   */
  saveCursorPosition(
    paneId: number,
    path: string,
    filename: string,
    cursorIndex: number,
    scrollTop: number = 0
  ): void {
    let paneHistory = this.histories.get(paneId);
    if (!paneHistory) {
      paneHistory = new Map();
      this.histories.set(paneId, paneHistory);
    }

    paneHistory.set(path, {
      filename,
      cursorIndex,
      scrollTop,
      timestamp: Date.now(),
    });

    // Update recent directories
    this.addRecentDirectory(paneId, path);
  }

  /**
   * Restore cursor position when revisiting directory
   * Returns cursor index to restore (0 if no history)
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY]
   */
  restoreCursorPosition(
    paneId: number,
    path: string,
    filenames: string[]
  ): { cursor: number; scrollTop: number } {
    const paneHistory = this.histories.get(paneId);
    if (!paneHistory) {
      return { cursor: 0, scrollTop: 0 };
    }

    const state = paneHistory.get(path);
    if (!state) {
      return { cursor: 0, scrollTop: 0 };
    }

    // Try to find file by name first (robust to file additions/removals)
    const filenameIndex = filenames.indexOf(state.filename);
    if (filenameIndex !== -1) {
      return { cursor: filenameIndex, scrollTop: state.scrollTop };
    }

    // Fallback to saved index (clamped to file list length)
    const fallbackCursor = Math.min(state.cursorIndex, filenames.length - 1);
    return { cursor: Math.max(0, fallbackCursor), scrollTop: state.scrollTop };
  }

  /**
   * Find cursor position for parent navigation
   * Returns index of subdirectory in parent list (or 0 if not found)
   * [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
   */
  findSubdirectoryInParent(
    currentPath: string,
    parentFiles: Array<{ name: string; isDirectory: boolean }>
  ): number {
    // Extract current directory name from path
    const pathParts = currentPath.split("/").filter((p) => p.length > 0);
    if (pathParts.length === 0) {
      return 0;
    }

    const currentDirName = pathParts[pathParts.length - 1];

    // Find the directory in parent list
    const index = parentFiles.findIndex(
      (f) => f.isDirectory && f.name === currentDirName
    );

    return index !== -1 ? index : 0;
  }

  /**
   * Add directory to recent list
   */
  private addRecentDirectory(paneId: number, path: string): void {
    let recents = this.recentDirs.get(paneId);
    if (!recents) {
      recents = [];
      this.recentDirs.set(paneId, recents);
    }

    // Remove if already exists
    const existingIndex = recents.findIndex((r) => r.path === path);
    if (existingIndex !== -1) {
      recents.splice(existingIndex, 1);
    }

    // Add to front
    recents.unshift({ path, lastVisit: Date.now() });

    // Limit size
    if (recents.length > this.MAX_RECENT) {
      recents.splice(this.MAX_RECENT);
    }
  }

  /**
   * Get recent directories for pane
   * [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV]
   */
  getRecentDirectories(paneId: number): RecentDirectory[] {
    return this.recentDirs.get(paneId) || [];
  }

  /**
   * Navigate to previous directory in recent list
   * Returns path or null if at start of history
   */
  navigateBack(paneId: number, currentPath: string): string | null {
    const recents = this.recentDirs.get(paneId);
    if (!recents || recents.length === 0) {
      return null;
    }

    const currentIndex = recents.findIndex((r) => r.path === currentPath);
    if (currentIndex === -1 || currentIndex === recents.length - 1) {
      return null;
    }

    return recents[currentIndex + 1].path;
  }

  /**
   * Navigate to next directory in recent list
   * Returns path or null if at end of history
   */
  navigateForward(paneId: number, currentPath: string): string | null {
    const recents = this.recentDirs.get(paneId);
    if (!recents || recents.length === 0) {
      return null;
    }

    const currentIndex = recents.findIndex((r) => r.path === currentPath);
    if (currentIndex <= 0) {
      return null;
    }

    return recents[currentIndex - 1].path;
  }

  /**
   * Clear history for pane (useful for testing)
   */
  clearHistory(paneId: number): void {
    this.histories.delete(paneId);
    this.recentDirs.delete(paneId);
  }

  /**
   * Swap history between two pane indices when panes swap positions.
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
   */
  swapPaneHistories(i: number, j: number): void {
    if (i === j) return;
    const hi = this.histories.get(i);
    const hj = this.histories.get(j);
    if (hi !== undefined) this.histories.set(j, hi);
    else this.histories.delete(j);
    if (hj !== undefined) this.histories.set(i, hj);
    else this.histories.delete(i);

    const ri = this.recentDirs.get(i);
    const rj = this.recentDirs.get(j);
    if (ri !== undefined) this.recentDirs.set(j, ri);
    else this.recentDirs.delete(j);
    if (rj !== undefined) this.recentDirs.set(i, rj);
    else this.recentDirs.delete(i);
  }

  /**
   * Rotate pane histories when panes[] rotates one slot.
   * [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]
   */
  rotatePaneHistories(direction: "forward" | "backward", paneCount: number): void {
    if (paneCount <= 1) return;
    const historyEntries: (PaneHistory | undefined)[] = [];
    const recentEntries: (RecentDirectory[] | undefined)[] = [];
    for (let i = 0; i < paneCount; i++) {
      historyEntries.push(this.histories.get(i));
      recentEntries.push(this.recentDirs.get(i));
    }
    const rotatedHistories =
      direction === "forward"
        ? [...historyEntries.slice(1), historyEntries[0]]
        : [historyEntries[paneCount - 1], ...historyEntries.slice(0, paneCount - 1)];
    const rotatedRecents =
      direction === "forward"
        ? [...recentEntries.slice(1), recentEntries[0]]
        : [recentEntries[paneCount - 1], ...recentEntries.slice(0, paneCount - 1)];
    this.histories.clear();
    this.recentDirs.clear();
    for (let i = 0; i < paneCount; i++) {
      if (rotatedHistories[i] !== undefined) this.histories.set(i, rotatedHistories[i]!);
      if (rotatedRecents[i] !== undefined) this.recentDirs.set(i, rotatedRecents[i]!);
    }
  }

  /**
   * Reorder pane histories when panes[] is permuted by index order.
   * order[newIndex] = oldIndex
   * [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]
   */
  reorderPaneHistories(order: number[]): void {
    const paneCount = order.length;
    const historyEntries: (PaneHistory | undefined)[] = [];
    const recentEntries: (RecentDirectory[] | undefined)[] = [];
    for (let i = 0; i < paneCount; i++) {
      historyEntries.push(this.histories.get(i));
      recentEntries.push(this.recentDirs.get(i));
    }
    this.histories.clear();
    this.recentDirs.clear();
    for (let newIndex = 0; newIndex < paneCount; newIndex++) {
      const oldIndex = order[newIndex];
      if (historyEntries[oldIndex] !== undefined) {
        this.histories.set(newIndex, historyEntries[oldIndex]!);
      }
      if (recentEntries[oldIndex] !== undefined) {
        this.recentDirs.set(newIndex, recentEntries[oldIndex]!);
      }
    }
  }
}

/**
 * Global directory history instance
 * Shared across WorkspaceView for session-level persistence
 */
export const globalDirectoryHistory = new DirectoryHistory();
