# Cross-pane comparison vocabulary (canonical)

## Scope

**Visual and structural comparison** of files that share a **filename** across multiple panes: building the **comparison index**, classifying size/time deltas, and **comparison mode** display. Excludes NSYNC skip/compare during copy ([nsync-multi-target.md](nsync-multi-target.md)) — different `compareMethod` pipeline.

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-CROSS_PANE_COMPARISON](../tied/requirements/REQ-CROSS_PANE_COMPARISON.yaml), [REQ-FILE_COMPARISON_VISUAL](../tied/requirements/REQ-FILE_COMPARISON_VISUAL.yaml), [REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml), [REQ-README_DEMO_AUTOMATION](../tied/requirements/REQ-README_DEMO_AUTOMATION.yaml) |
| ARCH | [ARCH-COMPARISON_INDEX](../tied/architecture-decisions/ARCH-COMPARISON_INDEX.yaml), [ARCH-COMPARISON_COLORING](../tied/architecture-decisions/ARCH-COMPARISON_COLORING.yaml), [ARCH-CROSS_PANE_VISIBILITY](../tied/architecture-decisions/ARCH-CROSS_PANE_VISIBILITY.yaml) |
| IMPL | [IMPL-COMPARISON_INDEX](../tied/implementation-decisions/IMPL-COMPARISON_INDEX.yaml), [IMPL-COMPARISON_COLORS](../tied/implementation-decisions/IMPL-COMPARISON_COLORS.yaml), [IMPL-FILE_PANE](../tied/implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-CROSS_PANE_VISIBILITY_ENGINE](../tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_ENGINE.yaml) |
| Pseudo-code | [IMPL-COMPARISON_INDEX-pseudocode.md](../tied/implementation-decisions/IMPL-COMPARISON_INDEX-pseudocode.md), [IMPL-COMPARISON_COLORS-pseudocode.md](../tied/implementation-decisions/IMPL-COMPARISON_COLORS-pseudocode.md) |

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [workspace-pane.md](workspace-pane.md)
- [cross-pane-visibility.md](cross-pane-visibility.md)
- [nsync-multi-target.md](nsync-multi-target.md) — `CompareMethod` for sync skip

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Comparison index** | “comparison map”, `buildComparisonIndex` / `buildEnhancedComparisonIndex` |
| **Shared filename** | “file in multiple panes”, “cross-pane name” — keyed by `file.name` not full path |
| **Compare state** | `CompareState` — `panes[]`, `sizes[]`, `mtimes[]` for one filename |
| **Enhanced compare state** | `EnhancedCompareState` — adds `sizeComparison[]`, `timeComparison[]` |
| **Comparison mode** | “view comparison”, `comparisonMode` — `off`, `name`, `size`, `time` |
| **Size comparison** (visual) | `SizeComparison`: `equal`, `smallest`, `largest`, `null` — row CSS classes |
| **Time comparison** (visual) | `TimeComparison`: `equal`, `earliest`, `latest`, `null` |
| **Unique file** | Appears in only one pane — no `CompareState` entry (not “orphan” in Mesh sense) |
| **Filter comparison index** | `buildEnhancedComparisonIndex` when `panes.length >= 2` for compare filters — independent of `comparisonMode` coloring ([REQ-CROSS_PANE_VISIBILITY](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml)) |
| **Comparison demo fixture** | `/tmp/test-dirs/{alpha,beta,gamma}` with shared filenames and deliberate size/mtime deltas for README `3-pane-comparison.png` ([IMPL-DEMO_SCREENSHOT_PIPELINE](../tied/implementation-decisions/IMPL-DEMO_SCREENSHOT_PIPELINE.yaml)) |

## Naming bridge

| Canonical concept | UI label | Config / action | Keybind | Code symbol |
| --- | --- | --- | --- | --- |
| Toggle comparison mode | (cycles mode) | — | `view.comparison` | `ComparisonMode` |
| Name-only highlight | — | mode `name` | — | shared-name styling |
| Size coloring | — | mode `size` | — | `SizeComparison` per row |
| Time coloring | — | mode `time` | — | `TimeComparison` per row |
| Index data structure | — | — | — | `Map<string, Map<number, EnhancedCompareState>>` in `FilePane` |

## Named concepts

- **Comparison index** — Map from **filename** → per-pane stats for names present in **two or more** panes; `ComparisonIndex.get(paneIndex, filename)`.
- **Shared filenames** — `getSharedFilenames()` — drives which rows participate in cross-pane styling.
- **Comparison mode off** — No cross-pane coloring; listing still works.
- **Filter comparison index** — Built whenever two or more panes exist for cross-pane visibility criteria; coloring index remains gated by `comparisonMode` ([cross-pane-visibility.md](cross-pane-visibility.md)).
- **Pane index** — Numeric index into workspace `panes[]`; parallel arrays in `CompareState.panes`.
- **Comparison demo fixture** — Bash seed data for automated comparison screenshots; not a runtime catalog.

Row algorithms: [IMPL-COMPARISON_COLORS-pseudocode.md](../tied/implementation-decisions/IMPL-COMPARISON_COLORS-pseudocode.md).

## Copy coverage

Comparison mode has no dedicated `copy.*` block; toolbar `view.comparison` labels come from keybinding registry / tooltips. This glossary is authoritative for **Comparison index** vs NSYNC **Compare method**. Owning IMPL: [IMPL-COMPARISON_INDEX](../tied/implementation-decisions/IMPL-COMPARISON_INDEX.yaml).

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Build comparison map | `BuildEnhancedIndex` → `IMPL-COMPARISON_INDEX_BuildEnhancedIndex` | IMPL-COMPARISON_INDEX |
| Build index for compare filters | `BUILD_INDEX_FOR_FILTERS` | IMPL-WORKSPACE_VIEW, IMPL-CROSS_PANE_VISIBILITY_ENGINE |
| Size delta CSS classes | `SizeComparison` → `IMPL-COMPARISON_COLORS_SizeComparison` | IMPL-COMPARISON_COLORS |
| Mtime delta CSS classes | `TimeComparison` → `IMPL-COMPARISON_COLORS_TimeComparison` | IMPL-COMPARISON_COLORS |
| Comparison demo fixture | `SETUP_COMPARISON_FIXTURE` | IMPL-DEMO_SCREENSHOT_PIPELINE |
| Capture comparison screenshot | `CAPTURE_WORKSPACE_AND_COMPARISON` | IMPL-DEMO_SCREENSHOT_PIPELINE |

## Alphabetical index

- **Comparison demo fixture** — `/tmp/test-dirs` seed for README comparison PNG
- **Compare state** — cross-pane stats for one name
- **Comparison index** — shared-filename map
- **Comparison mode** — `off` \| `name` \| `size` \| `time`
- **Enhanced compare state** — compare state + classifications
- **Shared filename** — name in 2+ panes
- **Size comparison** — visual size role per pane
- **Time comparison** — visual mtime role per pane
- **Unique file** — single-pane only
- **Filter comparison index** — built for compare filters when ≥2 panes
