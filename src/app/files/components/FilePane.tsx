// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]
// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
// Individual file pane component with sort display, context menu, and drag-drop

"use client";

import { useState, useRef, useEffect } from "react";
import type { FileStat, ComparisonMode, EnhancedCompareState } from "@/lib/files.types";
import type { PaneBounds } from "@/lib/files.layout";
import type { FilesColumnConfig, FileColumnId } from "@/lib/config.types";
import { formatSize, getSortLabel, getSortDirectionSymbol, formatDateTime, formatAge, type SortCriterion, type SortDirection } from "@/lib/files.utils";
import ContextMenu from "./ContextMenu";

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
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for rename operation */
  onRename?: () => void;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler for drag-drop operation */
  onDrop?: (files: string[], targetPath: string, operation: "copy" | "move") => void;
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Whether this pane is in linked mode */
  linked?: boolean;
  /** [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Cursor index to scroll to (undefined means no scroll) */
  scrollTrigger?: number;
  /** [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Handler to request focus for this pane */
  onFocusRequest?: () => void;
  /** [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Column configuration */
  columns: FilesColumnConfig[];
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
  columns, // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
}: FilePaneProps) {
  // [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] Context menu state
  const [contextMenu, setContextMenu] = useState<{
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
  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent, file: FileStat, index: number) => {
    e.preventDefault();
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
  
  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
  // Get comparison CSS class for a file based on current comparison mode
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

  // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
  // Render a single column based on column ID
  const renderColumn = (columnId: FileColumnId, file: FileStat) => {
    switch (columnId) {
      case "name":
        return (
          <span
            key="name"
            className={`
              flex-1 truncate
              ${file.isDirectory
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-zinc-900 dark:text-zinc-100"
              }
            `}
          >
            {file.name}
          </span>
        );
      
      case "size":
        // Hide size for directories
        if (file.isDirectory) return null;
        return (
          <span key="size" className="text-zinc-500 dark:text-zinc-400 text-xs">
            {formatSize(file.size)}
          </span>
        );
      
      case "mtime": {
        // [IMPL-FILE_AGE_DISPLAY] [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
        // Support both "age" (relative time) and "absolute" (YYYY-MM-DD HH:MM:SS) formats
        const column = columns.find(c => c.id === "mtime");
        const format = column?.format || "age";  // Default to age
        const displayTime = format === "age" 
          ? formatAge(file.mtime) 
          : formatDateTime(file.mtime);
        
        return (
          <span key="mtime" className="text-zinc-500 dark:text-zinc-400 text-xs">
            {displayTime}
          </span>
        );
      }
      
      default:
        return null;
    }
  };
  
  return (
    <div
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
      onMouseDown={() => onFocusRequest?.()}
    >
      {/* Header with path */}
      <div className={`
        px-3 py-2 border-b border-zinc-200 dark:border-zinc-700
        bg-zinc-50 dark:bg-zinc-800
        font-mono text-sm truncate flex items-center
        ${focused ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}
      `}>
        <span className="flex-1 truncate">{path}</span>
        {/* [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Link indicator */}
        {linked && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 dark:bg-blue-400 text-white dark:text-zinc-900 rounded-full font-medium flex-shrink-0">
            🔗
          </span>
        )}
      </div>
      
      {/* File list */}
      <div ref={fileListRef} className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            Empty directory
          </div>
        ) : (
          <div className="font-mono text-sm">
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
                    px-3 py-1 flex items-center gap-2 cursor-pointer
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
                >
                  {/* Mark checkbox [IMPL-FILE_MARKING] [REQ-FILE_MARKING_WEB] */}
                  <input
                    type="checkbox"
                    checked={isMarked}
                    onChange={() => {}} // Controlled input
                    onClick={(e) => handleMarkToggle(file.name, e)}
                    className="w-4 h-4"
                  />
                  
                  {/* Directory indicator */}
                  {file.isDirectory && (
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      📁
                    </span>
                  )}
                  
                  {/* [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Dynamic columns */}
                  {columns
                    .filter(col => col.visible !== false)
                    .map(col => renderColumn(col.id, file))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with cursor position, sort info, and marked count [IMPL-FILE_MARKING] [IMPL-SORT_FILTER] [REQ-FILE_MARKING_WEB] [REQ-FILE_SORTING_ADVANCED] */}
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
    </div>
  );
}
