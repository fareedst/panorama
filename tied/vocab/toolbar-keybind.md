# Toolbar and keybind vocabulary (canonical)

## Scope

**Toolbar** system (workspace / pane / system tiers), **keybinding actions** (dot-separated IDs), and how toolbars derive labels/shortcuts from `config/files.yaml`. Full key list remains in config (behavior inventory). Excludes layout geometry ([workspace-pane.md](workspace-pane.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml), [REQ-TOOLBAR_CONFIG](../tied/requirements/REQ-TOOLBAR_CONFIG.yaml), [REQ-KEYBOARD_SHORTCUTS_COMPLETE](../tied/requirements/REQ-KEYBOARD_SHORTCUTS_COMPLETE.yaml), [REQ-KEYBOARD_NAVIGATION](../tied/requirements/REQ-KEYBOARD_NAVIGATION.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml), [REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml) |
| ARCH | [ARCH-TOOLBAR_LAYOUT](../tied/architecture-decisions/ARCH-TOOLBAR_LAYOUT.yaml), [ARCH-TOOLBAR_ACTIONS](../tied/architecture-decisions/ARCH-TOOLBAR_ACTIONS.yaml), [ARCH-KEYBIND_SYSTEM](../tied/architecture-decisions/ARCH-KEYBIND_SYSTEM.yaml) |
| IMPL | [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-TOOLBAR_CONFIG](../tied/implementation-decisions/IMPL-TOOLBAR_CONFIG.yaml), [IMPL-KEYBINDS](../tied/implementation-decisions/IMPL-KEYBINDS.yaml) |
| Pseudo-code | [IMPL-TOOLBAR_COMPONENT-pseudocode.md](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT-pseudocode.md), [IMPL-KEYBINDS-pseudocode.md](../tied/implementation-decisions/IMPL-KEYBINDS-pseudocode.md) |

## See also

- [panorama-domain-references.md](panorama-domain-references.md) — behavior inventories pointer
- [linked-navigation.md](linked-navigation.md) — `link.toggle`
- [nsync-multi-target.md](nsync-multi-target.md) — `file.copyAll` / `file.moveAll`
- [cross-pane-visibility.md](cross-pane-visibility.md) — `view.compareFilter.*` tri-state filters
- [workspace-pane.md](workspace-pane.md) — pane management actions

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
| **Toolbar compact mode** | Default session layout — single merged top row; icon-only buttons (no keystroke badges) |
| **Toolbar expanded mode** | User-toggled three-tier layout with keystroke badges on each button |
| **Toolbar compact toggle** | Leading control on first top toolbar; `data-testid="toolbar-compact-toggle"` |
| **leadingContent** | Optional slot before the first button group (toggle, future chrome); passed to `Toolbar` / tier wrappers |
| **Session toolbar display state** | `toolbarExpanded` in `WorkspaceView` (session-only, not URL/mesh); default `false` (compact); synonym: toolbar display mode |
| **Tri-state toolbar button** | Compare filter criterion toggle — `inactive` \| `include` \| `exclude`; `data-tri-state` on `TriStateToolbarButton` |
| **singleRow** | `Toolbar` prop: one horizontal row with overflow scroll (compact merged layout) |
| **Icon name** | Kebab-case string passed to `Icon` (e.g. `layout-grid`, `copy-all`) |
| **Icon registry** | `src/components/icons/registry.ts` — merged `lucide-icons` + `panorama-icons` SVG definitions |
| **Panorama icons** | `panorama-icons.tsx` — app-specific glyphs (compare filters, mesh, multi-pane file ops) |
| **ACTION_ICON_MAP** | Action → icon name when a keybinding exists (`src/lib/toolbar.utils.ts`) |
| **icon-unknown** | Fallback glyph for unmapped actions (not **Help**; `help.show` uses `help-circle`) |
| **Toolbar view test id** | `data-testid="toolbar-{action}"` e.g. `toolbar-view.comparison`, `toolbar-file.copyAll` — Playwright demo selectors ([REQ-TOOLBAR_SYSTEM](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml)) |

## Naming bridge

| Canonical concept | UI | Config | Handler registration |
| --- | --- | --- | --- |
| Workspace toolbar | top bar groups | `toolbars.workspace.groups[].actions` | `WorkspaceView` `onAction` |
| Pane toolbar | per-pane bar | `toolbars.pane` | same dispatcher |
| System toolbar | help/search | `toolbars.system` | same |
| Action dispatch | button click | action string | `handlers.set("file.copyAll", …)` |
| Shortcut badge | on button | via `deriveToolbarButton` + registry | `getKeybindingRegistry()` |
| Copy to all | icon `copy-all` + Shift+C | `file.copyAll` in pane group | `handleCopyAll` |
| Move to all | icon `move-all` + Shift+V | `file.moveAll` in pane group | `handleMoveAll` |
| Command palette | “Command Palette” | `command.palette` | Ctrl+P |
| Save workspace as mesh | “Save workspace as mesh” (Mesh group) | `copy.workspaceMesh.saveDialogTitle` | `mesh.saveWorkspace` (Ctrl+Shift+M) | `handleSaveWorkspaceAsMesh` / update via dialog ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| Diff workspace vs saved | “Diff” (header + Mesh group) | `copy.workspaceMesh.diffButton` | `mesh.diffWorkspace` | `WorkspaceDiffDialog` ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| Manage display specs | “Manage display specs…” (dialog title from copy) | `copy.displaySpec.*` | `view.displaySpec` | `DisplaySpecManagerDialog` ([REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml)) |
| Clear display filter | “No filter” (pane selector) | — | `view.displaySpec.none` | `handleSetActiveDisplaySpec(focusIndex, null)` |
| Choose workspace layout | Layout pop-over | `copy.layouts.*` | `view.layout` (Ctrl+Shift+L) | `LayoutPickerPopover`, `setLayout` |
| Column order | “Column order” dialog | `copy.columns.*` + `toolbars.actions.view.columns` | `view.columns` (no keybind) | `ColumnOrderDialog`, `setFileColumns` |
| Swap panes | “Swap panes” | `copy.paneManagement.swapPanes` | `pane.swap` (Ctrl+Shift+S) | `handleSwapFocusedNext` |
| Cycle panes forward | “Cycle panes forward” | `copy.paneManagement.cycleForward` | `pane.cycle` (Ctrl+Shift+]) | `handleCyclePanes("forward")` |
| Pane order | “Pane order” dialog | `copy.paneManagement.paneOrderTitle` + `toolbars.actions.pane.order` | `pane.order` (toolbar-only) | `PaneOrderDialog`, `handleApplyPaneOrder` |
| Compare filter thresholds | Threshold dialog | `toolbars.actions.view.compareFilter.thresholds` | — (toolbar-only) | `CompareFilterThresholdDialog` ([REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml)) |
| Compare filter criterion | Tri-state toolbar button | `toolbars.actions.view.compareFilter.*` | — (toolbar-only) | `TriStateToolbarButton`, `CYCLE_TRI_STATE` |
| Toggle comparison mode (E2E) | (cycles mode) | — | `view.comparison` | `data-testid="toolbar-view.comparison"` |

