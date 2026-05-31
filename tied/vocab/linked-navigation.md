# Linked navigation vocabulary (canonical)

## Scope

**Linked mode** (`linkedMode`): synchronized **directory navigation**, **cursor** (by filename), and **sort** across panes when two or more panes are visible. Excludes NSYNC file copy ([nsync-multi-target.md](nsync-multi-target.md)) and single-pane focus rules ([workspace-pane.md](workspace-pane.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-LINKED_PANES](../tied/requirements/REQ-LINKED_PANES.yaml), [REQ-DIRECTORY_NAVIGATION](../tied/requirements/REQ-DIRECTORY_NAVIGATION.yaml) |
| ARCH | [ARCH-LINKED_NAV](../tied/architecture-decisions/ARCH-LINKED_NAV.yaml), [ARCH-SORT_PIPELINE](../tied/architecture-decisions/ARCH-SORT_PIPELINE.yaml) |
| IMPL | [IMPL-LINKED_NAV](../tied/implementation-decisions/IMPL-LINKED_NAV.yaml) |
| Pseudo-code | [IMPL-LINKED_NAV-pseudocode.md](../tied/implementation-decisions/IMPL-LINKED_NAV-pseudocode.md) |

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [workspace-pane.md](workspace-pane.md)
- [toolbar-keybind.md](toolbar-keybind.md)

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Linked mode** | “linked panes”, “link mode”, `linkedMode` boolean — not “mirror mode” or “sync panes” (reserved for file sync) |
| **Link toggle** | “toggle link”, `link.toggle` action, **L** key |
| **Initiating navigation** | Navigation started by user in one pane (`isInitiatingNavigation`) — drives downward/upward linked propagation |
| **Syncing ref** | `syncingRef` — `Set` of pane indexes currently receiving linked navigation (prevents recursion) |
| **Cursor filename** | `cursorFilename` — match key for cross-pane cursor sync (basename, not path); also used by **cross-pane path clipboard** in [workspace-pane.md](workspace-pane.md) regardless of **linked mode** |
| **Auto-disable** | Turn off linked mode when partial downward navigation fails (divergent directory trees) |
| **Default linked mode** | `layout.defaultLinkedMode` in `config/files.yaml` (default **true** when omitted) |
| **Single-pane suppression** | Linked UI hidden when `panes.length < 2` even if `linkedMode` is true |

## Naming bridge

| Canonical concept | UI label | Config key | Keybind action | Code symbol |
| --- | --- | --- | --- | --- |
| Linked mode on | “Linked” (footer/badge) | `layout.defaultLinkedMode` | `link.toggle` | `linkedMode`, `setLinkedMode` |
| Parent directory | “..” / Parent | — | `navigate.parent` | `navigateToParent`, `onNavigateParent` |
| Downward linked nav | — | — | `navigate.enter` (into subdir) | `DownwardNavigation` block |
| Upward linked nav | — | `navigate.parent` | — | `UpwardNavigation` block |
| Sort sync | — | — | `view.sort` | `SortSynchronization` |

## Named concepts

- **Linked downward navigation** — Append same **relative subdirectory** to each other pane when structures align.
- **Linked upward navigation** — Pop same number of path segments on each pane toward root.
- **Cursor synchronization** — Match `file.name` across panes; cursor `-1` when name missing (graceful degradation).
- **Cross-pane path clipboard** — File column menu **Copy paths in all panes** reuses the same **cursor filename** match key; independent of whether **linked mode** is ON ([workspace-pane.md](workspace-pane.md)).
- **Scroll synchronization** — `scrollTriggers` → `scrollIntoView` in `FilePane` after cursor sync.
- **Sort synchronization** — Same sort criterion/direction/dirs-first on all panes; preserve cursor by filename after sort.
- **Parent navigation sync** — Parent button and Backspace use `handleNavigate` so linked rules apply.
- **Visual indicators** — Link badge in footer and pane headers when linked and ≥2 panes.

## Copy coverage

Linked mode has no dedicated `copy.*` prefix; toolbar `link.toggle` uses keybinding registry labels and tooltips. Config default: `layout.defaultLinkedMode` in `config/files.yaml`. This glossary is authoritative for **Linked mode** vs file **multi-target sync**. Owning IMPL: [IMPL-LINKED_NAV](../tied/implementation-decisions/IMPL-LINKED_NAV.yaml).

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Linked mode state / guard | `LinkedModeState` → `IMPL-LINKED_NAV_LinkedModeState` | IMPL-LINKED_NAV |
| Toggle linked | `LinkToggle` → `IMPL-LINKED_NAV_LinkToggle` | IMPL-LINKED_NAV |
| Cursor by filename | `CursorSynchronization` → `IMPL-LINKED_NAV_CursorSynchronization` | IMPL-LINKED_NAV |
| Missing filename handling | `GracefulDegradation` → `IMPL-LINKED_NAV_GracefulDegradation` | IMPL-LINKED_NAV |
| Scroll into view | `ScrollSynchronization` → `IMPL-LINKED_NAV_ScrollSynchronization` | IMPL-LINKED_NAV |
| Enter subdirectory (linked) | `DownwardNavigation` → `IMPL-LINKED_NAV_DownwardNavigation` | IMPL-LINKED_NAV |
| Parent / up levels | `UpwardNavigation` → `IMPL-LINKED_NAV_UpwardNavigation` | IMPL-LINKED_NAV |
| Partial failure off | `AutoDisable` → `IMPL-LINKED_NAV_AutoDisable` | IMPL-LINKED_NAV |
| Sort all panes | `SortSynchronization` → `IMPL-LINKED_NAV_SortSynchronization` | IMPL-LINKED_NAV |
| Link badge UI | `VisualIndicators` → `IMPL-LINKED_NAV_VisualIndicators` | IMPL-LINKED_NAV |
| Parent button path | `ParentNavigationSync` → `IMPL-LINKED_NAV_ParentNavigationSync` | IMPL-LINKED_NAV |
| Config default | `ConfigDrivenLinkedMode` → `IMPL-LINKED_NAV_ConfigDrivenLinkedMode` | IMPL-LINKED_NAV |
| One pane UI off | `SinglePaneMode` → `IMPL-LINKED_NAV_SinglePaneMode` | IMPL-LINKED_NAV |

## Alphabetical index

- **Auto-disable** — linked off on partial downward failure
- **Cursor filename** — basename sync key; also cross-pane path clipboard match key
- **Default linked mode** — `layout.defaultLinkedMode`
- **Initiating navigation** — user-started navigate
- **Linked mode** — boolean sync master switch
- **Link toggle** — `link.toggle`
- **Single-pane suppression** — hide link UI with one pane
- **Syncing ref** — re-entrancy guard
