# Panorama domain references (canonical)

One-line purpose: **canonical glossaries** for consistent terminology in README, TIED REQ/ARCH/IMPL prose, reviews, tests, and especially IMPL `essence_pseudocode` block names.

Pick the **preferred term** from the linked vocabulary file before naming pseudo-code blocks (`UPPER_SNAKE`), DATA fields, or acceptance criteria. Synonyms belong in the glossary tables, not scattered across IMPL sidecars.

## Vocabulary index

| Priority | Document | Scope |
| --- | --- | --- |
| P0 | [workspace-pane-vocabulary.md](workspace-pane-vocabulary.md) | **Workspace**, **pane**, **focus**, layout geometry, Page → Workspace → Pane hierarchy, pane lifecycle |
| P0 | [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) | **NSYNC** multi-destination sync: sources, destinations, `sync-all`, compare/skip, move semantics, store monitor |
| P0 | [cross-pane-comparison-vocabulary.md](cross-pane-comparison-vocabulary.md) | **Comparison index**, shared filenames, visual comparison modes, size/time coloring |
| P1 | [linked-navigation-vocabulary.md](linked-navigation-vocabulary.md) | **Linked mode**, synchronized directory/cursor/sort across panes |
| P1 | [file-marking-vocabulary.md](file-marking-vocabulary.md) | **Marks** (per-pane selection sets), bulk operation source resolution |
| P1 | [pane-display-filter-vocabulary.md](pane-display-filter-vocabulary.md) | **Display specs** (named pane filters), active spec, catalog sync — not Mesh Policy |
| P1 | [cross-pane-visibility-vocabulary.md](cross-pane-visibility-vocabulary.md) | **Cross-pane visibility** tri-state compare filters, preset catalog, focus/mirror semantics — after display spec |
| P1 | [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md) | **Toolbar** tiers (workspace / pane / system), `keybindings` **actions**, `data-testid` |
| P2 | [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md) | **Mesh** sync platform (depot, sync link, session, plan) — separate from file-manager NSYNC; **cross-surface links** open Mesh ↔ File Manager in new tabs |

## Behavior inventories (not glossaries)

These list concrete bindings (keys, actions, routes) rather than defining preferred domain nouns:

| Inventory | Location |
| --- | --- |
| Keyboard shortcuts & actions | `config/files.yaml` → `keybindings` (authoritative); summarized in [toolbar-keybind-vocabulary.md](toolbar-keybind-vocabulary.md) |
| Toolbar button groups | `config/files.yaml` → `toolbars` |
| File manager copy strings | `config/files.yaml` → `copy` |
| API POST operations | `src/app/api/files/route.ts` (`copy`, `move`, `sync-all`, `bulk-*`, …) |

## TIED traceability

Project REQ/ARCH/IMPL indexes live under [`tied/`](../tied/). Methodology tokens under `tied/methodology/` are read-only. When authoring pseudo-code, cross-link vocabulary paths in REQ criteria and IMPL `related_decisions.see_also`.

## See also

- [README.md](../README.md) — product overview and feature list
- [tied/docs/pseudocode-writing-and-validation.md](../tied/docs/pseudocode-writing-and-validation.md) — language-agnostic IMPL blocks and literal copy to tests/code
- [FILE_MANAGER_SOLE_PURPOSE.md](FILE_MANAGER_SOLE_PURPOSE.md) — scope boundary for the `/files` experience
