# Workspace and pane vocabulary (canonical)

## Scope

Covers the **multi-pane file manager shell**: server **Files page**, client **workspace**, individual **panes**, **focus**, and **layout** geometry. Excludes NSYNC sync algorithms ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)), cross-pane comparison coloring ([cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)), and Mesh platform terms ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MANAGER_PAGE](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml) |
| ARCH | [ARCH-FILE_MANAGER_HIERARCHY](../tied/architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml), [ARCH-PANE_LIFECYCLE](../tied/architecture-decisions/ARCH-PANE_LIFECYCLE.yaml) |
| IMPL | [IMPL-FILE_MANAGER_PAGE](../tied/implementation-decisions/IMPL-FILE_MANAGER_PAGE.yaml), [IMPL-WORKSPACE_VIEW](../tied/implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml), [IMPL-LAYOUT_CALCULATOR](../tied/implementation-decisions/IMPL-LAYOUT_CALCULATOR.yaml) |
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

## Named concepts

- **Workspace** — Client root at `/files` that owns `panes[]`, `focusIndex`, dialogs, and keybinding dispatch (`WorkspaceView`).
- **Pane** — One directory listing with its own path, cursor, marks, and sort; rendered by `FilePane`.
- **Focus** — Exactly one pane index (`focusIndex`) receives keyboard/file-operation commands unless linked mode propagates navigation ([linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)).
- **Pane lifecycle** — Add/remove panes with constraints; see [IMPL-PANE_MANAGEMENT](../tied/implementation-decisions/IMPL-PANE_MANAGEMENT.yaml).
- **Layout calculator** — Maps container size + layout type + pane count → `PaneBounds[]` (`src/lib/files.layout.ts`).
- **Startup paths** — `startup.mode` (`configured` \| `last` \| `home`) and `startup.paths.paneN` in `config/files.yaml`.
- **Parent navigation** — `navigate.parent` / Parent `..` button; must route through `handleNavigate` / `navigateToParent` for linked sync.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Workspace dialog remount keys | `DialogKeys` → `IMPL-WORKSPACE_VIEW_DialogKeys` | IMPL-WORKSPACE_VIEW |
| Keybinding handler registration | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| Add pane | `AddPane` → `IMPL-PANE_MANAGEMENT_AddPane` | IMPL-PANE_MANAGEMENT |
| Remove pane | `RemovePane` → `IMPL-PANE_MANAGEMENT_RemovePane` | IMPL-PANE_MANAGEMENT |
| Layout: tile / one row / column / fullscreen | `Tile`, `OneRow`, `OneColumn`, `Fullscreen` | IMPL-LAYOUT_CALCULATOR |
| File row render + scroll | `RenderFileRows`, `ScrollToCursor` | IMPL-FILE_PANE |

## Alphabetical index

- **Files page** — server entry; loads config + initial directory data
- **Focus** — `focusIndex`
- **Layout type** — `tile`, `oneRow`, `oneColumn`, `fullscreen`
- **Pane** — single listing column
- **Pane bounds** — geometry for CSS placement
- **Pane management** — add/remove panes
- **Pane state** — per-pane React state object
- **Workspace** — multi-pane client shell

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md)
- [file-marking-vocabulary.md](file-marking-vocabulary.md)
