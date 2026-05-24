# Cross-pane visibility vocabulary (canonical)

## Scope

**Tri-state toolbar filters** that show or hide file rows using the **comparison index** and **enhanced compare state**. Focused pane applies include/exclude rules; other panes **mirror** visible **shared filenames**. Distinct from **display spec** glob filters ([pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml) |
| ARCH | [ARCH-CROSS_PANE_VISIBILITY](../tied/architecture-decisions/ARCH-CROSS_PANE_VISIBILITY.yaml) |
| IMPL | [IMPL-CROSS_PANE_VISIBILITY_ENGINE](../tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_ENGINE.yaml), [IMPL-CROSS_PANE_VISIBILITY_UI](../tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_UI.yaml), [IMPL-CROSS_PANE_VISIBILITY_CATALOG](../tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_CATALOG.yaml) |

## Preferred terms

| Preferred | Notes |
| --- | --- |
| **Cross-pane visibility** | Filter layer after display spec on `pane.files` |
| **Visibility catalog** | Named presets in `localStorage` (`panorama.crossPaneVisibility.v1`) |
| **Active cross-pane visibility preset** | Pane `activeCrossPaneVisibilityId` (null = no preset) |
| **Visibility draft** | Pane `crossPaneVisibilityDraft` — ephemeral until saved to catalog |
| **Tri-state toggle** | `inactive` \| `include` \| `exclude` per criterion |
| **Criterion** | `sharedAll`, `missingSome`, `sizeLargestAll`, … — see engine |
| **Focused pane visibility** | Include/exclude evaluated on focused listing |
| **Mirrored visibility** | Other panes show rows matching focused visible basenames |
| **Visibility threshold** | `sizeThreshold` / `timeThreshold` for gt/lt criteria |
| **Snapshot cross-pane visibility** | Per pane: `crossPaneVisibilityId` + optional inline `crossPaneVisibility` on snapshot v5 |
| **Listing merge** | Combining a fresh directory listing (`PaneWithDisplayFilter`) with persisted cross-pane visibility fields on the pane |
| **Cross-pane field pick** | Merge copies only visibility catalog fields, never `path`, `files`, `cursor`, or `marks` |

## Naming bridge

| Canonical concept | UI label | Code |
| --- | --- | --- |
| No compare filter | “No compare filter” | `activeCrossPaneVisibilityId: null` |
| Preset selector | (pane header dropdown) | `CrossPaneVisibilitySelector` |
| Manage presets | “Manage compare filters…” | `CrossPaneVisibilityManagerDialog` |
| Unsaved draft | “Draft” | `isCrossPaneVisibilityDraftDirty` |
| Workspace toolbar | Compare filters group | `view.compareFilter.*` |
| Mesh detail summary (per pane) | **Compare filter:** (singular) | `pane.crossPaneVisibilityLabel`, `formatPaneCrossPaneVisibilitySummary`, `WorkspaceSnapshotSummaryList` |

## Toolbar icon names

Compare filter toolbar **Action** ids map to **Icon name** values in `toolbars.actions` / `ACTION_ICON_MAP` (see [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)):

| Action | Icon name |
| --- | --- |
| `view.compareFilter.thresholds` | `sliders` |
| `view.compareFilter.sharedAll` | `files` |
| `view.compareFilter.missingSome` | `file-minus` |
| `view.compareFilter.sizeLargestAll` | `maximize-2` |
| `view.compareFilter.sizeLargestSome` | `trending-up` |
| `view.compareFilter.sizeGtThreshold` | `chevrons-up` |
| `view.compareFilter.sizeSmallestAll` | `minimize-2` |
| `view.compareFilter.sizeSmallestSome` | `trending-down` |
| `view.compareFilter.sizeLtThreshold` | `chevrons-down` |
| `view.compareFilter.timeLatestAll` | `clock` |
| `view.compareFilter.timeLatestSome` | `clock` |
| `view.compareFilter.timeGtThreshold` | `calendar` |
| `view.compareFilter.timeEarliestAll` | `history` |
| `view.compareFilter.timeEarliestSome` | `history` |
| `view.compareFilter.timeLtThreshold` | `calendar` |

## Pseudo-code blocks

| Concept | UPPER_SNAKE | IMPL |
| --- | --- | --- |
| Focused evaluation | `EVALUATE_FOCUS_VISIBILITY` | IMPL-CROSS_PANE_VISIBILITY_ENGINE |
| Other-pane mirror | `MIRROR_OTHER_PANES` | IMPL-CROSS_PANE_VISIBILITY_ENGINE |
| Tri-state click | `CYCLE_TRI_STATE` | IMPL-CROSS_PANE_VISIBILITY_UI |
| Thresholds | `THRESHOLD_DIALOG` | IMPL-CROSS_PANE_VISIBILITY_UI |
| Catalog CRUD | `SPEC_CATALOG_CRUD` | IMPL-CROSS_PANE_VISIBILITY_CATALOG |
| Resolve pane state | `RESOLVE_PANE_VISIBILITY` | IMPL-CROSS_PANE_VISIBILITY_CATALOG |
| Focus-synced toolbar | `SYNC_TOOLBAR_TO_FOCUS` | IMPL-CROSS_PANE_VISIBILITY_UI |
| Save draft | `SAVE_DRAFT_TO_CATALOG` | IMPL-CROSS_PANE_VISIBILITY_CATALOG |
| Listing + visibility fields | `MERGE_LISTING_WITH_CROSS_PANE_FIELDS` | IMPL-CROSS_PANE_VISIBILITY_CATALOG |

## Filter order

1. **Display spec** — `APPLY_PANE_LISTING` / `EVALUATE_ENTRY` → `pane.files`
2. **Cross-pane visibility** — `applyCrossPaneVisibility` with focused pane draft → `displayFiles`
3. **Navigation / refresh** — `handleNavigate` rebuilds listing (`path`, `files`) first; **listing merge** attaches visibility fields via **cross-pane field pick** without replacing listing state

## See also

- [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md) — `handleNavigate`, parent `..`, linked directory navigation
- [cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)
- [workspace-pane-vocabulary.md](workspace-pane-vocabulary.md)
- [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)
- [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)
