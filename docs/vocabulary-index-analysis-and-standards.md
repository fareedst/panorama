# Vocabulary index analysis and recommended standards

Analysis of the canonical domain vocabulary indices under [`docs/`](.) — what they contain, recommended authoring standards, and how their TIED integration differs from a traditional software glossary.

**Index of the corpus:** [`panorama-domain-references.md`](panorama-domain-references.md). **Replication prompt:** [`tied-domain-vocabulary-research-prompt.md`](tied-domain-vocabulary-research-prompt.md).

**Scope:** This is a meta-document *about* the glossaries; it is not itself a domain glossary and is not the source of canonical terms. For canonical terms, use the individual `docs/*-vocabulary.md` files.

---

## 1. What the vocabulary indices are (replication brief)

### 1a. The corpus (three layers)

The vocabulary system is three layers, not just the nine glossaries:

- **One index page** — [`panorama-domain-references.md`](panorama-domain-references.md). A single-page directory with a `Priority | Document | Scope` table (one row per glossary), plus sections for **Authoring guides (not glossaries)**, **Behavior inventories (not glossaries)**, split/merge policy, and a PR acceptance checklist.
- **Nine canonical glossaries** (`docs/*-vocabulary.md`):

  | Glossary | Index priority | Scope |
  |----------|----------------|-------|
  | [`workspace-pane-vocabulary.md`](workspace-pane-vocabulary.md) | P0 | Workspace, pane, focus, layout, pane lifecycle (intentional hub; mesh snapshot terms link to mesh-platform) |
  | [`nsync-multi-target-vocabulary.md`](nsync-multi-target-vocabulary.md) | P0 | NSYNC multi-destination sync, `sync-all`, compare/skip, move semantics |
  | [`cross-pane-comparison-vocabulary.md`](cross-pane-comparison-vocabulary.md) | P0 | Comparison index, shared filenames, visual comparison modes |
  | [`linked-navigation-vocabulary.md`](linked-navigation-vocabulary.md) | P1 | Linked mode, synchronized directory/cursor/sort |
  | [`file-marking-vocabulary.md`](file-marking-vocabulary.md) | P1 | Marks, bulk operation source resolution |
  | [`pane-display-filter-vocabulary.md`](pane-display-filter-vocabulary.md) | P1 | Display specs, active spec, catalog sync |
  | [`cross-pane-visibility-vocabulary.md`](cross-pane-visibility-vocabulary.md) | P1 | Tri-state compare filters, focus/mirror semantics |
  | [`toolbar-keybind-vocabulary.md`](toolbar-keybind-vocabulary.md) | P1 | Toolbar tiers, keybinding actions, icon registry |
  | [`mesh-platform-vocabulary.md`](mesh-platform-vocabulary.md) | P2 | Mesh platform, workspace snapshot v1–v5, cross-surface links |

- **One replication prompt** — [`tied-domain-vocabulary-research-prompt.md`](tied-domain-vocabulary-research-prompt.md). Agent prompt with Phases 1–4 and a Panorama verification table.

### 1b. Mandatory section order (every glossary)

1. **Title with `(canonical)`**
2. **Scope** — inclusions and explicit exclusions; algorithms live in IMPL pseudo-code
3. **Traceability** — primary REQ/ARCH/IMPL links
4. **See also** — sibling glossaries and index
5. **Preferred term vs synonyms**
6. **Naming bridge** (when UI/config/code forms differ)
7. **Named concepts** / catalogs
8. **Copy coverage** — Panorama substitute for Markscope Help/L10n (see below)
9. **Pseudo-code block names** — `Preferred term | UPPER_SNAKE block | Owning IMPL`
10. **Alphabetical index**

Optional when a domain spans multiple filter stages owned by different IMPLs: **Filter pipeline terms** table (stage, preferred term, owning IMPL, block) — see [`cross-pane-visibility-vocabulary.md`](cross-pane-visibility-vocabulary.md).

### 1c. Copy coverage (Panorama-specific)

Markscope glossaries use a **Help coverage** block (in-app Help tab + L10n keys). Panorama uses **Copy coverage** instead:

- User-facing strings live in `config/files.yaml` → `copy.*` prefixes
- Toolbar tooltips and `help.show` / command palette summarize shortcuts
- The glossary remains authoritative for **preferred terms and code symbols**; copy keys are summarized by prefix

### 1d. Split/merge rule

- **Split** when a domain has ~15+ named concepts or distinct audiences.
- **Merge** when two areas share one dispatch/order story.
- **Exception:** [`workspace-pane-vocabulary.md`](workspace-pane-vocabulary.md) is an **intentional hub** for the file-manager shell (pane layout, restore UX chrome, file columns). Mesh snapshot and cross-surface link terms are **defined once** in [`mesh-platform-vocabulary.md`](mesh-platform-vocabulary.md); workspace-pane links there instead of duplicating.

### 1e. TIED integration

Glossaries are a **controlled-vocabulary layer** in the chain REQ → ARCH → IMPL pseudo-code → tests → code. REQ criteria cite glossary paths **and** pseudo-code block names together. Run **`tied_validate_consistency`** after wiring TIED YAML.

---

## 2. Governance and PR gate

Before merging vocabulary or TIED traceability changes:

- [ ] Index lists every `docs/*-vocabulary.md` file with scope
- [ ] Each glossary has all mandatory sections (including **Copy coverage** and **Pseudo-code block names**)
- [ ] Alphabetical index covers bold preferred terms (run [`scripts/validate-vocabulary.sh`](../scripts/validate-vocabulary.sh))
- [ ] At least one REQ criterion cites each glossary path
- [ ] Owning IMPL `see_also` includes the glossary path where applicable
- [ ] No step-by-step algorithms in glossaries (link to `*-pseudocode.md` instead)
- [ ] `tied_validate_consistency` passes on changed TIED YAML

---

## 3. Validation

```bash
bash scripts/validate-vocabulary.sh
# or
bun run validate:vocabulary
```

The script checks mandatory headings, index row count vs glossary file count, and warns on preferred-term vs alphabetical-index drift.
