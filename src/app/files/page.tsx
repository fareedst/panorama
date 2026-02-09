// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]
// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// File manager server page with multi-pane initialization

import { listDirectory, getUserHomeDirectory, sortFiles } from "@/lib/files.data";
import { getFilesConfig } from "@/lib/config";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import path from "path";

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// Pane initialization state type
export interface PaneInitialState {
  path: string;
  files: FileStat[];
}

/**
 * File Manager Page - Server Component
 * [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]
 * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 * 
 * Loads initial directory data for multiple panes based on config, renders WorkspaceView client component
 */
export default async function FilesPage() {
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Load configuration
  const config = getFilesConfig();
  const keybindings = config.keybindings || [];
  const copy = config.copy || {};
  const layout = config.layout || { default: "tile", defaultPaneCount: 2, allowPaneManagement: true, maxPanes: 4 };
  const startup = config.startup || { mode: "home", paths: {} };
  // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Load column configuration
  const columns = config.columns || [
    { id: "mtime", visible: true },
    { id: "size", visible: true },
    { id: "name", visible: true },
  ];
  
  // [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] Load toolbar configuration
  const toolbars = config.toolbars;
  
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Initialize panes based on startup mode and defaultPaneCount
  const initialPanes: PaneInitialState[] = [];
  const homeDir = getUserHomeDirectory();
  const paneCount = layout.defaultPaneCount || 1;
  
  for (let i = 0; i < paneCount; i++) {
    let panePath = homeDir;
    
    // Determine pane path based on startup mode
    if (startup.mode === "configured" && startup.paths) {
      // Use configured path for this pane (pane1, pane2, etc.)
      const configPath = startup.paths[`pane${i + 1}`];
      if (configPath) {
        // Expand ~ to home directory
        panePath = configPath.startsWith("~")
          ? path.join(homeDir, configPath.slice(1))
          : configPath;
      }
    }
    // For "home" mode, all panes start at home (already set)
    // For "last" mode (future): would read from localStorage (client-side only)
    
    // Load directory contents for this pane
    const files = await listDirectory(panePath);
    const sortedFiles = sortFiles(files, "Name", true);
    
    initialPanes.push({
      path: panePath,
      files: sortedFiles,
    });
  }
  
  return (
    <WorkspaceView
      initialPanes={initialPanes}
      keybindings={keybindings}
      copy={copy}
      layout={layout}
      columns={columns}
      toolbars={toolbars}
    />
  );
}
