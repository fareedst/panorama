# Toolbar and keybind vocabulary (canonical)

## Scope

**Toolbar** system (workspace / pane / system tiers), **keybinding actions** (dot-separated IDs), and how toolbars derive labels/shortcuts from `config/files.yaml`. Full key list remains in config (behavior inventory). Excludes layout geometry ([workspace-pane-vocabulary.md](workspace-pane-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml), [REQ-TOOLBAR_CONFIG](../tied/requirements/REQ-TOOLBAR_CONFIG.yaml), [REQ-KEYBOARD_SHORTCUTS_COMPLETE](../tied/requirements/REQ-KEYBOARD_SHORTCUTS_COMPLETE.yaml), [REQ-KEYBOARD_NAVIGATION](../tied/requirements/REQ-KEYBOARD_NAVIGATION.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml) |
| ARCH | [ARCH-TOOLBAR_LAYOUT](../tied/architecture-decisions/ARCH-TOOLBAR_LAYOUT.yaml), [ARCH-TOOLBAR_ACTIONS](../tied/architecture-decisions/ARCH-TOOLBAR_ACTIONS.yaml), [ARCH-KEYBIND_SYSTEM](../tied/architecture-decisions/ARCH-KEYBIND_SYSTEM.yaml) |
| IMPL | [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-TOOLBAR_CONFIG](../tied/implementation-decisions/IMPL-TOOLBAR_CONFIG.yaml), [IMPL-KEYBINDS](../tied/implementation-decisions/IMPL-KEYBINDS.yaml) |
| Pseudo-code | [IMPL-TOOLBAR_COMPONENT-pseudocode.md](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT-pseudocode.md), [IMPL-KEYBINDS-pseudocode.md](../tied/implementation-decisions/IMPL-KEYBINDS-pseudocode.md) |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Toolbar** | “button bar”, “action bar” |
| **Workspace toolbar** | “global toolbar”, `toolbars.workspace` — layout, link, refresh-all |
| **Pane toolbar** | “file toolbar”, `toolbars.pane` — per-pane file ops |
| **System toolbar** | `toolbars.system` — help, search, command palette |
| **Action** | Dot-separated ID: `file.copyAll`, `navigate.parent` — same string in toolbar config and keybindings |
| **Keybinding** | One YAML row: `key`, `modifiers`, `action`, `category` |
| **Keybinding category** | `navigation`, `file-operations`, `marking`, `view`, `system`, `pane-management`, … |
| **Active action** | Toolbar button pressed/highlighted state (`activeActions` Set) |
| **Disabled action** | Context-gated (`disabledActions` Set) — e.g. copy with no marks |
| **Toolbar test id** | `data-testid="toolbar-{action}"` e.g. `toolbar-file.copyAll` |
| **Toolbar-only action** | Listed in `toolbars.actions` in `config/files.yaml`; no `keybindings` row required |
| **toolbars.actions** | Catalog of `description`, optional `icon` / `label` for mouse-only toolbar buttons |
| **Toolbar compact mode** | Single merged top row; icon-only buttons (no keystroke badges) |
| **Toolbar expanded mode** | Default three-tier layout with keystroke badges on each button |
| **Toolbar compact toggle** | Leading control on first top toolbar; `data-testid="toolbar-compact-toggle"` |
| **leadingContent** | Optional slot before the first button group (toggle, future chrome); passed to `Toolbar` / tier wrappers |
| **Session toolbar display state** | `toolbarExpanded` in `WorkspaceView` (session-only, not URL/mesh); synonym: toolbar display mode |
| **singleRow** | `Toolbar` prop: one horizontal row with overflow scroll (compact merged layout) |

## Naming bridge

| Canonical concept | UI | Config | Handler registration |
| --- | --- | --- | --- |
| Workspace toolbar | top bar groups | `toolbars.workspace.groups[].actions` | `WorkspaceView` `onAction` |
| Pane toolbar | per-pane bar | `toolbars.pane` | same dispatcher |
| System toolbar | help/search | `toolbars.system` | same |
| Action dispatch | button click | action string | `handlers.set("file.copyAll", …)` |
| Shortcut badge | on button | via `deriveToolbarButton` + registry | `getKeybindingRegistry()` |
| Copy to all | icon + Shift+C | `file.copyAll` in pane group | `handleCopyAll` |
| Command palette | “Command Palette” | `command.palette` | Ctrl+P |
| Save workspace as mesh | “Save workspace as mesh” (Mesh group) | `copy.workspaceMesh.saveDialogTitle` | `mesh.saveWorkspace` (Ctrl+Shift+M) | `handleSaveWorkspaceAsMesh` / update via dialog ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| Diff workspace vs saved | “Diff” (header + Mesh group) | `copy.workspaceMesh.diffButton` | `mesh.diffWorkspace` | `WorkspaceDiffDialog` ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| Manage display specs | “Manage display specs…” (dialog title from copy) | `copy.displaySpec.*` | `view.displaySpec` | `DisplaySpecManagerDialog` ([REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml)) |
| Clear display filter | “No filter” (pane selector) | — | `view.displaySpec.none` | `handleSetActiveDisplaySpec(focusIndex, null)` |
| Choose workspace layout | Layout pop-over | `copy.layouts.*` | `view.layout` (Ctrl+Shift+L) | `LayoutPickerPopover`, `setLayout` |
| Column order | “Column order” dialog | `copy.columns.*` + `toolbars.actions.view.columns` | `view.columns` (no keybind) | `ColumnOrderDialog`, `setFileColumns` |

### Action namespace prefixes (stable)

| Prefix | Domain |
| --- | --- |
| `navigate.*` | Directory cursor, enter, parent, tab, home |
| `file.*` | copy, move, delete, rename, **copyAll**, **moveAll** |
| `mark.*` | marking ([file-marking-vocabulary.md](file-marking-vocabulary.md)) |
| `view.*` | sort, layout picker (`view.layout`), column order dialog (`view.columns`, toolbar-only), comparison mode, hidden files, display filter specs (`view.displaySpec`, `view.displaySpec.none`) |
| `link.*` | linked mode toggle |
| `pane.*` | add, remove, refresh, refresh-all |
| `search.*` | finder vs content search |
| `history.*` | back / forward |
| `bookmark.*` | bookmark ops |
| `help.*` / `command.*` | system |
| `mesh.*` | workspace → mesh bridge ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)); e.g. `mesh.saveWorkspace`, `mesh.diffWorkspace` |

