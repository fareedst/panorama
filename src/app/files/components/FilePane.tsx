// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: Top-level File Pane Component: Client component renders file list with cursor, marks, comparison colors, and proper date conversion
// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
// Individual file pane component with sort display, context menu, and drag-drop

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { FileStat, ComparisonMode, EnhancedCompareState } from "@/lib/files.types";
import type { PaneBounds } from "@/lib/files.layout";
import type { FilesColumnConfig, FileColumnId } from "@/lib/config.types";
import {
  buildFileRowGridTemplate,
  formatFileColumnCell,
  getVisibleFileColumns,
  measureFileMetadataColumnWidths,
  type MeasuredFileColumnWidths,
} from "@/lib/file-columns";
import { getSortLabel, getSortDirectionSymbol, type SortCriterion, type SortDirection } from "@/lib/files.utils";
import ContextMenu from "./ContextMenu";
import FileColumnContextMenu from "./FileColumnContextMenu";
import type { DisplayFilterSpec } from "@/lib/display-filter.types";
import { DisplaySpecSelector } from "./DisplaySpecSelector";
import { CrossPaneVisibilitySelector } from "./CrossPaneVisibilitySelector";
import type { CrossPaneVisibilityPreset } from "@/lib/cross-pane-visibility.types";

interface FilePaneProps {
  /** Current directory path */
  path: string;
  /** Files in current directory */
  files: FileStat[];
  /** Cursor position (0-indexed) */
  cursor: number;
  /** Set of marked file names */
  marks: Set<string>;
  /** Pane bounds from layout calculation */
  bounds: PaneBounds;
  /** Whether this pane has focus */
  focused: boolean;
  /** Handler for directory navigation */
  onNavigate: (newPath: string) => void;
  /** Handler for cursor movement */
  onCursorMove: (newCursor: number) => void;
  /** Handler for file marking */
  onToggleMark?: (filename: string) => void;
  /** [IMPL-COMPARISON_COLORS] [REQ-FILE_COMPARISON_VISUAL] Comparison mode */
  comparisonMode?: ComparisonMode;
  /** [IMPL-COMPARISON_COLORS] [REQ-FILE_COMPARISON_VISUAL] Enhanced comparison index */
  comparisonIndex?: Map<string, Map<number, EnhancedCompareState>>;
  /** [IMPL-COMPARISON_COLORS] [REQ-FILE_COMPARISON_VISUAL] This pane's index */
  paneIndex?: number;
  /** [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] Current sort criterion */
  sortBy?: SortCriterion;
  /** [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] Current sort direction */
  sortDirection?: SortDirection;
  /** [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] Whether directories are sorted first */
  sortDirsFirst?: boolean;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for copy operation */
  onCopy?: () => void;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for move operation */
  onMove?: () => void;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for delete operation */
  onDelete?: () => void;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for rename operation (receives file to rename) */
  onRename?: (file: FileStat) => void;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for drag-drop operation */
  onDrop?: (files: string[], targetPath: string, operation: "copy" | "move") => void;
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Whether this pane is in linked mode */
  linked?: boolean;
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Cursor index to scroll to (undefined means no scroll) */
  scrollTrigger?: number;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler to request focus for this pane */
  onFocusRequest?: () => void;
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Handler to navigate to parent directory */
  onNavigateParent?: () => void;
  /** [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Column configuration */
  columns: FilesColumnConfig[];
  /** [IMPL-FILE_COLUMN_CONFIG] [REQ-MULTI_PANE_LAYOUT] OneColumn workspace-wide Size/Time ch (skips per-pane measure) */
  metadataColumnWidths?: MeasuredFileColumnWidths;
  /** Test ID for automation */
  "data-testid"?: string;
  /** [REQ-PANE_DISPLAY_FILTER] Catalog of saved display specs */
  displaySpecs?: DisplayFilterSpec[];
  activeDisplaySpecId?: string | null;
  activeDisplaySpecName?: string | null;
  hiddenCount?: number;
  rawFileCount?: number;
  recentSpecIds?: string[];
  onDisplaySpecSelect?: (specId: string | null) => void;
  onManageDisplaySpecs?: () => void;
  filterEmptyMessage?: string;
  /** [REQ-CROSS_PANE_VISIBILITY] Compare filter presets */
  crossPaneVisibilityPresets?: CrossPaneVisibilityPreset[];
  activeCrossPaneVisibilityId?: string | null;
  activeCrossPaneVisibilityName?: string | null;
  crossPaneVisibilityDraftDirty?: boolean;
  recentCrossPanePresetIds?: string[];
  onCrossPaneVisibilitySelect?: (presetId: string | null) => void;
  onManageCrossPaneVisibility?: () => void;
  /** [PANE_FILES_LIST_PROP] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] Workspace `panes[].files` for cross-pane path clipboard */
  paneFilesList?: readonly (readonly FileStat[])[];
}