### Action namespace prefixes (stable)

| Prefix | Domain |
| --- | --- |
| `navigate.*` | Directory cursor, enter, parent, tab, home |
| `file.*` | copy, move, delete, rename, **copyAll**, **moveAll** |
| `mark.*` | marking ([file-marking.md](file-marking.md)) |
| `view.*` | sort, layout picker (`view.layout`), column order dialog (`view.columns`, toolbar-only), comparison mode, hidden files, display filter specs (`view.displaySpec`, `view.displaySpec.none`), compare filters (`view.compareFilter.*`, toolbar-only) |
| `link.*` | linked mode toggle |
| `pane.*` | add, remove, refresh, refresh-all, **swap**, **swapPrev**, **cycle**, **cyclePrev**, **order** |
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
- **view.compareFilter.*** — Tri-state compare filter toolbar actions; see [cross-pane-visibility.md](cross-pane-visibility.md).
- **view.compareFilter.thresholds** — Opens size/time threshold dialog for gt/lt compare criteria.
- **Icon registry** — `getIconPaths` / `isIconRegistered` in `src/components/icons/registry.ts`; `getReferencedToolbarIconNames()` in `toolbar.utils.ts` for test coverage.
- **pane.order** — Toolbar-only pane reorder; icon `bookmark-list`; opens `PaneOrderDialog` (no keybinding row in `config/files.yaml`).
- **pane.swap** / **pane.cycle** — Workspace Panes group; icons `move` and `refresh-cw`; share handlers with keyboard shortcuts ([workspace-pane.md](workspace-pane.md)).
- **Toolbar view test id** — Stable `toolbar-{action}` test ids on `ToolbarButton` for Playwright ([e2e/readme-screenshots.spec.ts](../e2e/readme-screenshots.spec.ts), [e2e/copyall-demo.spec.ts](../e2e/copyall-demo.spec.ts)).

### Adding toolbar icons

