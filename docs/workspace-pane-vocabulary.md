# Workspace and pane vocabulary (canonical)

## Scope

Covers the **multi-pane file manager shell**: server **Files page**, client **workspace**, individual **panes**, **focus**, and **layout** geometry. Excludes NSYNC sync algorithms ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)), cross-pane comparison coloring ([cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)), and Mesh platform terms ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MANAGER_PAGE](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml) |
| ARCH | [ARCH-FILE_MANAGER_HIERARCHY](../tied/architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml), [ARCH-PANE_LIFECYCLE](../tied/architecture-decisions/ARCH-PANE_LIFECYCLE.yaml) |
| IMPL | [IMPL-FILE_MANAGER_PAGE](../tied/implementation-decisions/IMPL-FILE_MANAGER_PAGE.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml), [IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-*-pseudocode.md` for the IMPL tokens above |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Workspace** | “file manager view”, `WorkspaceView` (React component name) |
| **Pane** | “panel”, “column”, “split” — always **pane** in prose and pseudo-code |
| **Focused pane** | “active pane”, `focusIndex` (state index into `panes[]`) |
| **Pane state** | `PaneState` — path, files, cursor, marks, sort per pane |
| **Files page** | “file manager page”, `src/app/files/page.tsx` (server component) |
| **Layout type** | “layout mode” — values `tile`, `oneRow`, `oneColumn`, `fullscreen` |
| **Pane bounds** | `PaneBounds` — pixel `x`, `y`, `width`, `height` from layout calculator |
| **Pane management** | “add/remove split” — gated by `layout.allowPaneManagement` and `layout.maxPanes` |
| **Cross-surface link** | New-tab link between File Manager workspace and Mesh GUI ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)) |
| **Workspace header cross-surface nav** | Header `<nav>` with Mesh Sync link; not pane toolbar |
| **Layout normalization** | Map config/UI aliases to canonical `LayoutType` — `normalizeLayoutType`, pseudo block `NORMALIZE_LAYOUT` ([IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml)) |

## Naming bridge

| Canonical concept | UI label | Config key | Keybind action | Code symbol |
| --- | --- | --- | --- | --- |
| Workspace toolbar | (group names in YAML) | `toolbars.workspace` | various | `WorkspaceView` + `Toolbar` |
| Add pane | “Add Pane” | `copy.paneManagement.addPane` | `pane.add` | `handleAddPane` |
| Remove pane | “Remove Pane” | `copy.paneManagement.removePane` | `pane.remove` | `handleRemovePane` |
| Default pane count | — | `layout.defaultPaneCount` | — | startup pane array length |
| Max panes | “Maximum number of panes reached” | `layout.maxPanes` (`0` = no limit) | — | validation in `handleAddPane` |
| Layout: tile | “Tile” | `layout.default: tile` | — | `LayoutType` / `calculateLayout` |
| Focused pane | (visual focus ring) | — | `navigate.tab` | `focusIndex`, `setFocusIndex` |
| Mesh Sync (header) | “Mesh Sync” | — | — | `open-mesh-from-workspace`, `NewTabLink` |

## Named concepts

- **Workspace** — Client root at `/files` that owns `panes[]`, `focusIndex`, dialogs, and keybinding dispatch (`WorkspaceView`).
- **Pane** — One directory listing with its own path, cursor, marks, and sort; rendered by `FilePane`.
- **Focus** — Exactly one pane index (`focusIndex`) receives keyboard/file-operation commands unless linked mode propagates navigation ([linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)).
- **Pane lifecycle** — Add/remove panes with constraints; see [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml).
- **Layout calculator** — Maps container size + layout type + pane count → `PaneBounds[]` (`src/lib/files.layout.ts`).
- **Startup paths** — `startup.mode` (`configured` \| `last` \| `home`) and `startup.paths.paneN` in `config/files.yaml`.
- **Parent navigation** — `navigate.parent` / Parent `..` button; must route through `handleNavigate` / `navigateToParent` for linked sync.
- **Save workspace as mesh** — Toolbar action `mesh.saveWorkspace` (Ctrl+Shift+M); update current mesh when loaded via `meshId`, or save as new ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)).
- **Diff workspace** — `mesh.diffWorkspace` / header **Diff** button compares live state to saved snapshot (`diffWorkspaceSnapshots`).
- **Loaded workspace name** — Header `workspace-loaded-name` when `/files?meshId=` resolves a mesh.
- **Layout normalization** — `normalizeLayoutType` at snapshot capture, parse, Files page restore, and `WorkspaceView` init so stored aliases (e.g. `oneRow`, `"One Row"`) round-trip to canonical layout geometry.
- **Restore from mesh** — `/files?meshId={id}` hydrates panes from mesh depots and `description` snapshot JSON.
- **Workspace header cross-surface nav** — `workspace-cross-surface-nav` with **Mesh Sync** `NewTabLink` to `/mesh` or `/mesh/{meshId}` in a new tab.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Workspace dialog remount keys | `DialogKeys` → `IMPL-WORKSPACE_VIEW_DialogKeys` | IMPL-WORKSPACE_VIEW |
| Keybinding handler registration | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| Add pane | `AddPane` → `IMPL-PANE_MANAGEMENT_AddPane` | IMPL-PANE_MANAGEMENT |
| Remove pane | `RemovePane` → `IMPL-PANE_MANAGEMENT_RemovePane` | IMPL-PANE_MANAGEMENT |
| Layout: tile / one row / column / fullscreen | `Tile`, `OneRow`, `OneColumn`, `Fullscreen` | IMPL-LAYOUT_CALCULATOR |
| File row render + scroll | `RenderFileRows`, `ScrollToCursor` | IMPL-FILE_PANE |
| Layout normalization | `NORMALIZE_LAYOUT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Capture workspace snapshot | `CAPTURE_SNAPSHOT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Build mesh create payload | `BUILD_MESH_PAYLOAD` | IMPL-WORKSPACE_MESH_BRIDGE |
| Parse snapshot from mesh | `PARSE_SNAPSHOT_FROM_MESH` | IMPL-WORKSPACE_MESH_BRIDGE |
| Restore on Files page | `RESTORE_ON_FILES_PAGE` | IMPL-WORKSPACE_MESH_BRIDGE |
| Save workspace from UI | `STORE_FROM_WORKSPACE_UI` | IMPL-WORKSPACE_MESH_BRIDGE |
| Show loaded workspace name | `SHOW_LOADED_WORKSPACE_NAME` | IMPL-WORKSPACE_MESH_BRIDGE |
| Update existing workspace | `UPDATE_EXISTING_WORKSPACE` | IMPL-WORKSPACE_MESH_BRIDGE |
| Diff saved vs current | `DIFF_SAVED_VS_CURRENT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Apply max panes on restore | `APPLY_MAX_PANES_LIMIT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Header link to Mesh | `WORKSPACE_HEADER_MESH_LINK` | IMPL-WORKSPACE_MESH_BRIDGE |

## Alphabetical index

- **Cross-surface link** — new-tab Mesh ↔ File Manager navigation (`NewTabLink`)
- **Diff workspace** — `mesh.diffWorkspace` / header **Diff**; `diffWorkspaceSnapshots` vs saved baseline
- **Files page** — server entry; loads config + initial directory data
- **Focus** — `focusIndex`
- **Loaded workspace name** — header `workspace-loaded-name` when `/files?meshId=` resolves
- **Layout normalization** — `normalizeLayoutType` / `NORMALIZE_LAYOUT`
- **Layout type** — `tile`, `oneRow`, `oneColumn`, `fullscreen`
- **Pane** — single listing column
- **Pane bounds** — geometry for CSS placement
- **Pane management** — add/remove panes
- **Pane state** — per-pane React state object
- **Restore from mesh** — `/files?meshId=` server bootstrap + client `restoreUi`
- **Update workspace** — save dialog update mode when mesh loaded (`PUT` workspace route)
- **Workspace** — multi-pane client shell
- **Workspace header cross-surface nav** — header `workspace-cross-surface-nav`, **Mesh Sync** link
- **Workspace snapshot** — v1 JSON in mesh `description.workspaceSnapshot` (see [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md))

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)
- [file-marking-vocabulary.md](file-marking-vocabulary.md)
