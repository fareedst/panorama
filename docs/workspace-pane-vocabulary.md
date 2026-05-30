# Workspace and pane vocabulary (canonical)

## Scope

Covers the **multi-pane file manager shell**: server **Files page**, client **workspace**, individual **panes**, **focus**, **layout** geometry, file columns, and file-manager-side restore UX chrome. **Intentional hub** — exceeds ~15 concepts by design; see [panorama-domain-references.md](panorama-domain-references.md) split/merge policy.

Excludes NSYNC sync algorithms ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)), cross-pane comparison coloring ([cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)), Mesh platform domain objects ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)), pane **display filter specs** ([pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)), and **cross-pane visibility** filters ([cross-pane-visibility-vocabulary.md](cross-pane-visibility-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MANAGER_PAGE](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), [REQ-CONFIG_DRIVEN_FILE_MANAGER](../tied/requirements/REQ-CONFIG_DRIVEN_FILE_MANAGER.yaml), [REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml), [REQ-MOUSE_INTERACTION](../tied/requirements/REQ-MOUSE_INTERACTION.yaml), [REQ-LINKED_PANES](../tied/requirements/REQ-LINKED_PANES.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml), [REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml), [REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml) |
| ARCH | [ARCH-FILE_MANAGER_HIERARCHY](../tied/architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml), [ARCH-PANE_LIFECYCLE](../tied/architecture-decisions/ARCH-PANE_LIFECYCLE.yaml), [ARCH-CONFIG_DRIVEN_UI](../tied/architecture-decisions/ARCH-CONFIG_DRIVEN_UI.yaml), [ARCH-MOUSE_SUPPORT](../tied/architecture-decisions/ARCH-MOUSE_SUPPORT.yaml), [ARCH-CROSS_PANE_VISIBILITY](../tied/architecture-decisions/ARCH-CROSS_PANE_VISIBILITY.yaml) |
| IMPL | [IMPL-FILE_MANAGER_PAGE](../tied/implementation-decisions/IMPL-FILE_MANAGER_PAGE.yaml), [IMPL-FILE_COLUMN_CONFIG](../tied/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-MOUSE_SUPPORT](../tied/implementation-decisions/IMPL-MOUSE_SUPPORT.yaml), [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml), [IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml), [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-*-pseudocode.md` for the IMPL tokens above |

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md) — **Workspace snapshot** v1–v5, save/diff/update, cross-surface links (canonical)
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)
- [file-marking-vocabulary.md](file-marking-vocabulary.md)
- [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)
- [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)
- [cross-pane-visibility-vocabulary.md](cross-pane-visibility-vocabulary.md)

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Workspace** | “file manager view”, `WorkspaceView` (React component name) |
| **Pane** | Legacy/avoid: “panel”, “column”, “split” — always **pane** in prose and pseudo-code |
| **Focused pane** | “active pane”, `focusIndex` (state index into `panes[]`) |
| **Pane state** | `PaneState` — path, files, cursor, marks, sort per pane |
| **Active display spec** | `activeDisplaySpecId` — see [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md) |
| **Hidden item count** | `hiddenCount` — entries filtered out by active display spec |
| **Loaded spec version** | `loadedSpecVersion` — catalog version last applied to pane listing |
| **Active cross-pane visibility preset** | `activeCrossPaneVisibilityId` — see [cross-pane-visibility-vocabulary.md](cross-pane-visibility-vocabulary.md) |
| **Cross-pane visibility draft** | `crossPaneVisibilityDraft` — see cross-pane-visibility glossary |
| **Cross-pane hidden count** | `crossPaneHiddenByPane[i]` — rows hidden by compare filter after display spec |
| **Files page** | “file manager page”, `src/app/files/page.tsx` (server component) |
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
| **Cross-surface link** | Canonical definition: [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md) — file-manager **Mesh Sync** header nav is local UX |
| **Workspace header cross-surface nav** | Header `<nav>` with Mesh Sync link; `workspace-cross-surface-nav` |
| **Workspace header banner** | Top `<header>` — title, status row, Diff, cross-surface nav |
| **Shared sort** | Workspace `sharedSort`; snapshot field — schema in mesh-platform |
| **File column** | Metadata field: `mtime`, `size`, or `name` (`FileColumnId`) |
| **File column order** | Workspace `fileColumns`; snapshot v4 — schema in mesh-platform |
| **Tabular file row** | CSS grid in `FilePane` (`file-row-grid`); no listing header row |
| **Content-measured file columns** | `fileColumnWidthMode: contentFixed` — Size/Time `ch` from max cell text |
| **OneColumn shared file column widths** | `metadataColumnWidths` — max Size/Time across panes when layout is `OneColumn` |
| **File column context menu** | `FileColumnContextMenu` on metadata cells; not row file-operations menu |
| **File column clipboard menu** | Copy filename / Copy path / Copy paths in all panes |
| **Pane files list** | `paneFilesList` — workspace `panes[].files` for cross-pane path lookup |
| **Cross-pane path resolution** | `resolveCrossPanePathsForFilename` — see [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md) |
| **Layout toolbar picker** | `view.layout` → `LayoutPickerPopover` — [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md) |
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

## Naming bridge

| Canonical concept | UI label | Config key | Keybind action | Code symbol |
| --- | --- | --- | --- | --- |
| Workspace toolbar | (group names in YAML) | `toolbars.workspace` | various | `WorkspaceView` + `Toolbar` |
| Add pane | “Add Pane” | `copy.paneManagement.addPane` | `pane.add` | `handleAddPane` |
| Remove pane | “Remove Pane” | `copy.paneManagement.removePane` | `pane.remove` | `handleRemovePane` |
| Swap panes | “Swap panes” | `copy.paneManagement.swapPanes` | `pane.swap` (Ctrl+Shift+S) | `handleSwapFocusedNext` |
| Swap with previous | “Swap with previous” | `copy.paneManagement.swapPrev` | `pane.swapPrev` | `handleSwapFocusedPrev` |
| Cycle panes forward | “Cycle panes forward” | `copy.paneManagement.cycleForward` | `pane.cycle` (Ctrl+Shift+]) | `handleCyclePanes` |
| Cycle panes backward | “Cycle panes backward” | `copy.paneManagement.cycleBackward` | `pane.cyclePrev` | `handleCyclePanes` |
| Pane order dialog | “Pane order” | `copy.paneManagement.paneOrderTitle` | `pane.order` (toolbar-only) | `PaneOrderDialog` |
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
| File column clipboard menu | Copy filename / path / paths | — | — | `FileColumnContextMenu` |
| Save / diff workspace | See mesh-platform + toolbar | `copy.workspaceMesh.*` | `mesh.saveWorkspace`, `mesh.diffWorkspace` | mesh bridge IMPL |

## Named concepts

- **Workspace** — Client root at `/files` owning `panes[]`, `focusIndex`, dialogs, keybinding dispatch (`WorkspaceView`).
- **Pane** — One directory listing with path, cursor, marks, sort; rendered by `FilePane`.
- **Focus** — Exactly one `focusIndex` receives commands unless linked mode propagates navigation.
- **Pane lifecycle** — Add/remove panes; [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml).
- **Focus follows pane content on reorder** — `focusIndex` remaps via `pane-order.ts` after swap/cycle/apply.
- **Layout calculator** — Container size + layout type + pane count → `PaneBounds[]` (`src/lib/files.layout.ts`).
- **Workspace area** — `flex-1 min-h-0` region measured via `useElementSize` on `workspaceAreaRef`.
- **Startup paths** — `startup.mode` and `startup.paths.paneN` in `config/files.yaml`.
- **Parent navigation** — Must route through `handleNavigate` for linked sync.
- **Mesh bridge UX** — Save, diff, restore banners and header status row in file manager; domain terms (**Workspace snapshot**, **Save workspace as mesh**, **Workspace diff**) are canonical in [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md).
- **Workspace keyboard-shortcuts footer** — removed; use toolbar badges/tooltips ([toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)).
- **File column context menu** — Clipboard-only on metadata cells; exclusive with row file-operations menu ([REQ-MOUSE_INTERACTION](../tied/requirements/REQ-MOUSE_INTERACTION.yaml)).
- **Cross-pane path clipboard** — **Copy paths in all panes** uses cursor filename match key ([REQ-LINKED_PANES](../tied/requirements/REQ-LINKED_PANES.yaml)).

## Copy coverage

User-facing strings: `config/files.yaml` → `copy.paneManagement.*`, `copy.layouts.*`, `copy.columns.*`, `copy.sort.*`, `copy.workspaceMesh.*` (save/diff dialogs and restore messages). Header **Mesh Sync** and restore banners use workspace mesh bridge copy keys. This glossary is authoritative for **Workspace**, **Pane**, **Focus**, layout geometry, and file-column UX. Owning IMPL: [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_COLUMN_CONFIG](../tied/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml).

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Workspace dialog remount keys | `DialogKeys` → `IMPL-WORKSPACE_VIEW_DialogKeys` | IMPL-WORKSPACE_VIEW |
| Keybinding handler registration | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| Add pane | `AddPane` → `IMPL-PANE_MANAGEMENT_AddPane` | IMPL-PANE_MANAGEMENT |
| Remove pane | `RemovePane` → `IMPL-PANE_MANAGEMENT_RemovePane` | IMPL-PANE_MANAGEMENT |
| Swap panes | `SwapPanes` → `IMPL-PANE_MANAGEMENT_SwapPanes` | IMPL-PANE_MANAGEMENT |
| Cycle panes | `CyclePanes` → `IMPL-PANE_MANAGEMENT_CyclePanes` | IMPL-PANE_MANAGEMENT |
| Pane order dialog | `PaneOrderDialog` → `IMPL-PANE_MANAGEMENT_PaneOrderDialog` | IMPL-PANE_MANAGEMENT |
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
| Mesh bridge blocks | `CAPTURE_SNAPSHOT`, `BUILD_WORKSPACE_RESTORE_BUNDLE`, `WORKSPACE_HEADER_STATUS`, … | IMPL-WORKSPACE_MESH_BRIDGE — full list in [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md) |

## Alphabetical index

- **Cross-pane visibility draft** — `crossPaneVisibilityDraft`; see cross-pane-visibility glossary
- **Active cross-pane visibility preset** — see cross-pane-visibility glossary
- **Active display spec** — see pane-display-filter glossary
- **Apply shared sort** — Sort menu **Shared** on focused pane
- **Client mesh rehydrate** — client full restore when server bootstrap misses mesh
- **Client restored from mesh** — `clientRestoredFromMesh`
- **Container dimensions** — `containerWidth`, `containerHeight`
- **Content-measured file columns** — `contentFixed` width mode
- **Cross-pane hidden count** — `crossPaneHiddenByPane`
- **Cross-pane path clipboard** — labeled paths when basename in multiple panes
- **Cross-pane path resolution** — `resolveCrossPanePathsForFilename`
- **Cross-surface link** — canonical: mesh-platform; header nav here
- **Cycle panes** — `pane.cycle` / `pane.cyclePrev`
- **File column** — `mtime`, `size`, `name`
- **File column clipboard menu** — Copy filename / path / paths
- **File column context menu** — metadata cell clipboard menu
- **File column order** — `fileColumns`; snapshot v4 in mesh-platform
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
- **Mesh restore pending** — `meshRestorePending`; canonical: mesh-platform
- **OneColumn shared file column widths** — shared Size/Time `ch`
- **Pane** — single listing column
- **Pane bounds** — layout geometry
- **Pane files list** — `paneFilesList`
- **Pane management** — add/remove panes
- **Pane order** — visual slot in `panes[]`
- **Pane order dialog** — `pane.order` / `PaneOrderDialog`
- **Pane state** — per-pane state object
- **Share sort** — copy focused sort to `sharedSort`
- **Shared sort** — workspace default sort; snapshot v3 in mesh-platform
- **Swap panes** — `pane.swap` / `pane.swapPrev`
- **Tabular file row** — `file-row-grid` in `FilePane`
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
