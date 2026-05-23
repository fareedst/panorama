# Workspace and pane vocabulary (canonical)

## Scope

Covers the **multi-pane file manager shell**: server **Files page**, client **workspace**, individual **panes**, **focus**, and **layout** geometry. Excludes NSYNC sync algorithms ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)), cross-pane comparison coloring ([cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)), and Mesh platform terms ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)). Pane **display filter specs** are defined in [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MANAGER_PAGE](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), [REQ-CONFIG_DRIVEN_FILE_MANAGER](../tied/requirements/REQ-CONFIG_DRIVEN_FILE_MANAGER.yaml), [REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml), [REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml) |
| ARCH | [ARCH-FILE_MANAGER_HIERARCHY](../tied/architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml), [ARCH-PANE_LIFECYCLE](../tied/architecture-decisions/ARCH-PANE_LIFECYCLE.yaml), [ARCH-CONFIG_DRIVEN_UI](../tied/architecture-decisions/ARCH-CONFIG_DRIVEN_UI.yaml) |
| IMPL | [IMPL-FILE_MANAGER_PAGE](../tied/implementation-decisions/IMPL-FILE_MANAGER_PAGE.yaml), [IMPL-FILE_COLUMN_CONFIG](../tied/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml), [IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml), [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-*-pseudocode.md` for the IMPL tokens above |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Workspace** | “file manager view”, `WorkspaceView` (React component name) |
| **Pane** | “panel”, “column”, “split” — always **pane** in prose and pseudo-code |
| **Focused pane** | “active pane”, `focusIndex` (state index into `panes[]`) |
| **Pane state** | `PaneState` — path, files, cursor, marks, sort per pane |
| **Active display spec** | `activeDisplaySpecId` — stable catalog id or null (no filter); see [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md) |
| **Hidden item count** | `hiddenCount` — entries filtered out by active display spec |
| **Loaded spec version** | `loadedSpecVersion` — catalog version last applied to pane listing |
| **Snapshot display spec** | `displaySpecId` on workspace snapshot v2 panes — restored with mesh bridge |
| **Files page** | “file manager page”, `src/app/files/page.tsx` (server component) |
| **Layout type** | “layout mode” — values `tile`, `oneRow`, `oneColumn`, `fullscreen` |
| **Pane bounds** | `PaneBounds` — pixel `x`, `y`, `width`, `height` from layout calculator |
| **Workspace area** | Flex region below header/toolbars; `data-testid="workspace-area"`; `flex-1 min-h-0` |
| **Container dimensions** | `containerWidth` / `containerHeight` — measured client box passed to `calculateLayout` (not viewport) |
| **useElementSize** | Hook in `src/lib/useElementSize.ts` — ResizeObserver on workspace area |
| **Pane management** | “add/remove split” — gated by `layout.allowPaneManagement` and `layout.maxPanes` |
| **Cross-surface link** | New-tab link between File Manager workspace and Mesh GUI ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)) |
| **Workspace header cross-surface nav** | Header `<nav>` with Mesh Sync link; not pane toolbar |
| **Workspace header banner** | Top `<header>` strip — title, status row, Diff, cross-surface nav (no layout control) |
| **Shared sort** | Workspace-wide default sort (`sharedSort`); persisted in snapshot v3; shown on mesh detail as **Shared sort** in workspace snapshot summary |
| **File column** | Metadata field in pane listing: `mtime`, `size`, or `name` (`FileColumnId`) |
| **File column order** | Workspace `fileColumns` array order; YAML default; overridable via `view.columns` dialog; persisted in snapshot v4 `fileColumns` |
| **Tabular file row** | CSS grid row in `FilePane` (`file-row-grid`) with aligned column cells; no listing header row |
| **Content-measured file columns** | `fileColumnWidthMode: contentFixed` — Size/Time fixed `ch` from max formatted cell text; Name `minmax(0, 1fr)` remainder |
| **OneColumn shared file column widths** | `metadataColumnWidths` from workspace max Size/Time across all panes when layout is `OneColumn`; Name `minmax(0, 1fr)` per pane |
| **Mesh detail snapshot sort** | Per-pane sort lines in `workspace-snapshot-summary` | `formatPaneSortSettings` | `WORKSPACE_SNAPSHOT_SUMMARY` |
| **Share sort** | Sort menu action — copy focused pane sort into `sharedSort` |
| **Apply shared sort** | Sort menu **Shared** — apply `sharedSort` to focused pane only |
| **Layout toolbar picker** | `view.layout` → `LayoutPickerPopover`; replaces header layout `<select>` |
| **Workspace header status row** | `workspace-header-status` — groups loaded name, restore warnings, and bootstrap errors below title |
| **Layout normalization** | Map config/UI aliases to canonical `LayoutType` — `normalizeLayoutType`, pseudo block `NORMALIZE_LAYOUT` ([IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml)) |
| **Mesh restore pending** | Server did not hydrate panes; client will rehydrate from `/api/mesh/:meshId` | prop `meshRestorePending` |
| **Client mesh rehydrate** | One-shot client fetch + full snapshot apply in `WorkspaceView` | `RESTORE_LAYOUT_IN_WORKSPACE_VIEW` |
| **Client restored from mesh** | Client recovery after server `getMesh` miss | state `clientRestoredFromMesh` |
| **Workspace restore pending** | In-progress client rehydrate banner | `data-testid="workspace-restore-pending"` |
| **Workspace restore bundle** | Hydrated restore props from snapshot | `buildWorkspaceRestoreBundle` / `BUILD_WORKSPACE_RESTORE_BUNDLE` |

## Naming bridge

| Canonical concept | UI label | Config key | Keybind action | Code symbol |
| --- | --- | --- | --- | --- |
| Workspace toolbar | (group names in YAML) | `toolbars.workspace` | various | `WorkspaceView` + `Toolbar` |
| Add pane | “Add Pane” | `copy.paneManagement.addPane` | `pane.add` | `handleAddPane` |
| Remove pane | “Remove Pane” | `copy.paneManagement.removePane` | `pane.remove` | `handleRemovePane` |
| Default pane count | — | `layout.defaultPaneCount` | — | startup pane array length |
| Max panes | “Maximum number of panes reached” | `layout.maxPanes` (`0` = no limit) | — | validation in `handleAddPane` |
| Layout: tile | “Tile” | `layout.default: tile` | — | `LayoutType` / `calculateLayout` |
| Workspace area | (flex region below toolbars) | — | — | `workspace-area`, `workspaceAreaRef`, `useElementSize` |
| Container dimensions | — | — | — | `containerWidth`, `containerHeight` |
| Focused pane | (visual focus ring) | — | `navigate.tab` | `focusIndex`, `setFocusIndex` |
| Mesh Sync (header) | “Mesh Sync” | — | — | `open-mesh-from-workspace`, `NewTabLink` |
| Shared sort | Sort menu **Shared** / **Share** | `copy.sort.sharedButton` / `shareButton` | — | `sharedSort`, `setSharedSort` |
| Layout toolbar picker | Layout pop-over options | `copy.layouts.*` | `view.layout` (Ctrl+Shift+L) | `LayoutPickerPopover`, `layoutPickerOpen` |
| Column order dialog | “Column order” | `copy.columns.*` | `view.columns` (no shortcut) | `ColumnOrderDialog`, `columnOrderDialogOpen`, `fileColumns` |
| File columns (config) | Column visibility/format defaults | `columns` in `config/files.yaml` | — | `FilesColumnConfig[]` |

## Named concepts

- **Workspace** — Client root at `/files` that owns `panes[]`, `focusIndex`, dialogs, and keybinding dispatch (`WorkspaceView`).
- **Pane** — One directory listing with its own path, cursor, marks, and sort; rendered by `FilePane`.
- **Focus** — Exactly one pane index (`focusIndex`) receives keyboard/file-operation commands unless linked mode propagates navigation ([linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)).
- **Pane lifecycle** — Add/remove panes with constraints; see [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml).
- **Active display spec** — Per-pane `activeDisplaySpecId` selects a named filter catalog entry; `hiddenCount` and `loadedSpecVersion` track apply state ([pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)).
- **Workspace snapshot display spec** — v2+ mesh snapshots persist `displaySpecId` per pane for restore ([REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)); mesh detail shows **Display filter** per pane (catalog name when resolvable, else id).
- **Layout calculator** — Maps container size + layout type + pane count → `PaneBounds[]` (`src/lib/files.layout.ts`).
- **Workspace area** — `flex-1 min-h-0` DOM region holding panes; measured via `useElementSize` on `workspaceAreaRef` (`data-testid="workspace-area"`).
- **Container dimensions** — `containerWidth` and `containerHeight` from workspace-area `clientWidth`/`clientHeight`, not `window.innerWidth` or fixed chrome subtraction.
- **useElementSize** — ResizeObserver hook; re-measures when toolbar display deps change ([IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml), [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml)).
- **Startup paths** — `startup.mode` (`configured` \| `last` \| `home`) and `startup.paths.paneN` in `config/files.yaml`.
- **Parent navigation** — `navigate.parent` / Parent `..` button; must route through `handleNavigate` / `navigateToParent` for linked sync.
- **Save workspace as mesh** — Toolbar action `mesh.saveWorkspace` (Ctrl+Shift+M); update current mesh when loaded via `meshId`, or save as new ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)).
- **Diff workspace** — `mesh.diffWorkspace` / header **Diff** button compares live state to saved snapshot (`diffWorkspaceSnapshots`).
- **Loaded workspace name** — Header `workspace-loaded-name` when `/files?meshId=` resolves a mesh; replaces the former green success line on successful restore.
- **Mesh restore pending** — `meshRestorePending` defers default startup panes; client runs full rehydrate when server `getMesh` misses the mesh.
- **Client mesh rehydrate** — `WorkspaceView` fetches `/api/mesh/:meshId` and applies `buildWorkspaceRestoreBundle` with `listDirectoryViaFilesApi`.
- **Client restored from mesh** — `clientRestoredFromMesh` after successful client rehydrate; header uses amber warning with API recovery prefix.
- **Workspace restore pending** — `workspace-restore-pending` while `meshRehydrating` is true.
- **Workspace restore bundle** — `WorkspaceRestoreBundle` from `buildWorkspaceRestoreBundle` (initial panes + restore UI props).
- **Workspace restore warning** — Amber `workspace-restore-warning` when partial server restore or client recovery succeeded (`restoredFromMesh` or `clientRestoredFromMesh` with warning text).
- **Workspace restore error** — Red `workspace-restore-error` only when `restoreWarning` is set, server did not restore, client has not recovered, and rehydrate is not in progress.
- **Workspace header banner** — Compact top header (`px-4 py-2`) with title, `workspace-header-status` row (`data-testid="workspace-header-status"`), Diff, and cross-surface nav (layout via toolbar picker).
- **Shared sort** — `sharedSort` on workspace state and mesh snapshot v3; default for new panes; **Share** / **Shared** in sort menu.
- **Layout toolbar picker** — Pop-over from workspace toolbar `view.layout` (`workspace-layout-picker`).
- **Workspace header status row** — `workspace-header-status` container below title; holds loaded name, warnings, and errors.
- **Layout normalization** — `normalizeLayoutType` at snapshot capture, parse, Files page restore, and `WorkspaceView` init so stored aliases (e.g. `oneRow`, `"One Row"`) round-trip to canonical layout geometry.
- **Restore from mesh** — `/files?meshId={id}` hydrates panes from mesh depots and `description` snapshot JSON.
- **Workspace header cross-surface nav** — `workspace-cross-surface-nav` with **Mesh Sync** `NewTabLink` to `/mesh` or `/mesh/{meshId}` in a new tab.
- **Workspace keyboard-shortcuts footer** — removed; shortcut discovery uses toolbar keystroke badges (expanded mode), tooltips (compact mode), and system help actions ([toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)). Linked mode indicator is toolbar `link.toggle` active state, not a footer strip.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Workspace dialog remount keys | `DialogKeys` → `IMPL-WORKSPACE_VIEW_DialogKeys` | IMPL-WORKSPACE_VIEW |
| Keybinding handler registration | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| Add pane | `AddPane` → `IMPL-PANE_MANAGEMENT_AddPane` | IMPL-PANE_MANAGEMENT |
| Remove pane | `RemovePane` → `IMPL-PANE_MANAGEMENT_RemovePane` | IMPL-PANE_MANAGEMENT |
| Layout: tile / one row / column / fullscreen | `Tile`, `OneRow`, `OneColumn`, `Fullscreen` | IMPL-LAYOUT_CALCULATOR |
| Workspace area measurement | `WORKSPACE_AREA_MEASUREMENT` → `IMPL-LAYOUT_CALCULATOR_WorkspaceAreaMeasurement` | IMPL-LAYOUT_CALCULATOR (+ IMPL-TOOLBAR_COMPONENT display mode) |
| File row render + scroll | `RenderFileRows`, `ScrollToCursor` | IMPL-FILE_PANE |
| Tabular file row grid | `TABULAR_FILE_ROW_GRID` | IMPL-FILE_PANE, IMPL-FILE_COLUMN_CONFIG |
| Measure file column widths | `MEASURE_FILE_COLUMN_WIDTHS` | IMPL-FILE_COLUMN_CONFIG |
| OneColumn shared metadata widths | `SHARED_METADATA_WIDTHS_ONECOLUMN` | IMPL-WORKSPACE_VIEW, IMPL-FILE_COLUMN_CONFIG |
| Column order dialog | `COLUMN_ORDER_DIALOG` | IMPL-WORKSPACE_VIEW, IMPL-FILE_COLUMN_CONFIG |
| Snapshot v4 file columns | `SNAPSHOT_V4_FILE_COLUMNS` | IMPL-WORKSPACE_MESH_BRIDGE |
| Layout normalization | `NORMALIZE_LAYOUT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Capture workspace snapshot | `CAPTURE_SNAPSHOT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Build mesh create payload | `BUILD_MESH_PAYLOAD` | IMPL-WORKSPACE_MESH_BRIDGE |
| Parse snapshot from mesh | `PARSE_SNAPSHOT_FROM_MESH` | IMPL-WORKSPACE_MESH_BRIDGE |
| Restore on Files page | `RESTORE_ON_FILES_PAGE` | IMPL-WORKSPACE_MESH_BRIDGE |
| Save workspace from UI | `STORE_FROM_WORKSPACE_UI` | IMPL-WORKSPACE_MESH_BRIDGE |
| Show loaded workspace name | `SHOW_LOADED_WORKSPACE_NAME` | IMPL-WORKSPACE_MESH_BRIDGE |
| Header status row (warnings/errors) | `WORKSPACE_HEADER_STATUS` | IMPL-WORKSPACE_MESH_BRIDGE |
| Workspace header status row | `WORKSPACE_HEADER_STATUS` | IMPL-WORKSPACE_MESH_BRIDGE |
| Update existing workspace | `UPDATE_EXISTING_WORKSPACE` | IMPL-WORKSPACE_MESH_BRIDGE |
| Diff saved vs current | `DIFF_SAVED_VS_CURRENT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Apply max panes on restore | `APPLY_MAX_PANES_LIMIT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Append snapshot layout warnings | `APPEND_SNAPSHOT_LAYOUT_WARNINGS` | IMPL-WORKSPACE_MESH_BRIDGE |
| Build workspace restore bundle | `BUILD_WORKSPACE_RESTORE_BUNDLE` | IMPL-WORKSPACE_MESH_BRIDGE |
| List directory via files API (client) | `LIST_DIRECTORY_VIA_FILES_API` | IMPL-WORKSPACE_MESH_BRIDGE |
| Header link to Mesh | `WORKSPACE_HEADER_MESH_LINK` | IMPL-WORKSPACE_MESH_BRIDGE |
| Shared sort workspace | `SharedSortWorkspace` | IMPL-SORT_FILTER |
| Layout toolbar picker | `LAYOUT_TOOLBAR_PICKER` | IMPL-WORKSPACE_VIEW |

## Alphabetical index

- **Apply shared sort** — Sort menu **Shared** applies `sharedSort` to focused pane only
- **Client mesh rehydrate** — client full restore when server bootstrap misses mesh
- **Client restored from mesh** — `clientRestoredFromMesh` after API recovery
- **Cross-surface link** — new-tab Mesh ↔ File Manager navigation (`NewTabLink`)
- **Diff workspace** — `mesh.diffWorkspace` / header **Diff**; `diffWorkspaceSnapshots` vs saved baseline
- **Files page** — server entry; loads config + initial directory data
- **Focus** — `focusIndex`
- **Mesh restore pending** — `meshRestorePending`; skip default startup panes
- **Loaded workspace name** — header `workspace-loaded-name` when `/files?meshId=` resolves; no redundant success message
- **Layout toolbar picker** — `view.layout` → `workspace-layout-picker` pop-over
- **Layout normalization** — `normalizeLayoutType` / `NORMALIZE_LAYOUT`
- **Layout type** — `tile`, `oneRow`, `oneColumn`, `fullscreen`
- **Pane** — single listing column
- **Pane bounds** — geometry for CSS placement
- **Pane management** — add/remove panes
- **Pane state** — per-pane React state object
- **Restore from mesh** — `/files?meshId=` server bootstrap + client `restoreUi`
- **Shared sort** — workspace `sharedSort`; snapshot v3; new-pane default
- **Share sort** — Sort menu **Share** copies draft sort into `sharedSort`
- **Update workspace** — save dialog update mode when mesh loaded (`PUT` workspace route)
- **Workspace** — multi-pane client shell
- **Workspace header banner** — compact title + status row + controls
- **Workspace header status row** — `workspace-header-status`; loaded name, warnings, errors
- **Workspace header cross-surface nav** — header `workspace-cross-surface-nav`, **Mesh Sync** link
- **Workspace restore bundle** — `buildWorkspaceRestoreBundle` output
- **Workspace restore error** — `workspace-restore-error` (unrecovered bootstrap failure)
- **Workspace restore pending** — `workspace-restore-pending` during client rehydrate
- **Workspace restore warning** — `workspace-restore-warning` (partial or client recovery)
- **Workspace snapshot** — v1/v2/v3/v4 JSON in mesh `description.workspaceSnapshot`; v2 adds per-pane `displaySpecId`; v3 adds `sharedSort`; v4 adds `fileColumns` (see [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md), [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md))
- **File column order** — `fileColumns` on workspace state; restored from mesh v4; reordered via toolbar `view.columns` dialog
- **Tabular file row** — `FilePane` grid layout with `file-column-{id}` cells only (no column name header row)
- **Content-measured file columns** — non-OneColumn layouts size Time/Size from listing content per pane, Name fills remainder
- **OneColumn shared file column widths** — workspace-wide max Size/Time `ch` passed to every pane for vertical alignment; Name still flex remainder
- **Active display spec** — `activeDisplaySpecId` on pane state
- **Hidden item count** — `hiddenCount` when a display spec is active
- **Loaded spec version** — `loadedSpecVersion` after catalog apply
- **Snapshot display spec** — `displaySpecId` in v2 workspace snapshot panes

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)
- [file-marking-vocabulary.md](file-marking-vocabulary.md)
- [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md) — workspace/pane/system toolbars, compact toggle
