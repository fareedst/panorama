// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-MULTI_PANE_LAYOUT] [REQ-KEYBOARD_NAVIGATION]
// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
// Workspace client component managing multiple file panes with directory history and sorting
// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar integration for visual operation access

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import path from "path-browserify";
import type { FileStat, OperationResult, ComparisonMode } from "@/lib/files.types";
import type { LayoutType } from "@/lib/files.layout";
import { calculateLayout } from "@/lib/files.layout";
import { buildEnhancedComparisonIndex } from "@/lib/files.comparison";
import { globalDirectoryHistory } from "@/lib/files.history";
import { globalBookmarkManager } from "@/lib/files.bookmarks";
import { sortFiles, describeFileComparison, type SortCriterion, type SortDirection } from "@/lib/files.utils";
import { initializeKeybindingRegistry, matchKeybinding } from "@/lib/files.keybinds";
import type { KeybindingConfig, FilesCopyConfig, FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";
import FilePane from "./components/FilePane";
import ConfirmDialog, { type FileConflict } from "./components/ConfirmDialog";
import ProgressDialog from "./components/ProgressDialog";
import GotoDialog from "./components/GotoDialog";
import BookmarkDialog from "./components/BookmarkDialog";
import SortDialog from "./components/SortDialog";
import RenameDialog from "./components/RenameDialog";
import { InfoPanel } from "./components/InfoPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { HelpOverlay } from "./components/HelpOverlay";
import { CommandPalette } from "./components/CommandPalette";
import { FinderDialog } from "./components/FinderDialog";
import { SearchDialog } from "./components/SearchDialog";
// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar components
import { WorkspaceToolbar } from "./components/WorkspaceToolbar";
import { PaneToolbar } from "./components/PaneToolbar";
import { SystemToolbar } from "./components/SystemToolbar";

interface PaneState {
  path: string;
  files: FileStat[];
  cursor: number;
  marks: Set<string>;
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] Sort settings
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
}

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Pane initial state from server
interface PaneInitialState {
  path: string;
  files: FileStat[];
}

interface WorkspaceViewProps {
  /** Initial panes from server */
  initialPanes: PaneInitialState[];
  /** Keybindings from server */
  keybindings: KeybindingConfig[];
  /** Copy configuration from server */
  copy: FilesCopyConfig;
  /** Layout configuration from server */
  layout: FilesLayoutConfig;
  /** Column configuration from server [IMPL-FILE_COLUMN_CONFIG] */
  columns: import("@/lib/config.types").FilesColumnConfig[];
  /** Toolbar configuration from server [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] */
  toolbars?: ToolbarsConfig;
}

/**
 * WorkspaceView component - manages multiple file panes with keyboard navigation
 * [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-MULTI_PANE_LAYOUT] [REQ-KEYBOARD_NAVIGATION]
 * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
 * [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar integration
 */
