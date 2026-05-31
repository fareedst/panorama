# TIED domain vocabulary research — agent prompt (Panorama)

Copy everything in the **Prompt** section below into a new Cursor (or other TIED-aware) agent session on a **target TIED client repository**. For Panorama, placeholders are already filled; adapt `{PROJECT}` / `{INDEX_PATH}` when reusing on another repo.

**Purpose:** Research existing code, tests, and docs; author one or more **canonical domain vocabulary** files plus an **index**; wire light TIED cross-links. Vocabulary makes IMPL `essence_pseudocode` **precise, comparable, and traceable**—not a substitute for implementing features.

**Reference implementation (this repo):** [`panorama-domain-references.md`](panorama-domain-references.md), [`vocabulary-index-analysis-and-standards.md`](vocabulary-index-analysis-and-standards.md).

---

## Customization (Panorama)

| Placeholder | Panorama value |
|-------------|----------------|
| `{PROJECT}` | `panorama` |
| `{INDEX_PATH}` | `docs/panorama-domain-references.md` |
| `{VOCAB_DIR}` | `tied/vocab/` |

### Domain seeds (Panorama)

Group work by cohesive subsystems that already have REQ/ARCH/IMPL clusters:

1. **Workspace & pane shell** — [`workspace-pane.md`](../tied/vocab/workspace-pane.md) ([`REQ-FILE_MANAGER_PAGE`](../tied/requirements/REQ-FILE_MANAGER_PAGE.yaml), [`REQ-MULTI_PANE_LAYOUT`](../tied/requirements/REQ-MULTI_PANE_LAYOUT.yaml))
2. **NSYNC multi-target** — [`nsync-multi-target.md`](../tied/vocab/nsync-multi-target.md) ([`REQ-NSYNC_MULTI_TARGET`](../tied/requirements/REQ-NSYNC_MULTI_TARGET.yaml))
3. **Cross-pane comparison** — [`cross-pane-comparison.md`](../tied/vocab/cross-pane-comparison.md) ([`REQ-CROSS_PANE_COMPARISON`](../tied/requirements/REQ-CROSS_PANE_COMPARISON.yaml))
4. **Linked navigation** — [`linked-navigation.md`](../tied/vocab/linked-navigation.md) ([`REQ-LINKED_PANES`](../tied/requirements/REQ-LINKED_PANES.yaml))
5. **File marking** — [`file-marking.md`](../tied/vocab/file-marking.md) ([`REQ-FILE_MARKING_WEB`](../tied/requirements/REQ-FILE_MARKING_WEB.yaml))
6. **Pane display filters** — [`pane-display-filter.md`](../tied/vocab/pane-display-filter.md) ([`REQ-PANE_DISPLAY_FILTER`](../tied/requirements/REQ-PANE_DISPLAY_FILTER.yaml))
7. **Cross-pane visibility** — [`cross-pane-visibility.md`](../tied/vocab/cross-pane-visibility.md) ([`REQ-CROSS_PANE_VISIBILITY`](../tied/requirements/REQ-CROSS_PANE_VISIBILITY.yaml))
8. **Toolbar & keybinds** — [`toolbar-keybind.md`](../tied/vocab/toolbar-keybind.md) ([`REQ-TOOLBAR_SYSTEM`](../tied/requirements/REQ-TOOLBAR_SYSTEM.yaml))
9. **Mesh platform** — [`mesh-platform.md`](../tied/vocab/mesh-platform.md) ([`REQ-MESH_GUI`](../tied/requirements/REQ-MESH_GUI.yaml), [`REQ-WORKSPACE_MESH_BRIDGE`](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml))

---

## Prompt

```markdown
# Task: Research the codebase and author canonical domain vocabulary references for TIED

You are working in the **Panorama** TIED client repository. Research existing **code**, **tests**, and **docs**, then maintain **vocabulary (glossary) files** plus the **index** at `docs/panorama-domain-references.md`. These files are the **canonical names** for domain concepts—used in README, reviews, REQ/ARCH prose, tests, and especially **IMPL `essence_pseudocode`**.

Read before writing vocabulary:

- `AGENTS.md`, `tied/docs/ai-principles.md`
- `tied/docs/implementation-decisions.md` — § Preferred vocabulary for essence_pseudocode
- `tied/docs/pseudocode-writing-and-validation.md`
- `docs/vocabulary-index-analysis-and-standards.md` — mandatory section order and Copy coverage rule

## Phase 1 — Discover (read-only)

1. Confirm TIED base path → this repo's `tied/`.
2. Map the nine domain seeds above; collect evidence from code, tests, and TIED sidecars.
3. Record naming collisions (UI vs config vs code symbol).
4. Do not duplicate algorithms — vocabulary only.

## Phase 2 — Author / maintain vocabulary files

Mandatory section order per `vocabulary-index-analysis-and-standards.md`:

Title (canonical) → Scope → Traceability → See also → Preferred term vs synonyms → Naming bridge → Named concepts → **Copy coverage** (`config/files.yaml` → `copy.*`) → Pseudo-code block names → Alphabetical index

Run `bash scripts/validate-vocabulary.sh` after edits.

## Phase 3 — Wire TIED (LEAP-light)

1. REQ description/criteria reference glossary path + pseudo-code block names.
2. IMPL `see_also` includes glossary path.
3. Run `tied_validate_consistency`; lint changed YAML per [PROC-YAML_EDIT_LOOP].

## Phase 4 — Acceptance criteria

- [ ] Index lists every vocabulary file with scope
- [ ] Each glossary has all mandatory sections including Copy coverage
- [ ] Each glossary cited by ≥1 REQ criterion
- [ ] Glossary ↔ UPPER_SNAKE block table populated
- [ ] No algorithms in glossaries
- [ ] README links index
```

---

## Reference implementation verification (Panorama)

| Acceptance item | Panorama status |
|-----------------|-----------------|
| Index lists all vocabulary files | [`panorama-domain-references.md`](panorama-domain-references.md) — 9 glossaries |
| Each glossary: scope, synonyms, Copy coverage, pseudo-code blocks, index | All `tied/vocab/*.md` glossaries |
| REQ cites vocabulary path | e.g. [`REQ-LINKED_PANES`](../tied/requirements/REQ-LINKED_PANES.yaml) → `tied/vocab/linked-navigation.md` |
| Glossary ↔ UPPER_SNAKE blocks | e.g. `EVALUATE_FOCUS_VISIBILITY` in [`IMPL-CROSS_PANE_VISIBILITY_ENGINE-pseudocode.md`](../tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_ENGINE-pseudocode.md) |
| Mesh snapshot terms defined once | [`mesh-platform.md`](../tied/vocab/mesh-platform.md); workspace-pane links out |
| README links index | [README.md](../README.md) § Domain vocabulary |
| Validation script | [`scripts/validate-vocabulary.sh`](../scripts/validate-vocabulary.sh) |

### Sample pseudo-code alignment (Panorama)

| Preferred term | Pseudo-code block | IMPL token | Action |
|----------------|-------------------|------------|--------|
| Linked downward nav | `DownwardNavigation` | IMPL-LINKED_NAV | ok |
| Multi-target sync entry | `SyncMethod` | IMPL-NSYNC_ENGINE | ok |
| Compare filter tri-state | `CYCLE_TRI_STATE` | IMPL-CROSS_PANE_VISIBILITY_UI | ok |
| Display spec apply | `APPLY_PANE_LISTING` | IMPL-DISPLAY_FILTER_ENGINE | ok |
| Workspace snapshot capture | `CAPTURE_SNAPSHOT` | IMPL-WORKSPACE_MESH_BRIDGE | ok |