/**
 * FilePane component - displays files in a single pane
 * [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING]
 */
export default function FilePane({
  path,
  files,
  cursor,
  marks,
  bounds,
  focused,
  onNavigate,
  onCursorMove,
  onToggleMark,
  comparisonMode = "off",
  comparisonIndex,
  paneIndex = 0,
  sortBy = "name",
  sortDirection = "asc",
  sortDirsFirst = true,
  onCopy,
  onMove,
  onDelete,
  onRename,
  onDrop,
  linked = false, // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
  scrollTrigger, // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
  onFocusRequest,
  onNavigateParent, // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
  columns, // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
  metadataColumnWidths,
  "data-testid": dataTestId,
  displaySpecs = [],
  activeDisplaySpecId = null,
  activeDisplaySpecName = null,
  hiddenCount = 0,
  rawFileCount = 0,
  recentSpecIds = [],
  onDisplaySpecSelect,
  onManageDisplaySpecs,
  filterEmptyMessage = "No visible items — the active filter may be hiding files in this folder.",
  crossPaneVisibilityPresets = [],
  activeCrossPaneVisibilityId = null,
  activeCrossPaneVisibilityName = null,
  crossPaneVisibilityDraftDirty = false,
  recentCrossPanePresetIds = [],
  onCrossPaneVisibilitySelect,
  onManageCrossPaneVisibility,
  paneFilesList = [],
}: FilePaneProps) {
  // [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileStat;
  } | null>(null);

  // FILE_COLUMN_CONTEXT_MENU_WIRING — [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION] column clipboard menu state
  const [columnContextMenu, setColumnContextMenu] = useState<{
    x: number;
    y: number;
    file: FileStat;
  } | null>(null);

  // [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Drag-drop state
  const [dragOver, setDragOver] = useState(false);

  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Ref for file list container
  const fileListRef = useRef<HTMLDivElement>(null);

  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Scroll to cursor when triggered by linked navigation
  useEffect(() => {
    // Only scroll if scrollTrigger is defined and valid
    if (scrollTrigger === undefined || scrollTrigger < 0) {
      return;
    }

    // Scroll to the triggered cursor position
    if (fileListRef.current && files.length > 0 && scrollTrigger < files.length) {
      const targetElement = fileListRef.current.children[0]?.children[scrollTrigger] as HTMLElement;
      if (targetElement) {
        targetElement.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }, [scrollTrigger, files.length]);

  const handleFileClick = (index: number) => {
    if (index !== cursor) {
      onCursorMove(index);
    }
  };
  
  const handleFileDoubleClick = (file: FileStat) => {
    if (file.isDirectory) {
      onNavigate(file.path);
    }
  };
  
  const handleMarkToggle = (filename: string, e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleMark) {
      onToggleMark(filename);
    }
  };

  // [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
  // Row file operations context menu — clears column clipboard menu (mutual exclusion)
  const handleContextMenu = (e: React.MouseEvent, file: FileStat, index: number) => {
    e.preventDefault();
    setColumnContextMenu(null);
    // Move cursor to right-clicked file
    if (index !== cursor) {
      onCursorMove(index);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  // FILE_COLUMN_CONTEXT_MENU_WIRING — [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]
  // how: metadata cell right-click opens clipboard menu; stopPropagation prevents row operations menu
  const handleColumnContextMenu = (
    e: React.MouseEvent,
    file: FileStat,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    if (index !== cursor) {
      onCursorMove(index);
    }
    setColumnContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  // [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
  // HTML5 Drag-and-Drop
  const handleDragStart = (e: React.DragEvent, file: FileStat, index: number) => {
    // Move cursor to dragged file
    if (index !== cursor) {
      onCursorMove(index);
    }

    // Determine what to drag (marked files or just this file)
    const filesToDrag = marks.size > 0 
      ? Array.from(marks) 
      : [file.name];

    // Store drag data
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("application/x-file-manager", JSON.stringify({
      files: filesToDrag,
      sourcePath: path,
    }));

    // Custom drag image with file count badge
    const dragImage = document.createElement("div");
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: #3b82f6;
      color: white;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
    `;
    dragImage.textContent = filesToDrag.length === 1 
      ? file.name 
      : `${filesToDrag.length} files`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    try {
      const data = e.dataTransfer.getData("application/x-file-manager");
      if (!data) return;

      const { files: draggedFiles, sourcePath } = JSON.parse(data);
      
      // Don't drop onto same directory
      if (sourcePath === path) return;

      // Determine operation (Ctrl=copy, default=move)
      const operation = e.ctrlKey ? "copy" : "move";
      
      if (onDrop) {
        onDrop(draggedFiles, path, operation);
      }
    } catch (err) {
      console.error("Drop error:", err);
    }
  };
  
  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: FilePane getComparisonClass maps comparisonMode and classifications to row background classes
  const getComparisonClass = (filename: string): string => {
    if (comparisonMode === "off" || !comparisonIndex) {
      return "";
    }
    
    const fileMap = comparisonIndex.get(filename);
    if (!fileMap) {
      return ""; // File not shared across panes
    }
    
    const compareState = fileMap.get(paneIndex);
    if (!compareState) {
      return ""; // File not in this pane
    }
    
    // Get comparison classification for this pane
    const sizeClass = compareState.sizeComparison[0];
    const timeClass = compareState.timeComparison[0];
    
    switch (comparisonMode) {
      case "name":
        // Just highlight shared files
        return "bg-zinc-100 dark:bg-zinc-800";
      
      case "size":
        switch (sizeClass) {
          case "equal": return "bg-green-50 dark:bg-green-950 border-l-2 border-green-500";
          case "smallest": return "bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500";
          case "largest": return "bg-red-50 dark:bg-red-950 border-l-2 border-red-500";
          default: return "";
        }
      
      case "time":
        switch (timeClass) {
          case "equal": return "bg-green-50 dark:bg-green-950 border-l-2 border-green-500";
          case "earliest": return "bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500";
          case "latest": return "bg-red-50 dark:bg-red-950 border-l-2 border-red-500";
          default: return "";
        }
      
      default:
        return "";
    }
  };

  // [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] TABULAR_FILE_ROW_GRID — how: CSS grid template from measured or injected metadata widths
  const visibleColumns = getVisibleFileColumns(columns);
  const visibleColumnIds = visibleColumns.map((c) => c.id);
  // [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] METADATA_COLUMN_WIDTHS_PROP — how: workspace OneColumn passes metadataColumnWidths to skip per-pane measure
  const measuredWidths = useMemo(
    () =>
      metadataColumnWidths ??
      measureFileMetadataColumnWidths(files, getVisibleFileColumns(columns)),
    [metadataColumnWidths, files, columns],
  );
  const metadataGridTemplate = buildFileRowGridTemplate(visibleColumnIds, measuredWidths);
  const rowGridTemplate = metadataGridTemplate
    ? `auto auto ${metadataGridTemplate}`
    : "auto auto";

  // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
  // Render a single column based on column ID
  const renderColumn = (
    columnId: FileColumnId,
    file: FileStat,
    rowIndex: number,
  ) => {
    const cellClass = "px-2 truncate tabular-nums";
    const displayText = formatFileColumnCell(file, columnId, columns);
    // FILE_COLUMN_CONTEXT_MENU_WIRING — attach column right-click to name, size, and mtime cells
    const columnContextProps = {
      onContextMenu: (e: React.MouseEvent) =>
        handleColumnContextMenu(e, file, rowIndex),
    };

    switch (columnId) {
      case "name":
        return (
          <span
            key="name"
            data-testid="file-column-name"
            className={`
              ${cellClass}
              ${file.isDirectory
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-zinc-900 dark:text-zinc-100"
              }
            `}
            {...columnContextProps}
          >
            {displayText}
          </span>
        );

      case "size":
        return (
          <span
            key="size"
            data-testid="file-column-size"
            className={`${cellClass} text-zinc-500 dark:text-zinc-400 text-xs`}
            {...columnContextProps}
          >
            {displayText}
          </span>
        );

      case "mtime":
        return (
          <span
            key="mtime"
            data-testid="file-column-mtime"
            className={`${cellClass} text-zinc-500 dark:text-zinc-400 text-xs`}
            {...columnContextProps}
          >
            {displayText}
          </span>
        );

      default:
        return null;
    }
  };
  
  // [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]: FilePane uses flex flex-col so header path bar file grid and footer stack vertically within pane bounds
  return (
    <div
      data-testid={dataTestId}
      className={`
        absolute overflow-hidden flex flex-col
        bg-white dark:bg-zinc-900
        border-2 transition-colors
        ${focused ? "border-blue-500 dark:border-blue-400" : "border-zinc-200 dark:border-zinc-700"}
        ${dragOver ? "ring-4 ring-blue-500 ring-opacity-50" : ""}
      `}
      style={{
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDragDrop}
      // [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — switch focusIndex when user clicks pane via FilePane onFocusRequest onMouseDown; file row clicks bubble to pane container.
      onMouseDown={() => onFocusRequest?.()}
    >
      {/* Header with path and display spec [REQ-PANE_DISPLAY_FILTER] */}
      <div className={`
        px-3 py-2 border-b border-zinc-200 dark:border-zinc-700
        bg-zinc-50 dark:bg-zinc-800
        font-mono text-sm flex flex-col gap-1
        ${focused ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}
      `}>
        <div className="flex items-center truncate w-full">
        <span className="flex-1 truncate">{path}</span>
        {/* [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Link indicator */}
        {linked && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 dark:bg-blue-400 text-white dark:text-zinc-900 rounded-full font-medium flex-shrink-0">
            🔗
          </span>
        )}
        {/* [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Parent navigation button */}
        {path !== '/' && path.split('/').filter(Boolean).length > 0 && onNavigateParent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateParent();
            }}
            title="Parent directory"
            aria-label="Parent directory"
            className="ml-2 px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 font-medium flex-shrink-0 transition-colors"
          >
            ..
          </button>
        )}
        {onDisplaySpecSelect && onManageDisplaySpecs && (
          <DisplaySpecSelector
            specs={displaySpecs}
            activeSpecId={activeDisplaySpecId}
            recentSpecIds={recentSpecIds}
            onSelect={onDisplaySpecSelect}
            onManage={onManageDisplaySpecs}
          />
        )}
        {onCrossPaneVisibilitySelect && onManageCrossPaneVisibility && (
          <CrossPaneVisibilitySelector
            presets={crossPaneVisibilityPresets}
            activePresetId={activeCrossPaneVisibilityId}
            recentPresetIds={recentCrossPanePresetIds}
            draftDirty={crossPaneVisibilityDraftDirty}
            onSelect={onCrossPaneVisibilitySelect}
            onManage={onManageCrossPaneVisibility}
          />
        )}
        </div>
        {(activeDisplaySpecName ||
          activeCrossPaneVisibilityName ||
          crossPaneVisibilityDraftDirty ||
          activeCrossPaneVisibilityId) && (
          <div
            className="text-xs text-amber-700 dark:text-amber-400 truncate"
            data-testid="pane-display-filter-indicator"
          >
            {activeDisplaySpecName ? (
              <>
                Filter: {activeDisplaySpecName}
                {hiddenCount > 0 ? ` · Hidden: ${hiddenCount}` : ""}
              </>
            ) : null}
            {(crossPaneVisibilityDraftDirty ||
              activeCrossPaneVisibilityName ||
              activeCrossPaneVisibilityId) && (
              <>
                {activeDisplaySpecName ? " · " : ""}
                Compare:{" "}
                {crossPaneVisibilityDraftDirty
                  ? "Draft"
                  : (activeCrossPaneVisibilityName ?? "Preset")}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: how: map files to grid rows with cursor, mark, and comparison styling */}
      <div ref={fileListRef} className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            {rawFileCount > 0 ? filterEmptyMessage : "Empty directory"}
          </div>
        ) : (
          <div className="font-mono text-sm" data-testid="file-list-table">
            {files.map((file, index) => {
              const isCursor = cursor >= 0 && index === cursor; // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Handle cursor=-1
              const isMarked = marks.has(file.name);
              const comparisonClass = getComparisonClass(file.name);
              
              return (
                <div
                  key={file.name}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, file, index)}
                  className={`
                    px-3 py-1 grid items-center cursor-pointer
                    transition-colors
                    ${comparisonClass || (
                      isCursor
                        ? "bg-blue-100 dark:bg-blue-900"
                        : isMarked
                        ? "bg-yellow-100 dark:bg-yellow-900"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  `}
                  onClick={() => handleFileClick(index)}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  onContextMenu={(e) => handleContextMenu(e, file, index)}
                  data-testid="file-row-grid"
                  style={{ gridTemplateColumns: rowGridTemplate }}
                >
                  {/* Mark checkbox [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB] */}
                  <input
                    type="checkbox"
                    checked={isMarked}
                    onChange={() => {}} // Controlled input
                    onClick={(e) => handleMarkToggle(file.name, e)}
                    className="w-4 h-4 justify-self-start"
                  />
                  
                  {/* Directory indicator */}
                  <span className="w-4 text-center justify-self-start">
                    {file.isDirectory ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold" aria-hidden>
                        📁
                      </span>
                    ) : null}
                  </span>
                  
                  {/* [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Tabular columns */}
                  {visibleColumns.map((col) => renderColumn(col.id, file, index))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer — only when listing or marks/hidden provide non-empty status [IMPL-FILE_MARKING] [IMPL-SORT_FILTER] */}
      {(files.length > 0 || marks.size > 0 || hiddenCount > 0) && (
      <div className={`
        px-3 py-1 border-t border-zinc-200 dark:border-zinc-700
        bg-zinc-50 dark:bg-zinc-800
        font-mono text-xs text-zinc-600 dark:text-zinc-400
        flex items-center justify-between gap-2
      `}>
        <span>
          {files.length > 0 
            ? cursor >= 0 
              ? `${cursor + 1} / ${files.length}` 
              : `- / ${files.length}` // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Show dash for no selection
            : "Empty"
          }
        </span>
        
        {/* [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] Sort indicator */}
        <span className="text-zinc-500 dark:text-zinc-500 text-[10px]">
          Sort: {getSortLabel(sortBy)} {getSortDirectionSymbol(sortDirection)}
          {sortDirsFirst && " (Dirs)"}
        </span>
        
        {marks.size > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
            [{marks.size} marked]
          </span>
        )}
      </div>
      )}

      {/* [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          marks={marks}
          onClose={() => setContextMenu(null)}
          onCopy={onCopy}
          onMove={onMove}
          onDelete={onDelete}
          onRename={onRename}
        />
      )}

      {columnContextMenu && (
        // FILE_COLUMN_CONTEXT_MENU_WIRING — render clipboard menu with workspace pane listings
        <FileColumnContextMenu
          x={columnContextMenu.x}
          y={columnContextMenu.y}
          file={columnContextMenu.file}
          paneFilesList={paneFilesList}
          onClose={() => setColumnContextMenu(null)}
        />
      )}
    </div>
  );
}