export default function WorkspaceView({
  initialPanes,
  keybindings,
  copy,
  layout: layoutConfig,
  columns,
  toolbars,
}: WorkspaceViewProps) {
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // Initialize keybinding registry synchronously before first render
  // This ensures the registry is available when CommandPalette and HelpOverlay render
  // Use useMemo to initialize only once and not on every render
  useMemo(() => {
    initializeKeybindingRegistry(keybindings);
  }, [keybindings]);
  
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Initialize panes from server data
  // State
  const [panes, setPanes] = useState<PaneState[]>(
    initialPanes.map((pane) => ({
      path: pane.path,
      files: sortFiles([...pane.files], "name", "asc", true), // [IMPL-SORT_FILTER] Apply default sort
      cursor: 0,
      marks: new Set<string>(),
      sortBy: "name",
      sortDirection: "asc",
      sortDirsFirst: true,
    }))
  );
  const [layout, setLayout] = useState<LayoutType>(
    (layoutConfig.default || "Tile") as LayoutType
  );
  const [focusIndex, setFocusIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track scroll triggers for linked pane synchronization
  const [scrollTriggers, setScrollTriggers] = useState<Map<number, number>>(new Map());
  
  // [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Goto dialog state
  const [gotoDialog, setGotoDialog] = useState<{
    isOpen: boolean;
    path: string;
  }>({
    isOpen: false,
    path: "",
  });
  
  // [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Bookmark dialog state
  const [bookmarkDialog, setBookmarkDialog] = useState<{
    isOpen: boolean;
    mode: "list" | "add";
    currentPath: string;
  }>({
    isOpen: false,
    mode: "list",
    currentPath: "",
  });

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-MOUSE_SUPPORT] Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
    paneIndex: number;
  }>({
    isOpen: false,
    filePath: "",
    fileName: "",
    paneIndex: 0,
  });
  
  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL] Comparison mode state
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("off");
  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] Linked navigation state
  // Initialize from config (default true)
  const [linkedMode, setLinkedMode] = useState<boolean>(
    layoutConfig.defaultLinkedMode ?? true
  );
  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track if we're in a sync operation (prevent infinite recursion)
  const syncingRef = useRef<Set<number>>(new Set());
  
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] Sort dialog state
  const [sortDialog, setSortDialog] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });
  
  // [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW] Preview panel state
  const [previewPanel, setPreviewPanel] = useState<{
    type: "info" | "preview" | null;
    filePath: string | null;
  }>({
    type: null,
    filePath: null,
  });
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Help overlay state
  const [showHelp, setShowHelp] = useState(false);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH] Search dialog states
  const [showFinderDialog, setShowFinderDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  // [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    conflicts?: FileConflict[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  const [progressDialog, setProgressDialog] = useState<{
    isOpen: boolean;
    title: string;
    total: number;
    completed: number;
    currentFile: string;
    errors: Array<{ file: string; error: string }>;
    isComplete: boolean;
    result?: OperationResult;
  }>({
    isOpen: false,
    title: "",
    total: 0,
    completed: 0,
    currentFile: "",
    errors: [],
    isComplete: false,
  });
  
  // Update container dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      // Get container dimensions (subtract header/footer height)
      setContainerWidth(window.innerWidth);
      setContainerHeight(window.innerHeight - 120); // Reserve space for header
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  
  // Calculate pane bounds
  const bounds = calculateLayout(
    containerWidth,
    containerHeight,
    panes.length,
    layout
  );
  
  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
  // Build enhanced comparison index when panes change
  const enhancedComparisonIndex = useMemo(() => {
    // Only build if comparison is enabled and we have multiple panes
    if (comparisonMode === "off" || panes.length < 2) {
      return new Map();
    }
    
    return buildEnhancedComparisonIndex(panes.map(p => p.files));
  }, [panes, comparisonMode]);
  
  // Handle navigation into directory
  // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
  const handleNavigate = useCallback(async (paneIndex: number, newPath: string) => {
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Check if this pane is currently syncing
    const isInitiatingNavigation = !syncingRef.current.has(paneIndex);
    
    try {
      const pane = panes[paneIndex];
      
      // Save current cursor position before navigating
      if (pane.files.length > 0 && pane.cursor >= 0 && pane.cursor < pane.files.length) {
        const currentFile = pane.files[pane.cursor];
        globalDirectoryHistory.saveCursorPosition(
          paneIndex,
          pane.path,
          currentFile.name,
          pane.cursor,
          0 // scrollTop - would need ref to get actual scroll position
        );
      }
      
      // Fetch new directory contents via API
      const response = await fetch(`/api/files?path=${encodeURIComponent(newPath)}`);
      
      if (!response.ok) {
        console.error("Failed to list directory:", newPath);
        return;
      }
      
      const newFiles: FileStat[] = await response.json();
      
      // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
      // Apply current pane's sort settings
      const sortedFiles = sortFiles(
        newFiles,
        pane.sortBy,
        pane.sortDirection,
        pane.sortDirsFirst
      );
      
      // Restore cursor position if returning to previously visited directory
      const restored = globalDirectoryHistory.restoreCursorPosition(
        paneIndex,
        newPath,
        sortedFiles.map((f) => f.name)
      );
      
      setPanes((prev) => {
        const updated = [...prev];
        updated[paneIndex] = {
          path: newPath,
          files: sortedFiles,
          cursor: restored.cursor,
          marks: new Set<string>(),
          sortBy: pane.sortBy,
          sortDirection: pane.sortDirection,
          sortDirsFirst: pane.sortDirsFirst,
        };
        return updated;
      });
      
      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
      // Synchronize linked panes (only on initiating navigation)
      if (isInitiatingNavigation && linkedMode && panes.length > 1) {
        const oldPath = pane.path;
        
        // Determine if this is a downward or upward navigation
        // [IMPL-LINKED_NAV] When at root, oldPath+'/' is "//" so newPath.startsWith("//") is false for e.g. /Users; treat from-root-to-subdir as downward
        const normalizedOld = (oldPath === '' ? '/' : oldPath);
        const isDownward = newPath.startsWith(oldPath + '/') ||
          (normalizedOld === '/' && newPath.startsWith('/') && newPath.length > 1);
        // [IMPL-LINKED_NAV] Treat "navigate to root" as upward: newPath+'/' is "//" so oldPath.startsWith("//") is false for e.g. /Users
        const normalizedNew = (newPath === '' ? '/' : newPath);
        const isUpward = normalizedNew === '/'
          ? (oldPath !== '/' && oldPath.length > 1)
          : oldPath.startsWith(normalizedNew + '/');
        
        if (isDownward) {
          // Navigating into subdirectory
          // [IMPL-LINKED_NAV] When at root, oldPath.length+1 is 2 so slice(2) drops "/p"; strip only leading slash.
          const relativePath = normalizedOld === '/' ? newPath.slice(1) : newPath.slice(oldPath.length + 1);
          
          // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track success for auto-disable
          let successCount = 1; // Source pane always succeeds
          let failureCount = 0;
          
          // Navigate other panes to matching subdirectory
          for (let i = 0; i < panes.length; i++) {
            if (i === paneIndex) continue; // Skip source pane
            
            syncingRef.current.add(i); // Mark this pane as syncing
            
            const linkedPane = panes[i];
            const linkedTargetPath = `${linkedPane.path}/${relativePath}`.replace(/\/+/g, '/');
            
            // Check if target directory exists in linked pane
            try {
              const checkResponse = await fetch(`/api/files?path=${encodeURIComponent(linkedTargetPath)}`);
              if (checkResponse.ok) {
                const checkData: FileStat[] = await checkResponse.json();
                // Verify it's a directory (API returns files if it's a directory)
                if (Array.isArray(checkData)) {
                  await handleNavigate(i, linkedTargetPath);
                  successCount++;
                } else {
                  failureCount++;
                }
              } else {
                console.warn(`[IMPL-LINKED_NAV] Target directory not found in pane ${i}: ${linkedTargetPath}`);
                failureCount++;
              }
            } catch (error) {
              console.warn(`[IMPL-LINKED_NAV] Failed to check/navigate linked pane ${i}:`, error);
              failureCount++;
            } finally {
              syncingRef.current.delete(i); // Clear syncing flag
            }
          }
          
          // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Auto-disable if partial navigation failure
          if (successCount > 0 && failureCount > 0) {
            setLinkedMode(false);
            console.warn("[IMPL-LINKED_NAV] Linked navigation disabled - directory structures diverged");
          }
        } else if (isUpward) {
          // Navigating to parent directory
          const stepsUp = oldPath.split('/').filter(Boolean).length - newPath.split('/').filter(Boolean).length;
          
          // Navigate other panes up by same number of levels
          for (let i = 0; i < panes.length; i++) {
            if (i === paneIndex) continue;
            
            syncingRef.current.add(i); // Mark this pane as syncing
            
            const linkedPane = panes[i];
            let linkedTargetPath = linkedPane.path;
            
            // Go up stepsUp levels
            for (let step = 0; step < stepsUp; step++) {
              const parts = linkedTargetPath.split('/').filter(Boolean);
              if (parts.length > 0) {
                parts.pop();
                linkedTargetPath = '/' + parts.join('/');
              } else {
                linkedTargetPath = '/';
                break;
              }
            }
            
            try {
              const checkResponse = await fetch(`/api/files?path=${encodeURIComponent(linkedTargetPath)}`);
              if (checkResponse.ok) {
                await handleNavigate(i, linkedTargetPath);
              } else {
                console.warn(`[IMPL-LINKED_NAV] Target parent not found in pane ${i}: ${linkedTargetPath}`);
              }
            } catch (error) {
              console.warn(`[IMPL-LINKED_NAV] Failed to navigate linked pane ${i} to parent:`, error);
            } finally {
              syncingRef.current.delete(i); // Clear syncing flag
            }
          }
        }
      }
    } catch (error) {
      console.error("Error navigating:", error);
    }
  }, [panes, linkedMode]);

  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
  // Handle cursor movement with linked pane synchronization and scroll-to-center
  const handleCursorMove = useCallback((paneIndex: number, newCursor: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const pane = updated[paneIndex];
      const clampedCursor = Math.max(0, Math.min(newCursor, pane.files.length - 1));
      
      updated[paneIndex] = {
        ...pane,
        cursor: clampedCursor,
      };
      
      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Sync cursor to same filename in all panes when linked
      if (linkedMode && panes.length > 1 && clampedCursor < pane.files.length) {
        const cursorFilename = pane.files[clampedCursor].name;
        
        // Track which panes need scrolling (Map of paneIndex → cursor)
        const triggers = new Map<number, number>();
        
        // Sync cursor to matching filename in all other panes
        for (let i = 0; i < updated.length; i++) {
          if (i === paneIndex) continue; // Skip source pane
          
          const linkedPane = updated[i];
          // Find matching filename in linked pane
          const matchIndex = linkedPane.files.findIndex((f) => f.name === cursorFilename);
          
          if (matchIndex !== -1) {
            // Found matching file, update cursor
            updated[i] = {
              ...linkedPane,
              cursor: matchIndex,
            };
            // Track this pane for scrolling
            triggers.set(i, matchIndex);
          } else {
            // File doesn't exist in this pane, clear selection
            updated[i] = {
              ...linkedPane,
              cursor: -1,
            };
            // No scroll trigger for cleared selection
          }
        }
        
        // Trigger scroll effects in other panes (after state update)
        setScrollTriggers(triggers);
      }
      
      return updated;
    });
  }, [linkedMode, panes.length]);
  
  // Handle file marking [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]
  const handleToggleMark = useCallback((paneIndex: number, filename: string) => {
    setPanes((prev) => {
      const updated = [...prev];
      const marks = new Set(updated[paneIndex].marks);
      
      if (marks.has(filename)) {
        marks.delete(filename);
      } else {
        marks.add(filename);
      }
      
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, []);
  
  // Mark all files in pane [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB]
  const handleMarkAll = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const marks = new Set(updated[paneIndex].files.map((f) => f.name));
      
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, []);
  
  // Invert marks in pane [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB]
  const handleInvertMarks = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const pane = updated[paneIndex];
      const marks = new Set<string>();
      
      // Add files that are NOT currently marked
      for (const file of pane.files) {
        if (!pane.marks.has(file.name)) {
          marks.add(file.name);
        }
      }
      
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, []);
  
  // Clear all marks in pane [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB]
  const handleClearMarks = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks: new Set<string>(),
      };
      return updated;
    });
  }, []);
  
  // [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] Handle file selection from FinderDialog
  const handleFinderSelect = useCallback((file: FileStat) => {
    if (file.isDirectory) {
      // Navigate into directory
      handleNavigate(focusIndex, file.path);
    } else {
      // Move cursor to file
      const pane = panes[focusIndex];
      const fileIndex = pane.files.findIndex(f => f.name === file.name);
      if (fileIndex !== -1) {
        handleCursorMove(focusIndex, fileIndex);
      }
    }
  }, [focusIndex, panes, handleNavigate, handleCursorMove]);
  
  // [REQ-FILE_SEARCH] Handle result selection from SearchDialog
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearchResultSelect = useCallback((filePath: string, _line: number) => {
    // For now, just show in info panel
    // Future: Could open file in editor or preview with line highlighted
    setPreviewPanel({
      type: "preview",
      filePath: filePath,
    });
  }, []);
  
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Handle sort settings change with linked sync
  const handleSortChange = (
    criterion: SortCriterion,
    direction: SortDirection,
    dirsFirst: boolean
  ) => {
    setPanes((prev) => {
      const updated = [...prev];
      
      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Apply sort to all panes if linked
      const panesToUpdate = linkedMode && panes.length > 1
        ? updated.map((_, idx) => idx) // All panes
        : [focusIndex]; // Just focused pane
      
      for (const paneIdx of panesToUpdate) {
        const pane = updated[paneIdx];
        
        // Remember current file for cursor preservation
        const currentFilename = pane.files[pane.cursor]?.name;
        
        // Sort files with new settings
        const sortedFiles = sortFiles(pane.files, criterion, direction, dirsFirst);
        
        // Find cursor position on same file
        const newCursor = currentFilename
          ? sortedFiles.findIndex((f) => f.name === currentFilename)
          : 0;
        
        updated[paneIdx] = {
          ...pane,
          files: sortedFiles,
          cursor: newCursor >= 0 ? newCursor : 0,
          sortBy: criterion,
          sortDirection: direction,
          sortDirsFirst: dirsFirst,
        };
      }
      
      return updated;
    });
  };
  
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] Pane management handlers
  
  /**
   * Add a new pane to the workspace
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE]
   */
  const handleAddPane = useCallback(async () => {
    // Check if pane management is allowed
    if (!layoutConfig.allowPaneManagement) {
      console.warn("Pane management is disabled in configuration");
      return;
    }
    
    // Check if we've reached the maximum number of panes
    const maxPanes = layoutConfig.maxPanes || 4;
    if (panes.length >= maxPanes) {
      console.warn(`Cannot add pane: maximum of ${maxPanes} panes reached`);
      return;
    }
    
    // Clone the focused pane's state (path and sort settings)
    const sourcePane = panes[focusIndex];
    
    try {
      // Fetch files for the new pane (same directory as focused pane)
      const response = await fetch(`/api/files?path=${encodeURIComponent(sourcePane.path)}`);
      if (response.ok) {
        const files: FileStat[] = await response.json();
        
        // Create new pane with same settings as source
        const newPane: PaneState = {
          path: sourcePane.path,
          files: sortFiles([...files], sourcePane.sortBy, sourcePane.sortDirection, sourcePane.sortDirsFirst),
          cursor: 0,
          marks: new Set<string>(),
          sortBy: sourcePane.sortBy,
          sortDirection: sourcePane.sortDirection,
          sortDirsFirst: sourcePane.sortDirsFirst,
        };
        
        setPanes((prev) => [...prev, newPane]);
        // Set focus to the new pane
        setFocusIndex(panes.length);
      }
    } catch (error) {
      console.error("Failed to add pane:", error);
    }
  }, [panes, focusIndex, layoutConfig]);
  
  /**
   * Remove a pane from the workspace
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE]
   */
  const handleRemovePane = useCallback((paneIndex: number) => {
    // Check if pane management is allowed
    if (!layoutConfig.allowPaneManagement) {
      console.warn("Pane management is disabled in configuration");
      return;
    }
    
    // Cannot remove if only one pane left
    if (panes.length <= 1) {
      console.warn("Cannot remove pane: at least one pane must remain");
      return;
    }
    
    // Remove the pane
    setPanes((prev) => {
      const updated = [...prev];
      updated.splice(paneIndex, 1);
      return updated;
    });
    
    // Adjust focus index if necessary
    setFocusIndex((prev) => {
      if (paneIndex < prev) {
        // Removed pane before focused pane, shift focus left
        return prev - 1;
      } else if (paneIndex === prev) {
        // Removed the focused pane, focus previous or first
        return Math.max(0, prev - 1);
      }
      // Removed pane after focused pane, no change needed
      return prev;
    });
  }, [panes, layoutConfig]);
  
  // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] Bulk operation handlers
  
  /**
   * Get files to operate on: marked files if any, otherwise cursor file
   */
  const getOperationFiles = useCallback((paneIndex: number): string[] => {
    const pane = panes[paneIndex];
    
    if (pane.marks.size > 0) {
      // Use marked files - get full paths
      const markedFiles: string[] = [];
      for (const filename of pane.marks) {
        const file = pane.files.find((f) => f.name === filename);
        if (file) {
          markedFiles.push(file.path);
        }
      }
      return markedFiles;
    } else {
      // Use cursor file
      const file = pane.files[pane.cursor];
      return file ? [file.path] : [];
    }
  }, [panes]);
  
  /**
   * Execute bulk copy operation
   * [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [REQ-BULK_FILE_OPS]
   */
  const handleBulkCopy = useCallback(async () => {
    // Need at least 2 panes for cross-pane copy
    if (panes.length < 2) {
      alert("Copy requires at least 2 panes");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Destination is the other pane
    const destPaneIndex = focusIndex === 0 ? 1 : 0;
    const destDir = panes[destPaneIndex].path;
    
    // [IMPL-OVERWRITE_PROMPT] Detect file conflicts
    const conflicts: FileConflict[] = [];
    for (const sourcePath of sources) {
      const basename = path.basename(sourcePath);
      const existingFile = panes[destPaneIndex].files.find(f => f.name === basename);
      
      if (existingFile) {
        // Find source file stat
        const sourceFile = panes[focusIndex].files.find(f => f.path === sourcePath);
        if (sourceFile) {
          const { sourceSummary, existingSummary, comparison } = describeFileComparison(
            sourceFile,
            existingFile
          );
          conflicts.push({
            name: basename,
            sourceSummary,
            existingSummary,
            comparison,
          });
        }
      }
    }
    
    // Build message
    let message = `Copy ${sources.length} file(s) to:\n${destDir}`;
    if (conflicts.length > 0) {
      message += `\n\n${conflicts.length} file(s) will be overwritten.`;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Copy Files",
      message,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Copying Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-copy",
              sources,
              dest: destDir,
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Copy Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh both panes
          await handleNavigate(focusIndex, panes[focusIndex].path);
          await handleNavigate(destPaneIndex, panes[destPaneIndex].path);
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("Bulk copy failed:", error);
          alert(`Copy failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks]);
  
  /**
   * Execute bulk move operation
   * [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [REQ-BULK_FILE_OPS]
   */
  const handleBulkMove = useCallback(async () => {
    // Need at least 2 panes for cross-pane move
    if (panes.length < 2) {
      alert("Move requires at least 2 panes");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Destination is the other pane
    const destPaneIndex = focusIndex === 0 ? 1 : 0;
    const destDir = panes[destPaneIndex].path;
    
    // [IMPL-OVERWRITE_PROMPT] Detect file conflicts
    const conflicts: FileConflict[] = [];
    for (const sourcePath of sources) {
      const basename = path.basename(sourcePath);
      const existingFile = panes[destPaneIndex].files.find(f => f.name === basename);
      
      if (existingFile) {
        // Find source file stat
        const sourceFile = panes[focusIndex].files.find(f => f.path === sourcePath);
        if (sourceFile) {
          const { sourceSummary, existingSummary, comparison } = describeFileComparison(
            sourceFile,
            existingFile
          );
          conflicts.push({
            name: basename,
            sourceSummary,
            existingSummary,
            comparison,
          });
        }
      }
    }
    
    // Build message
    let message = `Move ${sources.length} file(s) to:\n${destDir}`;
    if (conflicts.length > 0) {
      message += `\n\n${conflicts.length} file(s) will be overwritten.`;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Move Files",
      message,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Moving Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-move",
              sources,
              dest: destDir,
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Move Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh both panes
          await handleNavigate(focusIndex, panes[focusIndex].path);
          await handleNavigate(destPaneIndex, panes[destPaneIndex].path);
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("Bulk move failed:", error);
          alert(`Move failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks]);
  
  /**
   * Execute bulk delete operation
   */
  const handleBulkDelete = useCallback(async () => {
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Delete Files",
      message: `Permanently delete ${sources.length} file(s)?\n\nThis action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Deleting Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-delete",
              sources,
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Delete Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh current pane
          await handleNavigate(focusIndex, panes[focusIndex].path);
          
          // Clear marks
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("Bulk delete failed:", error);
          alert(`Delete failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Helper to get other visible pane directories
  /**
   * Get all pane directories except the focused pane
   * [IMPL-NSYNC_ENGINE]
   */
  const getOtherPaneDirs = useCallback((): string[] => {
    return panes
      .map((pane, idx) => (idx !== focusIndex ? pane.path : null))
      .filter((p): p is string => p !== null);
  }, [panes, focusIndex]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Copy to all other panes
  /**
   * Execute CopyAll operation - copy sources to ALL other visible panes
   * [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
   */
  const handleCopyAll = useCallback(async () => {
    const destinations = getOtherPaneDirs();
    
    // Need at least 2 panes (1 source + 1+ destinations)
    if (destinations.length === 0) {
      alert("CopyAll requires at least 2 panes. Use regular copy (c) instead.");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Build message
    const message = `Copy ${sources.length} file(s) to ${destinations.length} pane(s):\n${destinations.join("\n")}`;
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Copy to All Panes",
      message,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Copying to All Panes",
          total: sources.length * destinations.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "sync-all",
              sources,
              destinations,
              move: false,
              compareMethod: "size-mtime",
              verify: false,
            }),
          });
          
          const result = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Copy Complete",
            total: sources.length * destinations.length,
            completed: result.itemsCompleted,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh all panes
          await Promise.all(panes.map((pane, idx) => handleNavigate(idx, pane.path)));
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("CopyAll failed:", error);
          alert(`CopyAll failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, getOtherPaneDirs, confirmDialog, progressDialog, handleNavigate, handleClearMarks]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Move to all other panes
  /**
   * Execute MoveAll operation - move sources to ALL other visible panes
   * [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]
   */
  const handleMoveAll = useCallback(async () => {
    const destinations = getOtherPaneDirs();
    
    // Need at least 2 panes (1 source + 1+ destinations)
    if (destinations.length === 0) {
      alert("MoveAll requires at least 2 panes. Use regular move (m) instead.");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Build message
    const message = `Move ${sources.length} file(s) to ${destinations.length} pane(s):\n${destinations.join("\n")}\n\nSource files will be deleted after successful sync to ALL destinations.`;
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Move to All Panes",
      message,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Moving to All Panes",
          total: sources.length * destinations.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "sync-all",
              sources,
              destinations,
              move: true,
              compareMethod: "size-mtime",
              verify: false,
            }),
          });
          
          const result = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Move Complete",
            total: sources.length * destinations.length,
            completed: result.itemsCompleted,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh all panes
          await Promise.all(panes.map((pane, idx) => handleNavigate(idx, pane.path)));
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("MoveAll failed:", error);
          alert(`MoveAll failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, getOtherPaneDirs, confirmDialog, progressDialog, handleNavigate, handleClearMarks]);

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-MOUSE_SUPPORT] Rename single file (keyboard r or context menu)
  const handleRenameConfirm = useCallback(
    (filePath: string, paneIndex: number, newName: string) => {
      const dir = path.dirname(filePath);
      const newPath = path.join(dir, newName);
      setRenameDialog((prev) => ({ ...prev, isOpen: false }));
      fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "rename", src: filePath, dest: newPath }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((j: { error?: string }) => { throw new Error(j.error || res.statusText); });
          return res;
        })
        .then(() => handleNavigate(paneIndex, dir))
        .catch((e) => {
          console.error("Rename failed:", e);
          alert(`Rename failed: ${String(e)}`);
        });
    },
    [handleNavigate]
  );

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
  // Helper: Navigate to parent directory with cursor positioning
  const handleParentNavigation = useCallback(async () => {
    const pane = panes[focusIndex];
    if (!pane) return;
    
    const currentPath = pane.path;
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    
    if (parentPath === currentPath) return; // Already at root
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Save parent cursor position on subdirectory name
    // This ensures when handleNavigate restores cursor, it finds the subdirectory
    const subdirName = currentPath.split("/").filter(Boolean).pop() || "";
    if (subdirName) {
      globalDirectoryHistory.saveCursorPosition(
        focusIndex,
        parentPath,
        subdirName,
        0, // Will be recalculated by findIndex in restoreCursorPosition
        0
      );
    }
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Use handleNavigate to trigger linked sync
    await handleNavigate(focusIndex, parentPath);
  }, [panes, focusIndex, handleNavigate]);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // Action handlers registry (maps action names to handler functions)
  const actionHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    const pane = panes[focusIndex];
    if (!pane) return handlers;
    
    // System
    handlers.set("help.show", () => {
      setShowHelp((prev) => !prev);
    });
    
    handlers.set("command.palette", () => {
      setShowCommandPalette((prev) => !prev);
    });
    
    // [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] Search handlers
    handlers.set("search.finder", () => {
      setShowFinderDialog(true);
    });
    
    handlers.set("search.content", () => {
      setShowSearchDialog(true);
    });
    
    // Navigation
    handlers.set("navigate.up", () => {
      if (pane.cursor > 0) {
        handleCursorMove(focusIndex, pane.cursor - 1);
      }
    });
    
    handlers.set("navigate.down", () => {
      if (pane.cursor < pane.files.length - 1) {
        handleCursorMove(focusIndex, pane.cursor + 1);
      }
    });
    
    handlers.set("navigate.enter", () => {
      const file = pane.files[pane.cursor];
      if (file && file.isDirectory) {
        handleNavigate(focusIndex, file.path);
      }
    });
    
    handlers.set("navigate.parent", () => {
      void handleParentNavigation();
    });
    
    handlers.set("navigate.tab", () => {
      setFocusIndex((prev) => (prev + 1) % panes.length);
    });
    
    handlers.set("navigate.first", () => {
      if (pane.files.length > 0) {
        handleCursorMove(focusIndex, 0);
      }
    });
    
    handlers.set("navigate.last", () => {
      if (pane.files.length > 0) {
        handleCursorMove(focusIndex, pane.files.length - 1);
      }
    });
    
    handlers.set("navigate.home", () => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || "/";
      handleNavigate(focusIndex, homeDir);
    });
    
    // File Operations
    handlers.set("file.copy", () => {
      handleBulkCopy();
    });
    
    handlers.set("file.move", () => {
      handleBulkMove();
    });

    // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Multi-destination operations
    handlers.set("file.copyAll", () => {
      handleCopyAll();
    });
    
    handlers.set("file.moveAll", () => {
      handleMoveAll();
    });
    
    handlers.set("file.delete", () => {
      handleBulkDelete();
    });
    
    handlers.set("file.rename", () => {
      const file = pane.files[pane.cursor];
      if (file) {
        setRenameDialog({
          isOpen: true,
          filePath: file.path,
          fileName: file.name,
          paneIndex: focusIndex,
        });
      }
    });
    
    // Marking
    handlers.set("mark.toggle", () => {
      // Space: Mark and move down
      const file = pane.files[pane.cursor];
      if (file) {
        handleToggleMark(focusIndex, file.name);
        if (pane.cursor < pane.files.length - 1) {
          handleCursorMove(focusIndex, pane.cursor + 1);
        }
      }
    });
    
    handlers.set("mark.toggle-cursor", () => {
      // M: Toggle mark (no move)
      const file = pane.files[pane.cursor];
      if (file) {
        handleToggleMark(focusIndex, file.name);
      }
    });
    
    handlers.set("mark.all", () => {
      handleMarkAll(focusIndex);
    });
    
    handlers.set("mark.invert", () => {
      handleInvertMarks(focusIndex);
    });
    
    handlers.set("mark.clear", () => {
      handleClearMarks(focusIndex);
    });
    
    // View & Sort
    handlers.set("view.sort", () => {
      setSortDialog({ isOpen: true });
    });
    
    handlers.set("view.comparison", () => {
      if (panes.length < 2) {
        // Comparison requires at least 2 panes
        return;
      }
      setComparisonMode((prev) => {
        switch (prev) {
          case "off": return "name";
          case "name": return "size";
          case "size": return "time";
          case "time": return "off";
          default: return "off";
        }
      });
    });
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] Link toggle handler
    handlers.set("link.toggle", () => {
      if (panes.length < 2) {
        // Linking requires at least 2 panes
        return;
      }
      setLinkedMode((prev) => !prev);
    });
    
    handlers.set("view.hidden", () => {
      // TODO: Implement hidden files toggle
      console.info("[IMPL-KEYBINDS] Hidden files toggle not yet implemented");
    });
    
    // Preview
    handlers.set("preview.info", () => {
      const file = pane.files[pane.cursor];
      if (file) {
        setPreviewPanel((prev) => {
          if (prev.type === "info" && prev.filePath === file.path) {
            // Close if same file
            return { type: null, filePath: null };
          }
          // Open info panel
          return { type: "info", filePath: file.path };
        });
      }
    });
    
    handlers.set("preview.content", () => {
      const file = pane.files[pane.cursor];
      if (file && !file.isDirectory) {
        setPreviewPanel((prev) => {
          if (prev.type === "preview" && prev.filePath === file.path) {
            // Close if same file
            return { type: null, filePath: null };
          }
          // Open preview panel
          return { type: "preview", filePath: file.path };
        });
      }
    });
    
    // Advanced
    handlers.set("bookmark.goto", () => {
      setGotoDialog({
        isOpen: true,
        path: pane.path,
      });
    });
    
    handlers.set("bookmark.add", () => {
      const label = prompt(`Bookmark ${pane.path} as:`, pane.path.split("/").pop() || "Root");
      if (label) {
        globalBookmarkManager.addBookmark(pane.path, label);
        alert(`Bookmarked: ${label}`);
      }
    });
    
    handlers.set("bookmark.list", () => {
      setBookmarkDialog({
        isOpen: true,
        mode: "list",
        currentPath: pane.path,
      });
    });
    
    handlers.set("history.back", () => {
      const prevPath = globalDirectoryHistory.navigateBack(focusIndex, pane.path);
      if (prevPath) {
        handleNavigate(focusIndex, prevPath);
      }
    });
    
    handlers.set("history.forward", () => {
      const nextPath = globalDirectoryHistory.navigateForward(focusIndex, pane.path);
      if (nextPath) {
        handleNavigate(focusIndex, nextPath);
      }
    });
    
    // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Pane management
    handlers.set("pane.add", () => {
      void handleAddPane();
    });
    
    handlers.set("pane.remove", () => {
      handleRemovePane(focusIndex);
    });
    
    handlers.set("pane.refresh", () => {
      void handleNavigate(focusIndex, pane.path);
    });
    
    handlers.set("pane.refresh-all", () => {
      void Promise.all(
        panes.map((p, idx) => handleNavigate(idx, p.path))
      );
    });
    
    return handlers;
  }, [panes, focusIndex, handleParentNavigation, handleNavigate, handleBulkCopy, handleBulkMove, handleBulkDelete, handleAddPane, handleRemovePane, handleClearMarks, handleCursorMove, handleToggleMark, handleMarkAll, handleInvertMarks]);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // Keyboard event handler using keybinding registry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Skip if modal overlays are open (they handle their own keybindings)
      if (showHelp || showCommandPalette || showFinderDialog || showSearchDialog) {
        return;
      }
      
      // Match keybinding to action
      const action = matchKeybinding(e);
      if (action) {
        const handler = actionHandlers.get(action);
        if (handler) {
          e.preventDefault();
          handler();
        } else {
          console.warn(
            `[IMPL-KEYBINDS] No handler registered for action: ${action}`
          );
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionHandlers, showHelp, showCommandPalette, showFinderDialog, showSearchDialog]);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // Execute action from command palette
  const handleExecuteAction = (action: string) => {
    const handler = actionHandlers.get(action);
    if (handler) {
      handler();
    } else {
      console.warn(
        `[IMPL-KEYBINDS] Command palette: no handler for action: ${action}`
      );
    }
  };
  
  // [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS]
  // Track active/disabled actions for toolbar buttons
  const activeActions = useMemo(() => {
    const active = new Set<string>();
    if (linkedMode) active.add('link.toggle');
    // showHidden not yet implemented - TODO: add when view.hidden is implemented
    if (comparisonMode !== "off") active.add('view.comparison');
    return active;
  }, [linkedMode, comparisonMode]);
  
  const disabledActions = useMemo(() => {
    const disabled = new Set<string>();
    const focusedPane = panes[focusIndex];
    
    if (!focusedPane || focusedPane.files.length === 0) {
      // Disable file operations when no files
      disabled.add('file.copy');
      disabled.add('file.move');
      disabled.add('file.delete');
      disabled.add('file.rename');
      disabled.add('preview.info');
      disabled.add('preview.content');
    }
    
    // Disable marking actions when no marks
    if (!focusedPane || focusedPane.marks.size === 0) {
      disabled.add('mark.clear');
      disabled.add('mark.invert');
    }
    
    // Disable navigation at boundaries
    if (focusedPane && focusedPane.cursor === 0) {
      disabled.add('navigate.up');
      disabled.add('navigate.first');
    }
    if (focusedPane && focusedPane.cursor === focusedPane.files.length - 1) {
      disabled.add('navigate.down');
      disabled.add('navigate.last');
    }
    
    // Disable pane management at limits
    if (panes.length >= (layoutConfig.maxPanes || 4)) {
      disabled.add('pane.add');
    }
    if (panes.length <= 1) {
      disabled.add('pane.remove');
    }
    
    return disabled;
  }, [panes, focusIndex, layoutConfig]);
  
  return (
    <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              File Manager
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Browse and manage server files
            </p>
          </div>
          
          {/* Layout selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Layout:
            </label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutType)}
              className="px-3 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="Tile">Tile</option>
              <option value="OneRow">One Row</option>
              <option value="OneColumn">One Column</option>
              <option value="Fullscreen">Fullscreen</option>
            </select>
          </div>
        </div>
      </header>
      
      {/* [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbars */}
      {toolbars && toolbars.enabled && (
        <>
          {/* Workspace toolbar */}
          {toolbars.workspace.enabled && toolbars.workspace.position === 'top' && (
            <WorkspaceToolbar
              config={toolbars.workspace}
              onAction={handleExecuteAction}
              activeActions={activeActions}
              disabledActions={disabledActions}
            />
          )}
          
          {/* Pane toolbar */}
          {toolbars.pane.enabled && toolbars.pane.position === 'top' && (
            <PaneToolbar
              config={toolbars.pane}
              onAction={handleExecuteAction}
              activeActions={activeActions}
              disabledActions={disabledActions}
            />
          )}
          
          {/* System toolbar */}
          {toolbars.system.enabled && toolbars.system.position === 'top' && (
            <SystemToolbar
              config={toolbars.system}
              onAction={handleExecuteAction}
              activeActions={activeActions}
              disabledActions={disabledActions}
            />
          )}
        </>
      )}
      
      {/* Workspace area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
        }}
      >
        {panes.map((pane, index) => (
          <FilePane
            key={index}
            path={pane.path}
            files={pane.files}
            cursor={pane.cursor}
            marks={pane.marks}
            bounds={bounds[index] || { x: 0, y: 0, width: 0, height: 0 }}
            focused={index === focusIndex}
            onNavigate={(newPath) => handleNavigate(index, newPath)}
            onCursorMove={(newCursor) => handleCursorMove(index, newCursor)}
            onToggleMark={(filename) => handleToggleMark(index, filename)}
            comparisonMode={comparisonMode}
            comparisonIndex={enhancedComparisonIndex}
            paneIndex={index}
            sortBy={pane.sortBy}
            sortDirection={pane.sortDirection}
            sortDirsFirst={pane.sortDirsFirst}
            linked={linkedMode && panes.length > 1} // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
            scrollTrigger={scrollTriggers.get(index)} // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Scroll sync
            onFocusRequest={() => setFocusIndex(index)}
            columns={columns} // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
            onRename={(file) => setRenameDialog({ isOpen: true, filePath: file.path, fileName: file.name, paneIndex: index })}
          />
        ))}
      </div>
      
      {/* Keyboard shortcuts help [REQ-KEYBOARD_SHORTCUTS_COMPLETE] */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 p-2">
        <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
          <span>↑↓: Navigate</span>
          <span>Enter: Open</span>
          <span>Backspace: Parent</span>
          <span>Tab: Next Pane</span>
          <span>M: Mark</span>
          <span>Space: Mark+Down</span>
          <span>Shift+M: Mark All</span>
          <span>Ctrl+M: Invert</span>
          <span>Esc: Clear Marks</span>
          <span className="text-blue-600 dark:text-blue-400">C: Copy</span>
          <span className="text-blue-600 dark:text-blue-400">V: Move</span>
          <span className="text-red-600 dark:text-red-400">D: Delete</span>
          <span className="text-blue-600 dark:text-blue-400">R: Rename</span>
          <span className="text-green-600 dark:text-green-400">G: Goto</span>
          <span className="text-green-600 dark:text-green-400">B: Bookmark</span>
          <span className="text-green-600 dark:text-green-400">Ctrl+B: List</span>
          <span className="text-green-600 dark:text-green-400">Alt+←→: History</span>
          <span className="text-yellow-600 dark:text-yellow-400">S: Sort</span>
          <span className="text-cyan-600 dark:text-cyan-400">I: Info</span>
          <span className="text-cyan-600 dark:text-cyan-400">Q: Preview</span>
          {panes.length >= 2 && (
            <span className="text-purple-600 dark:text-purple-400">
              `: Compare ({comparisonMode})
            </span>
          )}
          {/* [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Link mode indicator */}
          {linkedMode && panes.length >= 2 && (
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              🔗 L: Linked
            </span>
          )}
        </div>
      </footer>
      
      {/* [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [REQ-BULK_FILE_OPS] Dialogs */}
      <ConfirmDialog
        title={confirmDialog.title}
        message={confirmDialog.message}
        isOpen={confirmDialog.isOpen}
        destructive={confirmDialog.title.includes("Delete")}
        conflicts={confirmDialog.conflicts}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      <ProgressDialog
        title={progressDialog.title}
        total={progressDialog.total}
        completed={progressDialog.completed}
        currentFile={progressDialog.currentFile}
        errors={progressDialog.errors}
        isComplete={progressDialog.isComplete}
        result={progressDialog.result}
        isOpen={progressDialog.isOpen}
        onClose={() => setProgressDialog({ ...progressDialog, isOpen: false })}
      />
      
      {/* [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Navigation dialogs */}
      <GotoDialog
        isOpen={gotoDialog.isOpen}
        initialPath={gotoDialog.path}
        onClose={() => setGotoDialog({ ...gotoDialog, isOpen: false })}
        onNavigate={(path) => handleNavigate(focusIndex, path)}
      />

      {/* [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-MOUSE_SUPPORT] Rename dialog */}
      <RenameDialog
        isOpen={renameDialog.isOpen}
        initialName={renameDialog.fileName}
        onConfirm={(newName) => handleRenameConfirm(renameDialog.filePath, renameDialog.paneIndex, newName)}
        onClose={() => setRenameDialog((prev) => ({ ...prev, isOpen: false }))}
      />
      
      <BookmarkDialog
        isOpen={bookmarkDialog.isOpen}
        onClose={() => setBookmarkDialog({ ...bookmarkDialog, isOpen: false })}
        onNavigate={(path) => handleNavigate(focusIndex, path)}
      />
      
      {/* [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] Sort dialog */}
      <SortDialog
        isOpen={sortDialog.isOpen}
        currentCriterion={panes[focusIndex]?.sortBy || "name"}
        currentDirection={panes[focusIndex]?.sortDirection || "asc"}
        currentDirsFirst={panes[focusIndex]?.sortDirsFirst ?? true}
        onApply={handleSortChange}
        onClose={() => setSortDialog({ isOpen: false })}
      />
      
      {/* [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW] Preview panels */}
      {previewPanel.type === "info" && (
        <InfoPanel
          filePath={previewPanel.filePath}
          onClose={() => setPreviewPanel({ type: null, filePath: null })}
        />
      )}
      
      {previewPanel.type === "preview" && (
        <PreviewPanel
          filePath={previewPanel.filePath}
          onClose={() => setPreviewPanel({ type: null, filePath: null })}
        />
      )}
      
      {/* [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Help and command palette */}
      <HelpOverlay 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExecute={handleExecuteAction}
      />
      
      {/* [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH] Search dialogs */}
      <FinderDialog
        key={showFinderDialog ? "finder-open" : "finder-closed"}
        isOpen={showFinderDialog}
        onClose={() => setShowFinderDialog(false)}
        onSelect={handleFinderSelect}
        files={panes[focusIndex]?.files || []}
        copy={copy?.search}
      />
      
      <SearchDialog
        key={showSearchDialog ? "search-open" : "search-closed"}
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onSelectResult={handleSearchResultSelect}
        basePath={panes[focusIndex]?.path || "/"}
        copy={copy?.search}
      />
    </div>
  );
}
