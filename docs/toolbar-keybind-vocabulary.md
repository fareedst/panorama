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
| Save workspace as mesh | “Save workspace as mesh” (Mesh group) | `copy.workspaceMesh.saveDialogTitle` | `mesh.saveWorkspace` (Ctrl+Shift+M) | `handleSaveWorkspaceAsMesh` ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |

### Action namespace prefixes (stable)

| Prefix | Domain |
| --- | --- |
| `navigate.*` | Directory cursor, enter, parent, tab, home |
| `file.*` | copy, move, delete, rename, **copyAll**, **moveAll** |
| `mark.*` | marking ([file-marking-vocabulary.md](file-marking-vocabulary.md)) |
| `view.*` | sort, comparison mode, hidden files |
| `link.*` | linked mode toggle |
| `pane.*` | add, remove, refresh, refresh-all |
| `search.*` | finder vs content search |
| `history.*` | back / forward |
| `bookmark.*` | bookmark ops |
| `help.*` / `command.*` | system |
| `mesh.*` | workspace → mesh bridge ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)); e.g. `mesh.saveWorkspace` |

Authoritative enumeration: `config/files.yaml` → `keybindings`.

## Named concepts

- **Configuration-driven toolbar** — Groups and action lists in YAML; no hardcoded button order in React.
- **Shared dispatch** — Toolbar `onAction(action)` and keyboard layer call the same handler map in `WorkspaceView`.
- **deriveToolbarButton** — Resolves icon, label, shortcut display from action + registry (`src/lib/toolbar.utils.ts`).
- **ToolbarButton** — Compact icon + keystroke badge component (`ToolbarButton.tsx`).
- **mesh.saveWorkspace** — Workspace toolbar action; icon `network` in `toolbar.utils.ts`; opens save dialog then POST `/api/mesh`.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Toolbar React structure | `MainBehavior` → `IMPL-TOOLBAR_COMPONENT_MainBehavior` | IMPL-TOOLBAR_COMPONENT |
| Config load/types | `MainBehavior` → `IMPL-TOOLBAR_CONFIG_MainBehavior` | IMPL-TOOLBAR_CONFIG |
| Registry / validation | (see IMPL-KEYBINDS sidecar) | IMPL-KEYBINDS |
| Workspace keybind map | `KeybindingInit` → `IMPL-WORKSPACE_VIEW_KeybindingInit` | IMPL-WORKSPACE_VIEW |

## Alphabetical index

- **Action** — `category.action` string ID
- **Active action** — toolbar highlight set
- **Disabled action** — toolbar grayed set
- **Keybinding** — YAML shortcut row
- **Keybinding category** — grouping for help UI
- **mesh.saveWorkspace** — Ctrl+Shift+M; workspace Mesh toolbar group
- **Pane toolbar** — `toolbars.pane`
- **System toolbar** — `toolbars.system`
- **Toolbar test id** — `toolbar-{action}`
- **Workspace toolbar** — `toolbars.workspace`

## See also

- [panorama-domain-references.md](panorama-domain-references.md) — behavior inventories pointer
- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md) — `link.toggle`
- [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) — `file.copyAll` / `file.moveAll`
