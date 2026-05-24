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

## Naming bridge

| Canonical concept | UI label | Code |
| --- | --- | --- |
| No compare filter | “No compare filter” | `activeCrossPaneVisibilityId: null` |
| Preset selector | (pane header dropdown) | `CrossPaneVisibilitySelector` |
| Manage presets | “Manage compare filters…” | `CrossPaneVisibilityManagerDialog` |
| Unsaved draft | “Draft” | `isCrossPaneVisibilityDraftDirty` |
| Workspace toolbar | Compare filters group | `view.compareFilter.*` |

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

## Filter order

1. **Display spec** — `APPLY_PANE_LISTING` / `EVALUATE_ENTRY` → `pane.files`
2. **Cross-pane visibility** — `applyCrossPaneVisibility` with focused pane draft → `displayFiles`

## See also

- [cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md)
- [workspace-pane-vocabulary.md](workspace-pane-vocabulary.md)
- [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md)
- [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md)
