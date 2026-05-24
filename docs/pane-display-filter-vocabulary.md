# Pane display filter vocabulary (canonical)

## Scope

**Named display filter specs** for file-manager **panes**: include/exclude glob rules, per-pane selection by stable id, cross-pane refresh on save, and exclusion from marks/batch ops. Not access control; not Mesh sync **Policy** filters ([mesh-platform-vocabulary.md](mesh-platform-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-PANE_DISPLAY_FILTER](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml) |
| ARCH | [ARCH-DISPLAY_FILTER_ENGINE](../tied/architecture-decisions/ARCH-DISPLAY_FILTER_ENGINE.yaml), [ARCH-DISPLAY_SPEC_STORE](../tied/architecture-decisions/ARCH-DISPLAY_SPEC_STORE.yaml) |
| IMPL | [IMPL-DISPLAY_FILTER_ENGINE](../tied/implementation-decisions/IMPL-DISPLAY_FILTER_ENGINE.yaml), [IMPL-DISPLAY_SPEC_STORE](../tied/implementation-decisions/IMPL-DISPLAY_SPEC_STORE.yaml), [IMPL-PANE_DISPLAY_FILTER_UI](../tied/implementation-decisions/IMPL-PANE_DISPLAY_FILTER_UI.yaml), [IMPL-DISPLAY_FILTER_API](../tied/implementation-decisions/IMPL-DISPLAY_FILTER_API.yaml) |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Display spec** | “filter spec”, “pane filter”, `DisplayFilterSpec` — never “Policy” in UI |
| **Active spec** | Pane’s `activeDisplaySpecId` (null = no filter) |
| **Spec catalog** | All saved specs; phase 1 `localStorage`, phase 2 API |
| **Filter rule** | include \| exclude × file \| directory \| both × glob pattern |
| **Spec version** | Incremented on save; panes refresh when version changes |
| **Hidden item count** | `rawCount - visibleCount` when raw listing retained |
| **Reconcile selection** | Drop marks / clamp cursor after filter apply |
| **No filter** | `activeDisplaySpecId === null` |
| **Snapshot display spec** | `displaySpecId` on workspace snapshot pane; mesh detail **Display filter** line | `formatDisplaySpecLabel` | `WORKSPACE_SNAPSHOT_SUMMARY` |

## Naming bridge

| Canonical concept | UI label | Keybind | Code |
| --- | --- | --- | --- |
| No filter | “No filter” (toolbar icon `filter`) | `view.displaySpec.none` | `activeDisplaySpecId: null` |
| Spec selector | (pane header dropdown) | — | `DisplaySpecSelector` |
| Manage specs | “Manage display specs…” (toolbar icon `filter`) | `view.displaySpec` | `DisplaySpecManagerDialog` |
| Active indicator | `Filter: {name}` | — | pane header |
| Hidden count | `Hidden: N` | — | optional |
| Snapshot display spec (mesh detail) | `Display filter: {name\|id\|(none)}` | — | `formatDisplaySpecLabel`, `getDisplaySpecStore` |

## Pseudo-code block names

| Concept | UPPER_SNAKE block | Owning IMPL |
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

- **Display spec** — named include/exclude glob catalog entry
- **Snapshot display spec** — `displaySpecId` on workspace snapshot pane; mesh detail **Display filter** line via `formatDisplaySpecLabel`

## Related vocabulary

- [workspace-pane-vocabulary.md](workspace-pane-vocabulary.md) — pane state, mesh snapshot `displaySpecId`
- [file-marking-vocabulary.md](file-marking-vocabulary.md) — marks operate on **visible** files when a spec is active
- [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md) — `view.displaySpec*` actions
