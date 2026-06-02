# Panorama domain references (canonical)

One-line purpose: **canonical glossaries** for consistent terminology in README, TIED REQ/ARCH/IMPL prose, reviews, tests, and especially IMPL `essence_pseudocode` block names.

Pick the **preferred term** from the linked vocabulary file before naming pseudo-code blocks (`UPPER_SNAKE`), DATA fields, or acceptance criteria. Synonyms belong in the glossary tables, not scattered across IMPL sidecars.

## Vocabulary index

| Priority | Document | Scope |
| --- | --- | --- |
| P0 | [workspace-pane.md](../tied/vocab/workspace-pane.md) | **Workspace**, **pane**, **focus**, layout geometry, Page → Workspace → Pane hierarchy, pane lifecycle |
| P0 | [nsync-multi-target.md](../tied/vocab/nsync-multi-target.md) | **NSYNC** multi-destination sync: sources, destinations, `sync-all`, compare/skip, move semantics, store monitor |
| P0 | [cross-pane-comparison.md](../tied/vocab/cross-pane-comparison.md) | **Comparison index**, shared filenames, visual comparison modes, size/time coloring |
| P1 | [directory-tree.md](../tied/vocab/directory-tree.md) | **Directory tree** lazy listing under pane base, expand/collapse, visible rows, path-keyed marks |
| P1 | [linked-navigation.md](../tied/vocab/linked-navigation.md) | **Linked mode**, synchronized directory/cursor/sort across panes |
| P1 | [file-marking.md](../tied/vocab/file-marking.md) | **Marks** (per-pane selection sets), bulk operation source resolution |
| P1 | [pane-display-filter.md](../tied/vocab/pane-display-filter.md) | **Display specs** (named pane filters), active spec, catalog sync — not Mesh Policy |
| P1 | [cross-pane-visibility.md](../tied/vocab/cross-pane-visibility.md) | **Cross-pane visibility** tri-state compare filters, preset catalog, focus/mirror semantics — after display spec |
| P1 | [toolbar-keybind.md](../tied/vocab/toolbar-keybind.md) | **Toolbar** tiers (workspace / pane / system), `keybindings` **actions**, `data-testid`; **icon registry** and **`icon-unknown`** fallback |
| P2 | [mesh-platform.md](../tied/vocab/mesh-platform.md) | **Mesh** sync platform (depot, sync link, session, plan) — separate from file-manager NSYNC; **cross-surface links** open Mesh ↔ File Manager in new tabs |

## Split/merge policy

- **Split** a glossary when a domain reaches ~15+ named concepts or serves a distinct audience.
- **Merge** when two areas share one dispatch/order story and splitting would duplicate synonym tables.
- **Intentional hub:** [workspace-pane.md](../tied/vocab/workspace-pane.md) consolidates the file-manager shell (layout, restore UX chrome, file columns). **Workspace snapshot** and **cross-surface link** terms are canonical in [mesh-platform.md](../tied/vocab/mesh-platform.md); workspace-pane links there instead of redefining.

## Authoring guides (not glossaries)

| Guide | Scope |
| --- | --- |
| [vocabulary-index-analysis-and-standards.md](vocabulary-index-analysis-and-standards.md) | Meta-guide: mandatory sections, Copy coverage, PR checklist, validation |
| [tied-domain-vocabulary-research-prompt.md](tied-domain-vocabulary-research-prompt.md) | Agent prompt to reproduce or extend the vocabulary corpus |

## PR acceptance checklist (vocabulary changes)

- [ ] Index row count matches every `tied/vocab/*.md` glossary file
- [ ] Each glossary: Scope, Traceability, See also, Preferred term vs synonyms, Copy coverage, Pseudo-code block names, Alphabetical index
- [ ] Each glossary cited by ≥1 REQ criterion; owning IMPL `see_also` updated where applicable
- [ ] `bash scripts/validate-vocabulary.sh` passes
- [ ] `tied_validate_consistency` passes after TIED YAML changes

## Behavior inventories (not glossaries)

These list concrete bindings (keys, actions, routes) rather than defining preferred domain nouns:

| Inventory | Location |
| --- | --- |
| Keyboard shortcuts & actions | `config/files.yaml` → `keybindings` (authoritative); summarized in [toolbar-keybind.md](../tied/vocab/toolbar-keybind.md) |
| Toolbar button groups | `config/files.yaml` → `toolbars` |
| File manager copy strings | `config/files.yaml` → `copy` |
| API POST operations | `src/app/api/files/route.ts` (`copy`, `move`, `sync-all`, `bulk-*`, …) |

## TIED traceability

Project REQ/ARCH/IMPL indexes live under [`tied/`](../tied/). Methodology tokens under `tied/methodology/` are read-only. When authoring pseudo-code, cross-link vocabulary paths in REQ criteria and IMPL `related_decisions.see_also`.

## See also

- [README.md](../README.md) — product overview and feature list
- [tied/docs/pseudocode-writing-and-validation.md](../tied/docs/pseudocode-writing-and-validation.md) — language-agnostic IMPL blocks and literal copy to tests/code
- [FILE_MANAGER_SOLE_PURPOSE.md](FILE_MANAGER_SOLE_PURPOSE.md) — scope boundary for the `/files` experience
