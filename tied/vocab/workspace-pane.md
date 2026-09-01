# Workspace and pane vocabulary (canonical)

## Scope

Covers the **multi-pane file manager shell**: server **Files page**, client **workspace**, individual **panes**, **focus**, **layout** geometry, file columns, and file-manager-side restore UX chrome. **Intentional hub** — exceeds ~15 concepts by design; see [panorama-domain-references.md](panorama-domain-references.md) split/merge policy.

Excludes NSYNC sync algorithms ([nsync-multi-target.md](nsync-multi-target.md)), cross-pane comparison coloring ([cross-pane-comparison.md](cross-pane-comparison.md)), Mesh platform domain objects ([mesh-platform.md](mesh-platform.md)), pane **display filter specs** ([pane-display-filter.md](pane-display-filter.md)), and **cross-pane visibility** filters ([cross-pane-visibility.md](cross-pane-visibility.md)). Application **root entry redirect** (`/`) is documented here; cross-surface **NewTabLink** component details are canonical in [mesh-platform.md](mesh-platform.md).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MANAGER_PAGE](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [REQ-HOME_PAGE](../tied/requirements/REQ-HOME_PAGE.yaml), [REQ-BRANDING](../tied/requirements/REQ-BRANDING.yaml), [REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), [REQ-README_DEMO_AUTOMATION](../tied/requirements/REQ-README_DEMO_AUTOMATION.yaml), [REQ-CONFIG_DRIVEN_FILE_MANAGER](../tied/requirements/REQ-CONFIG_DRIVEN_FILE_MANAGER.yaml), [REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml), [REQ-DIRECTORY_TREE](../tied/requirements/REQ-DIRECTORY_TREE.yaml), [REQ-MOUSE_INTERACTION](../tied/requirements/REQ-MOUSE_INTERACTION.yaml), [REQ-LINKED_PANES](../tied/requirements/REQ-LINKED_PANES.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml), [REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml), [REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml), [REQ-TOUCH_MTIME](../tied/requirements/REQ-TOUCH_MTIME.yaml), [REQ-PANE_COMMAND_EXEC](../tied/requirements/REQ-PANE_COMMAND_EXEC.yaml), [REQ-BULK_FILE_OPS](../tied/requirements/REQ-BULK_FILE_OPS.yaml), [REQ-PANE_VOLUME_CAPACITY](../tied/requirements/REQ-PANE_VOLUME_CAPACITY.yaml) |
| ARCH | [ARCH-FILE_MANAGER_HIERARCHY](../tied/architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml), [ARCH-DIRECTORY_TREE](../tied/architecture-decisions/ARCH-DIRECTORY_TREE.yaml), [ARCH-SERVER_COMPONENTS](../tied/architecture-decisions/ARCH-SERVER_COMPONENTS.yaml), [ARCH-PANE_LIFECYCLE](../tied/architecture-decisions/ARCH-PANE_LIFECYCLE.yaml), [ARCH-CONFIG_DRIVEN_UI](../tied/architecture-decisions/ARCH-CONFIG_DRIVEN_UI.yaml), [ARCH-MOUSE_SUPPORT](../tied/architecture-decisions/ARCH-MOUSE_SUPPORT.yaml), [ARCH-CROSS_PANE_VISIBILITY](../tied/architecture-decisions/ARCH-CROSS_PANE_VISIBILITY.yaml), [ARCH-TOUCH_MTIME](../tied/architecture-decisions/ARCH-TOUCH_MTIME.yaml), [ARCH-PANE_COMMAND_EXEC](../tied/architecture-decisions/ARCH-PANE_COMMAND_EXEC.yaml), [ARCH-BATCH_OPERATIONS](../tied/architecture-decisions/ARCH-BATCH_OPERATIONS.yaml), [ARCH-PANE_VOLUME_CAPACITY](../tied/architecture-decisions/ARCH-PANE_VOLUME_CAPACITY.yaml) |
| IMPL | [IMPL-HOME_PAGE](../tied/implementation-decisions/IMPL-HOME_PAGE.yaml), [IMPL-IMAGE_OPTIMIZATION](../tied/implementation-decisions/IMPL-IMAGE_OPTIMIZATION.yaml), [IMPL-FILE_MANAGER_PAGE](../tied/implementation-decisions/IMPL-FILE_MANAGER_PAGE.yaml), [IMPL-FILE_COLUMN_CONFIG](../tied/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-DIRECTORY_TREE](../tied/implementation-decisions/IMPL-DIRECTORY_TREE.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-MOUSE_SUPPORT](../tied/implementation-decisions/IMPL-MOUSE_SUPPORT.yaml), [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml), [IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml), [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml), [IMPL-TOUCH_MTIME](../tied/implementation-decisions/IMPL-TOUCH_MTIME.yaml), [IMPL-TOUCH_DIALOG](../tied/implementation-decisions/IMPL-TOUCH_DIALOG.yaml), [IMPL-PANE_COMMAND_EXEC](../tied/implementation-decisions/IMPL-PANE_COMMAND_EXEC.yaml), [IMPL-EXECUTE_DIALOG](../tied/implementation-decisions/IMPL-EXECUTE_DIALOG.yaml), [IMPL-MAKE_DIRECTORY](../tied/implementation-decisions/IMPL-MAKE_DIRECTORY.yaml), [IMPL-MAKE_DIRECTORY_DIALOG](../tied/implementation-decisions/IMPL-MAKE_DIRECTORY_DIALOG.yaml), [IMPL-RENAME_REGEX](../tied/implementation-decisions/IMPL-RENAME_REGEX.yaml), [IMPL-RENAME_REGEX_DIALOG](../tied/implementation-decisions/IMPL-RENAME_REGEX_DIALOG.yaml), [IMPL-PANE_VOLUME_CAPACITY](../tied/implementation-decisions/IMPL-PANE_VOLUME_CAPACITY.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-*-pseudocode.md` for the IMPL tokens above |

## See also

- [FILE_MANAGER_SOLE_PURPOSE.md](FILE_MANAGER_SOLE_PURPOSE.md) — sole-purpose product boundary
- [panorama-domain-references.md](panorama-domain-references.md)
- [mesh-platform.md](mesh-platform.md) — **Workspace snapshot** v1–v5, save/diff/update, cross-surface links (canonical)
- [linked-navigation.md](linked-navigation.md)
- [file-marking.md](file-marking.md)
- [toolbar-keybind.md](toolbar-keybind.md)
- [pane-display-filter.md](pane-display-filter.md)
- [cross-pane-visibility.md](cross-pane-visibility.md)

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Workspace** | “file manager view”, `WorkspaceView` (React component name) |
| **Pane** | Legacy/avoid: “panel”, “column”, “split” — always **pane** in prose and pseudo-code |
| **Focused pane** | “active pane”, `focusIndex` (state index into `panes[]`) |
| **Pane state** | `PaneState` — path, files, cursor, marks, sort, `treeState` per pane |
| **Volume capacity** | Total byte capacity of the filesystem volume containing a pane base path |
| **Available space** | Bytes available to the user (`bavail`-based where platform exposes it) |
| **Free-space percentage** | Available bytes ÷ total bytes, 0–100 |
| **Volume stats** | API object: capacity values + `status` + optional diagnostic fields (`VolumeStats`) |
| **Capacity unavailable** | Non-success state when server cannot obtain trustworthy stats |
| **Capacity refresh** | Re-read stats on pane init, navigation, manual refresh, post-op listing refresh |
| **Pane footer** | Secondary status row in `FilePane` — cursor, sort, marks, hidden count, volume capacity |
| **Pane tree state** | `treeState: FileTreeState` — lazy directory tree under pane base; see [directory-tree.md](directory-tree.md) |
| **Active display spec** | `activeDisplaySpecId` — see [pane-display-filter.md](pane-display-filter.md) |
| **Hidden item count** | `hiddenCount` — entries filtered out by active display spec |
| **Loaded spec version** | `loadedSpecVersion` — catalog version last applied to pane listing |
| **Active cross-pane visibility preset** | `activeCrossPaneVisibilityId` — see [cross-pane-visibility.md](cross-pane-visibility.md) |
| **Cross-pane visibility draft** | `crossPaneVisibilityDraft` — see cross-pane-visibility glossary |
| **Cross-pane hidden count** | `crossPaneHiddenByPane[i]` — rows hidden by compare filter after display spec |
| **Files page** | “file manager page”, `src/app/files/page.tsx` (server component) |
| **Root entry redirect** | “home page”, “welcome page” — `src/app/page.tsx` calls `redirect("/files")`; no renderable root UI ([REQ-HOME_PAGE](../tied/requirements/REQ-HOME_PAGE.yaml)) |
| **Sole-purpose entry** | Panorama routes visitors from `/` directly to `/files`; see [FILE_MANAGER_SOLE_PURPOSE.md](FILE_MANAGER_SOLE_PURPOSE.md) |
| **Branding logo** | `config/site.yaml` → `branding.logo` metadata (`src`, `alt`, `width`, `height`); consumed by layout/metadata, not a root page render ([REQ-BRANDING](../tied/requirements/REQ-BRANDING.yaml)) |
| **darkInvert** | Optional `branding.logo.darkInvert` flag; when true, SVG logos use Tailwind `dark:invert` for dark-mode contrast ([IMPL-IMAGE_OPTIMIZATION](../tied/implementation-decisions/IMPL-IMAGE_OPTIMIZATION.yaml)) |
| **Layout type** | “layout mode” — values `tile`, `oneRow`, `oneColumn`, `fullscreen` |
| **Pane bounds** | `PaneBounds` — pixel `x`, `y`, `width`, `height` from layout calculator |
| **Workspace area** | Flex region below header/toolbars; `data-testid="workspace-area"`; `flex-1 min-h-0` |
| **Container dimensions** | `containerWidth` / `containerHeight` — measured client box passed to `calculateLayout` (not viewport) |
| **useElementSize** | Hook in `src/lib/useElementSize.ts` — ResizeObserver on workspace area |
| **Pane management** | “add/remove split” — gated by `layout.allowPaneManagement` and `layout.maxPanes` |
| **Pane order** | `panes[]` index = visual slot; reorder via swap, cycle, or dialog |
| **Swap panes** | `pane.swap` / `pane.swapPrev` — exchange focused pane with neighbor |
| **Cycle panes** | `pane.cycle` / `pane.cyclePrev` — rotate all panes one slot |
| **Pane order dialog** | `pane.order` → `PaneOrderDialog` |
| **Cross-surface link** | Canonical definition: [mesh-platform.md](mesh-platform.md) — file-manager **Mesh Sync** header nav is local UX |
| **Workspace header cross-surface nav** | Header `<nav>` with Mesh Sync link; `workspace-cross-surface-nav` |
| **Workspace header banner** | Top `<header>` — title, status row, Diff, cross-surface nav |
| **Shared sort** | Workspace `sharedSort`; snapshot field — schema in mesh-platform |
| **File column** | Metadata field: `mtime`, `size`, or `name` (`FileColumnId`) |
| **File column order** | Workspace `fileColumns`; snapshot v4 — schema in mesh-platform |
| **Tabular file row** | CSS grid in `FilePane` (`file-row-grid`); tree depth indent and expand chevron on directories; see [directory-tree.md](directory-tree.md) |
| **Content-measured file columns** | `fileColumnWidthMode: contentFixed` — Size/Time `ch` from max cell text |
| **OneColumn shared file column widths** | `metadataColumnWidths` — max Size/Time across panes when layout is `OneColumn` |
| **File column context menu** | `FileColumnContextMenu` on metadata cells; not row file-operations menu |
| **File column clipboard menu** | Copy filename / Copy path / Copy paths in all panes |
| **Pane files list** | `paneFilesList` — workspace `panes[].files` for cross-pane path lookup |
| **Cross-pane path resolution** | `resolveCrossPanePathsForFilename` — see [linked-navigation.md](linked-navigation.md) |
| **Layout toolbar picker** | `view.layout` → `LayoutPickerPopover` — [toolbar-keybind.md](toolbar-keybind.md) |
| **Workspace header status row** | `workspace-header-status` — loaded name, restore warnings, errors |
| **Layout normalization** | `normalizeLayoutType` / `NORMALIZE_LAYOUT` — aliases round-trip to `LayoutType` |
| **Mesh restore pending** | File-manager prop `meshRestorePending` when server miss — canonical: mesh-platform |
| **Client mesh rehydrate** | `RESTORE_LAYOUT_IN_WORKSPACE_VIEW` one-shot client restore |
| **Client restored from mesh** | `clientRestoredFromMesh` after successful client recovery |
| **Workspace restore pending** | `data-testid="workspace-restore-pending"` during client rehydrate |
| **Workspace restore bundle** | `buildWorkspaceRestoreBundle` / `BUILD_WORKSPACE_RESTORE_BUNDLE` |
| **Workspace restore warning** | Amber `workspace-restore-warning` — partial or client recovery |
| **Workspace restore error** | Red `workspace-restore-error` — unrecovered bootstrap failure |
| **Loaded workspace name** | Header `workspace-loaded-name` when `/files?meshId=` resolves |
| **Pane URL deep link** | Bookmarkable `/files?pane0=…&pane1=…` query params; `WorkspaceView` navigates panes on mount ([REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), block `PANE_URL_DEEP_LINK_INIT`) |
| **Single-pane workspace URL** | `/files?panes=1&pane0=…` — server bootstrap one pane at path; used by **Set as Base directory** new-workspace target (not mesh snapshot) |
| **Base directory** | Absolute directory path assigned as pane state `path` (re-root); distinct from Enter-into-subdirectory navigation |
| **Set as Base directory** | Directory row context menu item opening **Set base directory dialog** |
| **Set base directory dialog** | `SetBaseDirectoryDialog` — nine pane-target actions plus Cancel |
| **Set base directory target** | `SetBaseDirectoryTarget` — machine id for dialog choice: `thisPane`, `allPanes`, `otherPanes`, `nextPane`, `nextPaneSwap`, `priorPane`, `priorPaneSwap`, `newPane`, `newWorkspace`; UI labels from `copy.paneManagement.setBaseIn*` |
| **Set base directory target icon** | `SetBaseDirectoryTargetIcon` — semantic SVG per dialog target (initiating blue, target emerald, direction amber, swap violet, new-workspace sky; 36px, strokeWidth 1.5) |
| **Append pane at path** | `appendPaneAtPath(directoryPath, templatePaneIndex)` — shared pane append with display-spec and cross-pane inheritance; used by **Add pane** and **Set base: new pane** |
| **Navigate absolute base** | Multi-pane **Set base directory** assignment via `handleNavigate` with **Syncing ref** ([linked-navigation.md](linked-navigation.md)) so linked mode does not relative-sync non-initiating targets; **In this pane** (`thisPane`) allows linked propagation |
| **Unified file context menu** | Single portal `ContextMenu` for row and column right-click — file operations, **Touch…**, **Execute…**, **Make directory…**, and **Rename Regex…** on file and directory rows, clipboard section (`data-testid="file-column-context-menu"`), and **Set as Base directory** on directories; legacy `FileColumnContextMenu` component retained for unit tests only |
| **Touch…** | File and directory row context menu item opening **Touch file dialog** ([REQ-TOUCH_MTIME](../tied/requirements/REQ-TOUCH_MTIME.yaml)); label from `copy.touchFile.touchMenu` |
| **Touch file dialog** | `TouchFileDialog` — secondary workspace dialog with pane target (`thisPane` / `allPanes`, reusing `copy.paneManagement.setBaseInThisPane` / `setBaseInAllPanes`) and mtime mode (now, specified UTC/local, earliest/latest from comparison index) |
| **Execute…** | File and directory row context menu item opening **Execute file dialog** ([REQ-PANE_COMMAND_EXEC](../tied/requirements/REQ-PANE_COMMAND_EXEC.yaml)); label from `copy.executeFile.executeMenu` |
| **Execute file dialog** | `ExecuteFileDialog` — secondary workspace dialog with **Touch file pane target** subset and Command text field |
| **Execute file pane target** | `ExecuteFilePaneTarget` — `thisPane` \| `allPanes`; same subset as Touch file pane target |
| **Execute command placeholders** | `$FILE` (context file absolute path) and `$MARKED` (marked paths newline-separated); expanded client-side before POST ([REQ-PANE_COMMAND_EXEC](../tied/requirements/REQ-PANE_COMMAND_EXEC.yaml)) |
| **Panorama execute env vars** | `PANORAMA_PANE_PATH`, `PANORAMA_FILE_PATH`, `PANORAMA_MARKED_PATHS` — set on server shell spawn per execute-command entry |
| **Execute apply** | `handleApplyExecute` — builds entries, POSTs `execute-command`, refreshes affected pane listings |
| **Make directory…** | File and directory row context menu item opening **Make directory dialog** ([REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml)); label from `copy.makeDirectory.makeDirectoryMenu` |
| **Make directory dialog** | `MakeDirectoryDialog` — secondary workspace dialog with **Make directory pane target** subset and **Directory name** field |
| **Make directory pane target** | `MakeDirectoryPaneTarget` — `thisPane` \| `allPanes`; same subset as Touch file pane target |
| **Make directory apply** | `handleApplyMakeDirectory` — builds paths via `buildMakeDirectoryEntries`, POSTs `bulk-mkdir`, refreshes affected pane listings |
| **Rename Regex…** | File and directory row context menu item opening **Rename Regex dialog** ([REQ-BULK_FILE_OPS](../tied/requirements/REQ-BULK_FILE_OPS.yaml)); label from `copy.renameRegex.renameRegexMenu`; visible with marks (unlike single Rename) |
| **Rename Regex dialog** | `RenameRegexDialog` — secondary workspace dialog with **Rename Regex pane target** subset, **Match pattern**, and **Replacement text** fields |
| **Rename Regex pane target** | `RenameRegexPaneTarget` — `thisPane` \| `allPanes`; same subset as Touch file pane target |
| **Match pattern** | Regex applied to each target basename via `computeRenamedBasename`; validated client-side with `validateRegex` (ReDoS-safe) |
| **Replacement text** | Replacement string passed to `String.replace(RegExp, replacement)` per basename |
| **Rename regex apply** | `handleApplyRenameRegex` — builds `{ src, dest }[]` via `buildRenameRegexEntries`, POSTs `bulk-rename`, refreshes affected pane listings |
| **Touch file pane target** | `TouchFilePaneTarget` — `thisPane` \| `allPanes`; subset of set-base target ids |
| **Touch mtime mode** | `TouchMtimeMode` — `now` \| `specified` \| `earliest` \| `latest` |
| **README demo asset** | Committed PNG/GIF product tour under `docs/screenshots/` — workspace shell, **per-pane filter controls** (`workspace-pane-filter-controls.png`, `workspace-pane-filter-header.png`), toolbars, dialogs, motion GIFs, Mesh surfaces, bridge overlays — produced by modular Playwright specs via `npm run demo:screenshots` ([REQ-README_DEMO_AUTOMATION](../tied/requirements/REQ-README_DEMO_AUTOMATION.yaml)); filter pipeline terms in [pane-display-filter.md](pane-display-filter.md) and [cross-pane-visibility.md](cross-pane-visibility.md) |

## Naming bridge

| Canonical concept | UI label | Config key | Keybind action | Code symbol |
| --- | --- | --- | --- | --- |
| Workspace toolbar | (group names in YAML) | `toolbars.workspace` | various | `WorkspaceView` + `Toolbar` |
| Add pane | “Add Pane” | `copy.paneManagement.addPane` | `pane.add` | `handleAddPane`, `appendPaneAtPath` |
| Append pane at path | (internal) | — | — | `appendPaneAtPath` |
| Set base directory target icon | (per-target glyph) | — | — | `SetBaseDirectoryTargetIcon` |
| Remove pane | “Remove Pane” | `copy.paneManagement.removePane` | `pane.remove` | `handleRemovePane` |
| Swap panes | “Swap panes” | `copy.paneManagement.swapPanes` | `pane.swap` (Ctrl+Shift+S) | `handleSwapFocusedNext` |
| Swap with previous | “Swap with previous” | `copy.paneManagement.swapPrev` | `pane.swapPrev` | `handleSwapFocusedPrev` |
| Cycle panes forward | “Cycle panes forward” | `copy.paneManagement.cycleForward` | `pane.cycle` (Ctrl+Shift+]) | `handleCyclePanes` |
| Cycle panes backward | “Cycle panes backward” | `copy.paneManagement.cycleBackward` | `pane.cyclePrev` | `handleCyclePanes` |
| Pane order dialog | “Pane order” | `copy.paneManagement.paneOrderTitle` | `pane.order` (toolbar-only) | `PaneOrderDialog` |
| Set as Base directory | “Set as Base directory…” | `copy.paneManagement.setBaseDirectoryMenu` | — | `onSetBaseDirectory`, `SetBaseDirectoryDialog` |
| Touch… | “Touch…” | `copy.touchFile.touchMenu` | — | `onTouch`, `TouchFileDialog` |
| Execute… | “Execute…” | `copy.executeFile.executeMenu` | — | `onExecute`, `ExecuteFileDialog` |
| Make directory… | “Make directory…” | `copy.makeDirectory.makeDirectoryMenu` | — | `onMakeDirectory`, `MakeDirectoryDialog` |
| Rename Regex… | “Rename Regex…” | `copy.renameRegex.renameRegexMenu` | — | `onRenameRegex`, `RenameRegexDialog` |
| Touch file dialog | (title from copy) | `copy.touchFile.touchTitle` | — | `handleApplyTouch` |
| Execute file dialog | (title from copy) | `copy.executeFile.executeTitle` | — | `handleApplyExecute` |
| Make directory dialog | (title from copy) | `copy.makeDirectory.makeDirectoryTitle` | — | `handleApplyMakeDirectory` |
| Rename Regex dialog | (title from copy) | `copy.renameRegex.renameRegexTitle` | — | `handleApplyRenameRegex` |
| Set base directory dialog | (title from copy) | `copy.paneManagement.setBaseDirectoryTitle` | — | `handleApplySetBaseDirectory` |
| Single-pane workspace URL | (none) | — | — | `?panes=1&pane0=` on `/files` |
| Default pane count | — | `layout.defaultPaneCount` | — | startup pane array length |
| Max panes | “Maximum number of panes reached” | `layout.maxPanes` (`0` = no limit) | — | `handleAddPane` validation |
| Layout: tile | “Tile” | `layout.default: tile` | — | `LayoutType` / `calculateLayout` |
| Workspace area | (flex region below toolbars) | — | — | `workspace-area`, `useElementSize` |
| Focused pane | (visual focus ring) | — | `navigate.tab` | `focusIndex` |
| Mesh Sync (header) | “Mesh Sync” | — | — | `open-mesh-from-workspace` |
| Shared sort | Sort menu **Shared** / **Share** | `copy.sort.sharedButton` / `shareButton` | — | `sharedSort` |
| Layout toolbar picker | Layout pop-over | `copy.layouts.*` | `view.layout` (Ctrl+Shift+L) | `LayoutPickerPopover` |
| Column order dialog | “Column order” | `copy.columns.*` | `view.columns` | `ColumnOrderDialog`, `fileColumns` |
| File columns (config) | Column defaults | `columns` in `config/files.yaml` | — | `FilesColumnConfig[]` |
| File column clipboard menu | Copy filename / path / paths | — | — | `ContextMenu` clipboard section (`file-column-context-menu`); standalone `FileColumnContextMenu` for tests |
| Set base: In this pane | “In this pane” | `copy.paneManagement.setBaseInThisPane` | — | `thisPane` |
| Set base: all panes | “In all panes” | `copy.paneManagement.setBaseInAllPanes` | — | `allPanes` |
| Set base: other panes | “In all other panes” | `copy.paneManagement.setBaseInOtherPanes` | — | `otherPanes` |
| Set base: next pane | “In the next pane” | `copy.paneManagement.setBaseInNextPane` | — | `nextPane` |
| Set base: next pane swap | “In the next pane and swap pane position” | `copy.paneManagement.setBaseInNextPaneSwap` | — | `nextPaneSwap` |
| Set base: prior pane | “In the prior pane” | `copy.paneManagement.setBaseInPriorPane` | — | `priorPane` |
| Set base: prior pane swap | “In the prior pane and swap pane position” | `copy.paneManagement.setBaseInPriorPaneSwap` | — | `priorPaneSwap` |
| Set base: new pane | “In a new pane” | `copy.paneManagement.setBaseInNewPane` | — | `newPane` |
| Set base: new workspace | “In new workspace, as the only pane” | `copy.paneManagement.setBaseNewWorkspace` | — | `newWorkspace` |
| Save / diff workspace | See mesh-platform + toolbar | `copy.workspaceMesh.*` | `mesh.saveWorkspace`, `mesh.diffWorkspace` | mesh bridge IMPL |
| Pane URL deep link | (none) | — | — | `pane0`, `pane1`, … in `URLSearchParams` |

## Named concepts

- **Workspace** — Client root at `/files` owning `panes[]`, `focusIndex`, dialogs, keybinding dispatch (`WorkspaceView`).
- **Pane** — One directory listing with path, cursor, marks, sort; rendered by `FilePane`.
- **Focus** — Exactly one `focusIndex` receives commands unless linked mode propagates navigation.
- **Pane lifecycle** — Add/remove panes; [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml).
- **Focus follows pane content on reorder** — `focusIndex` remaps via `pane-order.ts` after swap/cycle/apply.
- **Layout calculator** — Container size + layout type + pane count → `PaneBounds[]` (`src/lib/files.layout.ts`).
- **Workspace area** — `flex-1 min-h-0` region measured via `useElementSize` on `workspaceAreaRef`.
- **Startup paths** — `startup.mode` and `startup.paths.paneN` in `config/files.yaml`.
- **Files startup mesh** — Optional mesh-list preference restoring workspace snapshot on `/files`; see [mesh-platform.md](mesh-platform.md). When unset or invalid, **YAML startup fallback** applies.
- **Parent navigation** — Must route through `handleNavigate` for linked sync.
- **Mesh bridge UX** — Save, diff, restore banners and header status row in file manager; domain terms (**Workspace snapshot**, **Save workspace as mesh**, **Workspace diff**) are canonical in [mesh-platform.md](mesh-platform.md).
- **Workspace keyboard-shortcuts footer** — removed; use toolbar badges/tooltips ([toolbar-keybind.md](toolbar-keybind.md)).
- **Unified file context menu** — Row and metadata-cell right-click open the same `ContextMenu` (file ops, **Touch…**, **Execute…**, **Make directory…**, and **Rename Regex…** on file and directory rows, clipboard section, **Set as Base directory** on directories); see [REQ-MOUSE_INTERACTION](../tied/requirements/REQ-MOUSE_INTERACTION.yaml).
- **Touch file dialog** — Secondary workspace dialog (`TouchFileDialog`) for pane-target and mtime-mode selection; when marks are non-empty at open, touch applies to all marked basenames in scope ([REQ-TOUCH_MTIME](../tied/requirements/REQ-TOUCH_MTIME.yaml)).
- **Execute file dialog** — Secondary workspace dialog (`ExecuteFileDialog`) for pane-target and Command field; when marks are non-empty at open, execute resolves marked paths in scope ([REQ-PANE_COMMAND_EXEC](../tied/requirements/REQ-PANE_COMMAND_EXEC.yaml)).
- **Make directory dialog** — Secondary workspace dialog (`MakeDirectoryDialog`) for **Make directory pane target** and **Directory name** field; creates basename under targeted pane path via `bulk-mkdir` ([REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml)).
- **Rename Regex dialog** — Secondary workspace dialog (`RenameRegexDialog`) for pane-target, match pattern, and replacement; when marks are non-empty at open, rename resolves marked basenames in scope via `buildRenameRegexEntries` ([REQ-BULK_FILE_OPS](../tied/requirements/REQ-BULK_FILE_OPS.yaml)).
- **Execute apply** — `handleApplyExecute` POSTs `execute-command` and refreshes affected pane listings via `handleNavigate`.
- **Make directory apply** — `handleApplyMakeDirectory` POSTs `bulk-mkdir` and refreshes affected pane listings via `handleNavigate`.
- **Rename regex apply** — `handleApplyRenameRegex` POSTs `bulk-rename` and refreshes affected pane listings via `handleNavigate`.
- **Navigate absolute base** — **Set base directory** multi-target paths use **Syncing ref** per [linked-navigation.md](linked-navigation.md); only **In this pane** propagates linked navigation.
- **Append pane at path** — `appendPaneAtPath` fetches listing at `directoryPath`, inherits template pane display spec and cross-pane fields, appends to `panes[]`; shared by toolbar/keybind **Add pane** and dialog **Set base: new pane**.
- **Set base directory target icon** — `SetBaseDirectoryTargetIcon` renders semantic multi-color pane glyphs on each dialog action button for visual target discrimination.
- **Cross-pane path clipboard** — **Copy paths in all panes** uses cursor filename match key ([REQ-LINKED_PANES](../tied/requirements/REQ-LINKED_PANES.yaml)).
- **Pane URL deep link** — Query parameters initialize pane paths without UI navigation; skipped when mesh restore is active.
- **README demo asset** — Committed product tour PNG/GIF under `docs/screenshots/` (workspace shell, toolbars, dialogs, motion GIFs, Mesh surfaces, bridge overlays); regenerated via modular Playwright specs and `npm run demo:screenshots` ([IMPL-DEMO_SCREENSHOT_PIPELINE](../tied/implementation-decisions/IMPL-DEMO_SCREENSHOT_PIPELINE.yaml)).

## Copy coverage

User-facing strings: `config/site.yaml` → `branding.logo` (metadata contract); `config/files.yaml` → `copy.paneManagement.*`, `copy.touchFile.*` (Touch dialog menu, title, mtime modes, UTC/local labels, Apply/Cancel), `copy.executeFile.*` (Execute menu, title, command label/placeholder, Apply/Cancel), `copy.makeDirectory.*` (Make directory menu, title, directory name label, Apply/Cancel), `copy.renameRegex.*` (Rename Regex menu, title, match/replacement labels, Apply/Cancel), `copy.layouts.*`, `copy.columns.*`, `copy.sort.*`, `copy.workspaceMesh.*` (save/diff dialogs and restore messages). Header **Mesh Sync** and restore banners use workspace mesh bridge copy keys. This glossary is authoritative for **Workspace**, **Pane**, **Focus**, layout geometry, file-column UX, **Touch file dialog**, **Execute file dialog**, **Make directory dialog**, **Rename Regex dialog**, and **root entry redirect**. Owning IMPL: [IMPL-HOME_PAGE](../tied/implementation-decisions/IMPL-HOME_PAGE.yaml), [IMPL-IMAGE_OPTIMIZATION](../tied/implementation-decisions/IMPL-IMAGE_OPTIMIZATION.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_COLUMN_CONFIG](../tied/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml), [IMPL-TOUCH_DIALOG](../tied/implementation-decisions/IMPL-TOUCH_DIALOG.yaml), [IMPL-EXECUTE_DIALOG](../tied/implementation-decisions/IMPL-EXECUTE_DIALOG.yaml), [IMPL-MAKE_DIRECTORY_DIALOG](../tied/implementation-decisions/IMPL-MAKE_DIRECTORY_DIALOG.yaml), [IMPL-RENAME_REGEX_DIALOG](../tied/implementation-decisions/IMPL-RENAME_REGEX_DIALOG.yaml).

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Root redirect to file manager | `RootRedirectToFileManager` → `IMPL-HOME_PAGE_RootRedirectToFileManager` | IMPL-HOME_PAGE |
| Branding logo config shape | `BrandingLogoConfigShape` → `IMPL-IMAGE_OPTIMIZATION_BrandingLogoConfigShape` | IMPL-IMAGE_OPTIMIZATION |
| Workspace dialog remount keys | `DialogKeys` → `IMPL-WORKSPACE_VIEW_DialogKeys` | IMPL-WORKSPACE_VIEW |
| Pane URL deep link init | `PANE_URL_DEEP_LINK_INIT` → `IMPL-WORKSPACE_VIEW_PaneUrlDeepLinkInit` | IMPL-WORKSPACE_VIEW |
| Keybinding handler registration | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| README demo screenshot pipeline | `NPM_DEMO_SCREENSHOTS`, `CAPTURE_WORKSPACE_AND_COMPARISON` | IMPL-DEMO_SCREENSHOT_PIPELINE |
| Add pane | `AddPane` → `IMPL-PANE_MANAGEMENT_AddPane` | IMPL-PANE_MANAGEMENT |
| Append pane at path | `AppendPaneAtPath` → `IMPL-PANE_MANAGEMENT_AppendPaneAtPath` | IMPL-PANE_MANAGEMENT |
| Remove pane | `RemovePane` → `IMPL-PANE_MANAGEMENT_RemovePane` | IMPL-PANE_MANAGEMENT |
| Swap panes | `SwapPanes` → `IMPL-PANE_MANAGEMENT_SwapPanes` | IMPL-PANE_MANAGEMENT |
| Cycle panes | `CyclePanes` → `IMPL-PANE_MANAGEMENT_CyclePanes` | IMPL-PANE_MANAGEMENT |
| Pane order dialog | `PaneOrderDialog` → `IMPL-PANE_MANAGEMENT_PaneOrderDialog` | IMPL-PANE_MANAGEMENT |
| Set base directory dialog | `SetBaseDirectoryDialog` → `IMPL-WORKSPACE_VIEW_SetBaseDirectoryDialog` | IMPL-WORKSPACE_VIEW |
| Set base directory target icon | `SetBaseDirectoryTargetIcon` → `IMPL-WORKSPACE_VIEW_SetBaseDirectoryTargetIcon` | IMPL-WORKSPACE_VIEW |
| Set base directory apply | `SetBaseDirectoryApply` → `IMPL-WORKSPACE_VIEW_SetBaseDirectoryApply` | IMPL-WORKSPACE_VIEW |
| Navigate absolute base | `NavigateAbsoluteBase` → `IMPL-WORKSPACE_VIEW_NavigateAbsoluteBase` | IMPL-WORKSPACE_VIEW, IMPL-LINKED_NAV |
| Unified row context menu | `UNIFIED_ROW_CONTEXT_MENU` → `IMPL-MOUSE_SUPPORT_UnifiedRowContextMenu` | IMPL-MOUSE_SUPPORT |
| Touch file dialog | `TouchFileDialog` → `IMPL-TOUCH_DIALOG_TouchFileDialog` | IMPL-TOUCH_DIALOG |
| Touch apply | `TouchApply` / `handleApplyTouch` → `IMPL-WORKSPACE_VIEW_TouchApply` | IMPL-WORKSPACE_VIEW, IMPL-TOUCH_MTIME |
| Execute file dialog | `ExecuteFileDialog` → `IMPL-EXECUTE_DIALOG_ExecuteFileDialog` | IMPL-EXECUTE_DIALOG |
| Execute apply | `ExecuteApply` / `handleApplyExecute` → `IMPL-WORKSPACE_VIEW_ExecuteApply` | IMPL-WORKSPACE_VIEW, IMPL-PANE_COMMAND_EXEC |
| Make directory dialog | `MakeDirectoryDialog` → `IMPL-MAKE_DIRECTORY_DIALOG_MakeDirectoryDialog` | IMPL-MAKE_DIRECTORY_DIALOG |
| Build make directory entries | `buildMakeDirectoryEntries` → `IMPL-MAKE_DIRECTORY_buildMakeDirectoryEntries` | IMPL-MAKE_DIRECTORY |
| Make directory apply | `MakeDirectoryApply` / `handleApplyMakeDirectory` → `IMPL-WORKSPACE_VIEW_MakeDirectoryApply` | IMPL-WORKSPACE_VIEW, IMPL-MAKE_DIRECTORY |
| Rename Regex dialog | `RenameRegexDialog` → `IMPL-RENAME_REGEX_DIALOG_RenameRegexDialog` | IMPL-RENAME_REGEX_DIALOG |
| Rename regex apply | `RenameRegexApply` / `handleApplyRenameRegex` → `IMPL-WORKSPACE_VIEW_RenameRegexApply` | IMPL-WORKSPACE_VIEW, IMPL-RENAME_REGEX |
| Single-pane workspace URL | `SinglePaneWorkspaceUrl` → `IMPL-FILE_MANAGER_PAGE_SinglePaneWorkspaceUrl` | IMPL-FILE_MANAGER_PAGE |
| Layout: tile / one row / column / fullscreen | `Tile`, `OneRow`, `OneColumn`, `Fullscreen` | IMPL-LAYOUT_CALCULATOR |
| Workspace area measurement | `WORKSPACE_AREA_MEASUREMENT` | IMPL-LAYOUT_CALCULATOR |
| File row render + scroll | `RenderFileRows`, `ScrollToCursor` | IMPL-FILE_PANE |
| Tabular file row grid | `TABULAR_FILE_ROW_GRID` | IMPL-FILE_PANE, IMPL-FILE_COLUMN_CONFIG |
| Measure file column widths | `MEASURE_FILE_COLUMN_WIDTHS` | IMPL-FILE_COLUMN_CONFIG |
| OneColumn shared metadata widths | `SHARED_METADATA_WIDTHS_ONECOLUMN` | IMPL-WORKSPACE_VIEW, IMPL-FILE_COLUMN_CONFIG |
| Column order dialog | `COLUMN_ORDER_DIALOG` | IMPL-WORKSPACE_VIEW, IMPL-FILE_COLUMN_CONFIG |
| Layout toolbar picker | `LAYOUT_TOOLBAR_PICKER` | IMPL-WORKSPACE_VIEW |
| Column clipboard helpers | `FILE_COLUMN_CLIPBOARD` | IMPL-MOUSE_SUPPORT |
| Column context menu UI | `FILE_COLUMN_CONTEXT_MENU` | IMPL-MOUSE_SUPPORT |
| Column right-click wiring | `FILE_COLUMN_CONTEXT_MENU_WIRING` | IMPL-FILE_PANE |
| Workspace pane listings prop | `PANE_FILES_LIST_TO_FILEPANE` | IMPL-FILE_PANE, IMPL-WORKSPACE_VIEW |
| Mesh bridge blocks | `CAPTURE_SNAPSHOT`, `BUILD_WORKSPACE_RESTORE_BUNDLE`, `WORKSPACE_HEADER_STATUS`, … | IMPL-WORKSPACE_MESH_BRIDGE — full list in [mesh-platform.md](mesh-platform.md) |
| Volume stats provider | `GET_VOLUME_STATS`, `NORMALIZE_VOLUME_STATS` | IMPL-PANE_VOLUME_CAPACITY |
| Listing enrichment | `ENRICH_DIRECTORY_LISTING`, `NORMALIZE_LISTING_RESPONSE` | IMPL-FILES_API, IMPL-PANE_VOLUME_CAPACITY |
| SSR volume attach | `SSR_ATTACH_VOLUME_STATS` | IMPL-FILE_MANAGER_PAGE, IMPL-PANE_VOLUME_CAPACITY |
| Pane volume state | `UPDATE_PANE_VOLUME_STATS`, mount backfill | IMPL-WORKSPACE_VIEW |
| Pane capacity footer | `RENDER_PANE_VOLUME_STATS`, footer visibility | IMPL-FILE_PANE |

## Alphabetical index

- **Branding logo** — `config/site.yaml` → `branding.logo` metadata
- **Cross-pane visibility draft** — `crossPaneVisibilityDraft`; see cross-pane-visibility glossary
- **Active cross-pane visibility preset** — see cross-pane-visibility glossary
- **Active display spec** — see pane-display-filter glossary
- **Apply shared sort** — Sort menu **Shared** on focused pane
- **Append pane at path** — `appendPaneAtPath` shared helper
- **Base directory** — pane state path re-root target
- **Client mesh rehydrate** — client full restore when server bootstrap misses mesh
- **Client restored from mesh** — `clientRestoredFromMesh`
- **Container dimensions** — `containerWidth`, `containerHeight`
- **Content-measured file columns** — `contentFixed` width mode
- **Cross-pane hidden count** — `crossPaneHiddenByPane`
- **Cross-pane path clipboard** — labeled paths when basename in multiple panes
- **Cross-pane path resolution** — `resolveCrossPanePathsForFilename`
- **Cross-surface link** — canonical: mesh-platform; header nav here
- **Cycle panes** — `pane.cycle` / `pane.cyclePrev`
- **Execute apply** — `handleApplyExecute` POST and pane refresh
- **Execute command placeholders** — `$FILE`, `$MARKED` client expansion
- **Execute file dialog** — `ExecuteFileDialog` pane target + Command field
- **Execute file pane target** — `thisPane` \| `allPanes`
- **Execute…** — context menu item opening **Execute file dialog**
- **File column** — `mtime`, `size`, `name`
- **File column clipboard menu** — Copy filename / path / paths
- **File column context menu** — metadata cell clipboard menu
- **File column order** — `fileColumns`; snapshot v4 in mesh-platform
- **darkInvert** — optional SVG dark-mode invert on branding logo
- **Files page** — server `/files` entry
- **Focus** — `focusIndex`
- **Focus follows pane content on reorder** — remaps after pane reorder
- **Focused pane** — active pane index
- **Hidden item count** — display spec `hiddenCount`
- **Layout normalization** — `normalizeLayoutType` / `NORMALIZE_LAYOUT`
- **Layout toolbar picker** — `view.layout` pop-over
- **Layout type** — `tile`, `oneRow`, `oneColumn`, `fullscreen`
- **Loaded spec version** — display spec catalog version on pane
- **Loaded workspace name** — `workspace-loaded-name`
- **Make directory apply** — `handleApplyMakeDirectory` POST and pane refresh
- **Make directory dialog** — `MakeDirectoryDialog` pane target + directory name field
- **Make directory pane target** — `thisPane` \| `allPanes`
- **Make directory…** — context menu item opening **Make directory dialog**
- **Mesh restore pending** — `meshRestorePending`; canonical: mesh-platform
- **OneColumn shared file column widths** — shared Size/Time `ch`
- **Pane URL deep link** — `paneN` query params on `/files`
- **Pane** — single listing column
- **Pane bounds** — layout geometry
- **Pane files list** — `paneFilesList`
- **Pane management** — add/remove panes
- **Pane order** — visual slot in `panes[]`
- **Pane order dialog** — `pane.order` / `PaneOrderDialog`
- **Pane state** — per-pane state object
- **Match pattern** — regex field in **Rename Regex dialog**; `validateRegex` client-side
- **Replacement text** — replacement field in **Rename Regex dialog**
- **Rename Regex dialog** — `RenameRegexDialog` pane target + pattern fields
- **Rename Regex pane target** — `thisPane` \| `allPanes`
- **Rename regex apply** — `handleApplyRenameRegex` POST and pane refresh
- **Rename Regex…** — context menu item opening **Rename Regex dialog**
- **README demo asset** — `docs/screenshots/` product tour PNG/GIF (workspace, mesh, motion demos)
- **Root entry redirect** — `/` server redirect to `/files` via `redirect()`
- **Sole-purpose entry** — file-manager-only product; no welcome home page
- **Share sort** — copy focused sort to `sharedSort`
- **Set as Base directory** — directory row context menu item
- **Set base directory dialog** — `SetBaseDirectoryDialog`
- **Set base directory target** — `SetBaseDirectoryTarget` dialog choice id
- **Set base directory target icon** — `SetBaseDirectoryTargetIcon` semantic SVG
- **Navigate absolute base** — absolute path re-root with syncing ref for multi-pane targets
- **Panorama execute env vars** — `PANORAMA_PANE_PATH`, `PANORAMA_FILE_PATH`, `PANORAMA_MARKED_PATHS`
- **Single-pane workspace URL** — `?panes=1&pane0=`
- **Unified file context menu** — combined row/column right-click menu
- **Swap panes** — `pane.swap` / `pane.swapPrev`
- **Tabular file row** — `file-row-grid` in `FilePane`
- **Touch…** — context menu item opening **Touch file dialog**
- **Touch file dialog** — `TouchFileDialog` pane target + mtime mode groups
- **Touch file pane target** — `thisPane` \| `allPanes`
- **Touch mtime mode** — `now` \| `specified` \| `earliest` \| `latest`
- **useElementSize** — ResizeObserver on workspace area
- **Workspace** — multi-pane client shell
- **Workspace area** — `data-testid="workspace-area"`
- **Workspace header banner** — compact title + status + controls
- **Workspace header cross-surface nav** — Mesh Sync link
- **Workspace header status row** — `workspace-header-status`
- **Workspace restore bundle** — `buildWorkspaceRestoreBundle`
- **Workspace restore error** — `workspace-restore-error`
- **Workspace restore pending** — `workspace-restore-pending`
- **Workspace restore warning** — `workspace-restore-warning`
- **Workspace snapshot** — canonical schema: mesh-platform
