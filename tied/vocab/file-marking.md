# File marking vocabulary (canonical)

## Scope

**Marks**: per-pane sets of selected **filenames** used as the source list for copy/move/delete and **multi-target sync**. Excludes visual comparison ([cross-pane-comparison.md](cross-pane-comparison.md)) and mark-independent single-file ops (cursor-only when no marks).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-FILE_MARKING_WEB](../tied/requirements/REQ-FILE_MARKING_WEB.yaml), [REQ-BULK_FILE_OPS](../tied/requirements/REQ-BULK_FILE_OPS.yaml) |
| ARCH | [ARCH-MARKING_STATE](../tied/architecture-decisions/ARCH-MARKING_STATE.yaml), [ARCH-BATCH_OPERATIONS](../tied/architecture-decisions/ARCH-BATCH_OPERATIONS.yaml) |
| IMPL | [IMPL-FILE_MARKING](../tied/implementation-decisions/IMPL-FILE_MARKING.yaml), [IMPL-BULK_OPS](../tied/implementation-decisions/IMPL-BULK_OPS.yaml) |
| Pseudo-code | [IMPL-FILE_MARKING-pseudocode.md](../tied/implementation-decisions/IMPL-FILE_MARKING-pseudocode.md) |

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [nsync-multi-target.md](nsync-multi-target.md) — sources from marks
- [workspace-pane.md](workspace-pane.md) — focused pane
- [pane-display-filter.md](pane-display-filter.md) — visible-only marks

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Mark** (noun) | “selection”, “checkbox state” — store is `pane.marks: Set<string>` keyed by **`file.name`** |
| **Marked file** | File whose `name` is in `pane.marks` |
| **Marked count** | Footer `[markedCount/totalCount]` — **totalCount** is visible file count when a display spec is active |
| **Toggle mark** | `mark.toggle` — **M** key |
| **Mark and advance** | `mark.toggle-cursor` — **Space** (mark then move cursor down) |
| **Mark all** | `mark.all` — **Shift+M** |
| **Invert marks** | `mark.invert` — **Ctrl+M** |
| **Clear marks** | `mark.clear` — **Escape** |
| **Operation files** | `getOperationFiles()` — marked paths if any marks, else cursor file path |
| **Per-pane independence** | Marks do not copy across panes; bulk ops use **source pane** marks only |

## Naming bridge

| Canonical concept | UI label | Config copy key | Keybind action | Code handler |
| --- | --- | --- | --- | --- |
| Toggle mark | (checkbox) | — | `mark.toggle` | `handleToggleMark` |
| Mark + down | — | — | `mark.toggle-cursor` | Space handler |
| Mark all | `marking.markAll` | `copy.marking.markAll` | `mark.all` | `handleMarkAll` |
| Invert | `marking.invertMarks` | `copy.marking.invertMarks` | `mark.invert` | `handleInvertMarks` |
| Clear | `marking.clearMarks` | `copy.marking.clearMarks` | `mark.clear` | `handleClearMarks` |
| Marked styling | — | theme `bg-marked` / class overrides | — | `FilePane` row class |

## Named concepts

- **Mark persistence** — Marks survive re-sort and directory refresh when **filename** still exists; dropped when name absent.
- **Parent entry** — `..` parent row is not markable.
- **Empty directory** — Mark keys on empty listing: no error, no footer count.
- **Multi-mark workflow** — Sequential mark.all → invert → clear is valid UX.
- **Bulk operation** — Uses `getOperationFiles(focusIndex)` before NSYNC or API bulk routes.
- **Visible-only marks** — When a [display spec](pane-display-filter.md) is active, `pane.files` is the filtered visible set; mark-all and footer **total** count visible items only.

## Copy coverage

User-facing strings: `config/files.yaml` → `copy.marking.*` (`markAll`, `invertMarks`, `clearMarks`). Footer marked count uses pane listing state, not a separate copy key. Owning IMPL: [IMPL-FILE_MARKING](../tied/implementation-decisions/IMPL-FILE_MARKING.yaml).

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Per-pane Set init | `PaneMarkState` → `IMPL-FILE_MARKING_PaneMarkState` | IMPL-FILE_MARKING |
| Toggle one mark | `MarkToggle` → `IMPL-FILE_MARKING_MarkToggle` | IMPL-FILE_MARKING |
| Space mark+down | `MarkWithSpace` → `IMPL-FILE_MARKING_MarkWithSpace` | IMPL-FILE_MARKING |
| Mark all files | `MarkAll` → `IMPL-FILE_MARKING_MarkAll` | IMPL-FILE_MARKING |
| Invert set | `InvertMarks` → `IMPL-FILE_MARKING_InvertMarks` | IMPL-FILE_MARKING |
| Clear set | `ClearMarks` → `IMPL-FILE_MARKING_ClearMarks` | IMPL-FILE_MARKING |
| Survive refresh/sort | `MarkPersistence` → `IMPL-FILE_MARKING_MarkPersistence` | IMPL-FILE_MARKING |
| Checkbox / CSS | `MarkVisualFeedback` → `IMPL-FILE_MARKING_MarkVisualFeedback` | IMPL-FILE_MARKING |
| Isolated per pane | `PerPaneIndependence` → `IMPL-FILE_MARKING_PerPaneIndependence` | IMPL-FILE_MARKING |
| Footer count | `MarkedCountDisplay` → `IMPL-FILE_MARKING_MarkedCountDisplay` | IMPL-FILE_MARKING |

## Alphabetical index

- **Clear marks** — `mark.clear`
- **Invert marks** — `mark.invert`
- **Mark** — filename in `pane.marks`
- **Mark all** — `mark.all`
- **Mark persistence** — name-based across refresh
- **Marked count** — footer ratio display
- **Operation files** — resolved paths for ops
- **Per-pane independence** — no cross-pane marks
- **Toggle mark** — `mark.toggle`
- **Mark and advance** — `mark.toggle-cursor` / Space
- **Marked file** — name in `pane.marks`
- **Bulk operation** — uses `getOperationFiles`
- **Visible-only marks** — counts use filtered listing