1. Add SVG paths to [`src/components/icons/panorama-icons.tsx`](../src/components/icons/panorama-icons.tsx) (app-specific) or [`lucide-icons.tsx`](../src/components/icons/lucide-icons.tsx) (generic).
2. Map the **Action** in `ACTION_ICON_MAP` (`toolbar.utils.ts`) and/or `toolbars.actions.{id}.icon` in `config/files.yaml`.
3. If adding a toolbar-only action icon, append the name to `TOOLBAR_ACTIONS_ICON_NAMES` in `toolbar.utils.ts` (keep in sync with YAML).
4. Run `bun run test` — `registry.test.ts` fails when a referenced name is missing from the registry.

## Copy coverage

Toolbar button labels and dialog titles: `config/files.yaml` → `copy.paneManagement.*`, `copy.layouts.*`, `copy.columns.*`, `copy.workspaceMesh.*`, `copy.displaySpec.*`, plus `toolbars.actions.*` metadata. Shortcut discovery: expanded toolbar keystroke badges, compact tooltips, and `help.show` / command palette (`help.*`, `command.*`). Authoritative key list: `config/files.yaml` → `keybindings`. Owning IMPL: [IMPL-TOOLBAR_COMPONENT](../tied/implementation-decisions/IMPL-TOOLBAR_COMPONENT.yaml), [IMPL-KEYBINDS](../tied/implementation-decisions/IMPL-KEYBINDS.yaml).

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
| Tri-state compare filter click | `CYCLE_TRI_STATE` | IMPL-CROSS_PANE_VISIBILITY_UI |
| Compare filter thresholds | `THRESHOLD_DIALOG` | IMPL-CROSS_PANE_VISIBILITY_UI |
| Save workspace from UI | `STORE_FROM_WORKSPACE_UI` | IMPL-WORKSPACE_MESH_BRIDGE |
| Diff saved vs current | `DIFF_SAVED_VS_CURRENT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Layout toolbar picker | `LAYOUT_TOOLBAR_PICKER` | IMPL-WORKSPACE_VIEW |
| Swap panes | `SwapPanes` → `IMPL-PANE_MANAGEMENT_SwapPanes` | IMPL-PANE_MANAGEMENT |
| Swap focused neighbor | `SwapFocusedNeighbor` → `IMPL-PANE_MANAGEMENT_SwapFocusedNeighbor` | IMPL-PANE_MANAGEMENT |
| Cycle panes | `CyclePanes` → `IMPL-PANE_MANAGEMENT_CyclePanes` | IMPL-PANE_MANAGEMENT |
| Pane order dialog open | `PaneOrderDialogOpen` → `IMPL-PANE_MANAGEMENT_PaneOrderDialogOpen` | IMPL-PANE_MANAGEMENT |
| Pane order dialog apply | `PaneOrderDialogApply` → `IMPL-PANE_MANAGEMENT_PaneOrderDialogApply` | IMPL-PANE_MANAGEMENT |
| Icon registry lookup | `ICON_REGISTRY` | IMPL-TOOLBAR_COMPONENT |

## Alphabetical index

- **Action** — `category.action` string ID
- **Toolbar** — workspace / pane / system tiers
- **toolbars.actions** — toolbar-only action metadata catalog
- **ACTION_ICON_MAP** — action → icon name map
- **Icon name** — kebab-case `Icon` registry key
- **Icon registry** — merged SVG definitions for toolbar
- **icon-unknown** — unmapped action fallback icon
- **Panorama icons** — app-specific registry module
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
- **pane.cycle** — rotate all panes forward (Ctrl+Shift+]); workspace Panes toolbar group
- **pane.order** — toolbar-only; opens pane order dialog
- **pane.swap** — swap focused pane with neighbor (Ctrl+Shift+S); workspace Panes toolbar group
- **Pane toolbar** — `toolbars.pane`
- **System toolbar** — `toolbars.system`
- **Toolbar compact mode** — single merged top row; icon-only buttons
- **Toolbar compact toggle** — `toolbar-compact-toggle`
- **Toolbar expanded mode** — user-toggled three-tier layout with keystroke badges
- **view.compareFilter.*** — tri-state compare filter toolbar actions (toolbar-only)
- **view.compareFilter.thresholds** — compare filter size/time threshold dialog
- **Toolbar test id** — `toolbar-{action}` (see **Toolbar view test id**)
- **Toolbar view test id** — `data-testid="toolbar-{action}"` for Playwright demos
- **Workspace toolbar** — `toolbars.workspace`
- **Workspace area** — measured flex region; `data-testid="workspace-area"`
- **useElementSize** — ResizeObserver hook feeding pane layout (`src/lib/useElementSize.ts`)
- **Toolbar-only action** — `toolbars.actions` without keybinding row
- **deriveToolbarButton** — resolves icon, label, shortcut
- **Merged toolbar config** — `mergeTopToolbarConfigs`
- **Tri-state toolbar button** — compare filter criterion toggle
