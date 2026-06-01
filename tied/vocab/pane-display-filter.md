# Pane display filter vocabulary (canonical)

## Scope

**Named display filter specs** for file-manager **panes**: include/exclude glob rules, per-pane selection by stable id, cross-pane refresh on save, and exclusion from marks/batch ops. Not access control; not Mesh sync **Policy** filters ([mesh-platform.md](mesh-platform.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml) |
| ARCH | [ARCH-DISPLAY_FILTER_ENGINE](../tied/architecture-decisions/ARCH-DISPLAY_FILTER_ENGINE.yaml), [ARCH-DISPLAY_SPEC_STORE](../tied/architecture-decisions/ARCH-DISPLAY_SPEC_STORE.yaml) |
| IMPL | [IMPL-DISPLAY_FILTER_ENGINE](../tied/implementation-decisions/IMPL-DISPLAY_FILTER_ENGINE.yaml), [IMPL-DISPLAY_SPEC_STORE](../tied/implementation-decisions/IMPL-DISPLAY_SPEC_STORE.yaml), [IMPL-PANE_DISPLAY_FILTER_UI](../tied/implementation-decisions/IMPL-PANE_DISPLAY_FILTER_UI.yaml), [IMPL-DISPLAY_FILTER_API](../tied/implementation-decisions/IMPL-DISPLAY_FILTER_API.yaml) |

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [workspace-pane.md](workspace-pane.md) — pane state, mesh snapshot `displaySpecId`
- [file-marking.md](file-marking.md) — marks operate on **visible** files when a spec is active
- [toolbar-keybind.md](toolbar-keybind.md) — `view.displaySpec*` actions
- [cross-pane-visibility.md](cross-pane-visibility.md) — filter order after display spec

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Display spec** | “filter spec”, “pane filter”, `DisplayFilterSpec` — never “Policy” in UI; legacy: avoid “access filter” |
| **Active spec** | Pane’s `activeDisplaySpecId` (null = no filter) |
| **Spec catalog** | All saved specs; phase 1 `localStorage`, phase 2 API |
| **Filter rule** | include \| exclude × file \| directory \| both × glob pattern |
| **Spec version** | Incremented on save; panes refresh when version changes |
| **Hidden item count** | `rawCount - visibleCount` when raw listing retained |
| **Reconcile selection** | Drop marks / clamp cursor after filter apply |
| **No filter** | `activeDisplaySpecId === null` |
| **Snapshot display spec** | `displaySpecId` on workspace snapshot pane; mesh detail **Display filter** line via `formatDisplaySpecLabel` / `WORKSPACE_SNAPSHOT_SUMMARY` |

## Naming bridge

| Canonical concept | UI label | Keybind | Code |
| --- | --- | --- | --- |
| No filter | “No filter” (toolbar icon `filter`) | `view.displaySpec.none` | `activeDisplaySpecId: null` |
| Spec selector | (pane header dropdown) | — | `DisplaySpecSelector` |
| Manage specs | “Manage display specs…” (toolbar icon `filter`) | `view.displaySpec` | `DisplaySpecManagerDialog` |
| Active indicator | `Filter: {name}` | — | pane header |
| Hidden count | `Hidden: N` | — | optional |
| Snapshot display spec (mesh detail) | `Display filter: {name\|id\|(none)}` | — | `formatDisplaySpecLabel`, `getDisplaySpecStore` |

## Named concepts

- **Display spec** — Named include/exclude glob catalog entry applied per pane by stable id.
- **Visible-only operations** — Marks and batch ops use filtered `pane.files` when a spec is active.
- **Cross-pane refresh** — Panes sharing a spec id reload when catalog version changes.

## Copy coverage

User-facing strings: `config/files.yaml` → `copy.displaySpec.*` (manager dialog, validation messages). Toolbar **Manage display specs…** uses `copy.displaySpec` keys and `toolbars.actions.view.displaySpec`. This glossary is authoritative for **Display spec** vs Mesh **Policy**. Owning IMPL: [IMPL-PANE_DISPLAY_FILTER_UI](../tied/implementation-decisions/IMPL-PANE_DISPLAY_FILTER_UI.yaml).

## README demo assets

Committed PNGs under `docs/screenshots/` ([REQ-README_DEMO_AUTOMATION](../tied/requirements/REQ-README_DEMO_AUTOMATION.yaml)); regenerate via `npm run demo:screenshots`.

| Asset | Shows |
| --- | --- |
| `workspace-pane-filter-controls.png` | Three-pane workspace with distinct **active display spec** per pane (pane-header **spec selector**) |
| `workspace-pane-filter-header.png` | Focused pane header crop: **DisplaySpecSelector**, indicator `Filter: {name}`, **Manage specs…** entry point |
| `dialog-display-spec-manager.png` | **DisplaySpecManagerDialog** catalog overview (no spec selected) |
| `dialog-display-spec-construct.png` | **DisplaySpecManagerDialog** editing state — **filter rules** in `display-spec-rule-editor` |

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Evaluate entry visibility | `EVALUATE_ENTRY` | IMPL-DISPLAY_FILTER_ENGINE |
| Apply listing to pane | `APPLY_PANE_LISTING` | IMPL-DISPLAY_FILTER_ENGINE |
| Reconcile marks/cursor | `RECONCILE_PANE_SELECTION` | IMPL-DISPLAY_FILTER_ENGINE |
| Catalog CRUD | `SPEC_CATALOG_CRUD` | IMPL-DISPLAY_SPEC_STORE |
| Refresh panes on spec save | `REFRESH_PANES_USING_SPEC` | IMPL-PANE_DISPLAY_FILTER_UI |
| Server list filter | `SERVER_FILTER_LISTING` | IMPL-DISPLAY_FILTER_API |
| POST path validation | `VALIDATE_OPERATION_PATHS` | IMPL-DISPLAY_FILTER_API |
| Snapshot display spec label | `FORMAT_DISPLAY_SPEC_LABEL` | IMPL-WORKSPACE_MESH_BRIDGE |

## Alphabetical index

- **Active spec** — `activeDisplaySpecId`
- **Display spec** — named include/exclude glob catalog entry
- **Filter rule** — include/exclude × file/directory/both × glob
- **Hidden item count** — filtered-out row count
- **No filter** — `activeDisplaySpecId === null`
- **Reconcile selection** — marks/cursor after filter apply
- **Snapshot display spec** — `displaySpecId` on snapshot pane; mesh detail line
- **Spec catalog** — saved specs store
- **Spec version** — catalog bump triggers pane refresh