Authoritative enumeration: `config/files.yaml` → `keybindings`.

## Named concepts

- **Configuration-driven toolbar** — Groups and action lists in YAML; no hardcoded button order in React.
- **Shared dispatch** — Toolbar `onAction(action)` and keyboard layer call the same handler map in `WorkspaceView`.
- **deriveToolbarButton** — Resolves icon, label, shortcut from keybinding registry, else `toolbars.actions` metadata (`src/lib/toolbar.utils.ts`). Keybinding wins when both exist.
- **Toolbar-only action** — `toolbars.actions.{actionId}` supplies button metadata without registering a keyboard shortcut.
- **ToolbarButton** — Compact icon + keystroke badge component (`ToolbarButton.tsx`).
- **mesh.saveWorkspace** — Workspace toolbar action; icon `network` in `toolbar.utils.ts`; opens save dialog (update current mesh when `meshId` set, else POST `/api/mesh`).
- **mesh.diffWorkspace** — Compare live workspace to saved snapshot; icon `git-compare`; disabled without loaded snapshot.
- **Toolbar compact toggle** — UI-only leading control; not a keybinding action; switches compact/expanded toolbar display.
- **Merged toolbar config** — Runtime concat of enabled top-position tier groups via `mergeTopToolbarConfigs` (`src/lib/toolbar.utils.ts`).
- **Toggle placement rule** — Compact toggle on the **first visible top tier** in order workspace → pane → system (`showWorkspaceTop`, `showPaneTop`, `showSystemTop` in `WorkspaceView`).
- **leadingContent** — Renders before the first group; vertical separator when groups follow.
- **Workspace area remeasure** — Compact/expanded toggle changes vertical chrome; `useElementSize` on `workspace-area` updates `containerHeight` and pane bounds ([REQ-MULTI_PANE_LAYOUT](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml)).
- **view.layout** — Opens layout picker pop-over (`LayoutPickerPopover`, `workspace-layout-picker`); replaces header layout `<select>`.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Toolbar React structure | `MainBehavior` → `IMPL-TOOLBAR_COMPONENT_MainBehavior` | IMPL-TOOLBAR_COMPONENT |
| Config load/types | `MainBehavior` → `IMPL-TOOLBAR_CONFIG_MainBehavior` | IMPL-TOOLBAR_CONFIG |
| Registry / validation | (see IMPL-KEYBINDS sidecar) | IMPL-KEYBINDS |
| Workspace keybind map | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |
| Toolbar compact toggle | `TOOLBAR_COMPACT_TOGGLE` → `IMPL-TOOLBAR_COMPONENT_ToolbarCompactToggle` | IMPL-TOOLBAR_COMPONENT |
| Merge top toolbars | `MERGE_TOP_TOOLBARS` → `IMPL-TOOLBAR_COMPONENT_MergeTopToolbars` | IMPL-TOOLBAR_COMPONENT |
| Workspace toolbar display | `WORKSPACE_TOOLBAR_DISPLAY_MODE` → `IMPL-TOOLBAR_COMPONENT_WorkspaceToolbarDisplayMode` | IMPL-TOOLBAR_COMPONENT |
| Save workspace from UI | `STORE_FROM_WORKSPACE_UI` | IMPL-WORKSPACE_MESH_BRIDGE |
| Diff saved vs current | `DIFF_SAVED_VS_CURRENT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Layout toolbar picker | `LAYOUT_TOOLBAR_PICKER` | IMPL-WORKSPACE_VIEW |

## Alphabetical index

- **Action** — `category.action` string ID
- **Active action** — toolbar highlight set
- **Disabled action** — toolbar grayed set
- **Keybinding** — YAML shortcut row
- **Keybinding category** — grouping for help UI
- **leadingContent** — leading slot before first toolbar group
- **Session toolbar display state** — `toolbarExpanded` session flag in WorkspaceView
- **singleRow** — compact merged toolbar horizontal layout flag
- **mesh.diffWorkspace** — workspace Mesh group + header Diff; disabled without saved baseline
- **mesh.saveWorkspace** — Ctrl+Shift+M; workspace Mesh toolbar group (update or save-as-new)
- **view.displaySpec** — open display spec manager dialog
- **view.displaySpec.none** — clear active display spec on focused pane
- **view.layout** — workspace layout picker (Ctrl+Shift+L); icon `layout-grid`
- **Pane toolbar** — `toolbars.pane`
- **System toolbar** — `toolbars.system`
- **Toolbar compact mode** — single merged top row; icon-only buttons
- **Toolbar compact toggle** — `toolbar-compact-toggle`
- **Toolbar expanded mode** — three-tier layout with keystroke badges
- **Toolbar test id** — `toolbar-{action}`
- **Workspace toolbar** — `toolbars.workspace`
- **Workspace area** — measured flex region; `data-testid="workspace-area"`
- **useElementSize** — ResizeObserver hook feeding pane layout (`src/lib/useElementSize.ts`)

## See also

- [panorama-domain-references.md](panorama-domain-references.md) — behavior inventories pointer
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md) — `link.toggle`
- [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) — `file.copyAll` / `file.moveAll`
