# [ARCH-CONFIG_DRIVEN_APPEARANCE] Config-Driven Appearance and Layout for All Pages

**Cross-References**: [REQ-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Extend the configuration-driven UI so that **every** page and shared component gets appearance and layout from one or more configuration files. No route or component may rely on hard-coded layout classes, spacing, colors, or user-facing copy; all such values are sourced from `config/site.yaml`, `config/theme.yaml`, and `config/jobs.yaml` (or extended sections). This ensures the project serves as a highly-configurable template with a single, consistent pattern: config dictates what users see and how it looks.

## Rationale

- **Template usability**: A template is only useful if customization does not require editing source code. Gaps (e.g. jobs app with hard-coded titles, buttons, table styles, status colors) force code changes and undermine the promise.
- **Consistency**: The same pattern (config → loader → components) should apply to home, jobs list, jobs new, jobs edit, and all shared jobs components.
- **Single source of truth**: Copy, layout tokens, and styling live in YAML; components are thin renderers that read config and apply it.

## Alternatives Considered

- **Leave jobs app hard-coded**: Rejected; violates the "all page elements" requirement and template goal.
- **Separate layout config file (e.g. config/layout.yaml)**: Possible but adds another file; reusing and extending `theme.yaml` and `config/jobs.yaml` keeps the existing two-file (site/theme) plus jobs pattern and avoids proliferation.
- **CSS-only theming for jobs**: Insufficient; copy (titles, button labels, empty state text) and structural layout (max-width, padding) must also come from config.

## Implementation Approach

### Scope

- **Already config-driven**: Home page ([`src/app/page.tsx`](src/app/page.tsx)), root layout ([`src/app/layout.tsx`](src/app/layout.tsx)), and globals ([`src/app/globals.css`](src/app/globals.css)) use `getSiteConfig()`, `getThemeConfig()`, and theme injection. No change required except to ensure no remaining hard-coded defaults that should live in config.
- **In scope**: All jobs routes and components:
  - [`src/app/jobs/page.tsx`](src/app/jobs/page.tsx) – list page layout, title, subtitle, primary button
  - [`src/app/jobs/new/page.tsx`](src/app/jobs/new/page.tsx) – new page layout, title, subtitle, card
  - [`src/app/jobs/[id]/edit/page.tsx`](src/app/jobs/[id]/edit/page.tsx) – edit page layout, headings, cards, status badges
  - [`src/app/jobs/components/JobsTable.tsx`](src/app/jobs/components/JobsTable.tsx) – table container, headers, empty state, link labels, status badge classes
  - [`src/app/jobs/components/PositionForm.tsx`](src/app/jobs/components/PositionForm.tsx) – form labels from config; input/button/card classes from theme or jobs config
  - [`src/app/jobs/components/ApplicationForm.tsx`](src/app/jobs/components/ApplicationForm.tsx) – labels, status options from config; classes from config
  - [`src/app/jobs/components/DeletePositionButton.tsx`](src/app/jobs/components/DeletePositionButton.tsx) – label and button classes from config

### Config Strategy

1. **`config/jobs.yaml`** (existing; extend as needed)
   - **Already present**: `app.title`, `app.description`, `fields` (with labels), `table` (sort, direction), and for select fields `options` (value/label).
   - **Add or clarify**: Copy for page titles, buttons, empty state, confirm dialog (e.g. `copy.listTitle`, `copy.addNewButton`, `copy.emptyMessage`, `copy.edit`, `copy.deleteConfirm`). Optionally a `copy` section keyed by usage so all jobs UI strings come from one place.
   - Jobs config is loaded by a **jobs config loader** (e.g. `getJobsConfig()` in [`src/lib/config.ts`](src/lib/config.ts) or a dedicated module). Schema and copy are consumed by jobs pages and components.

2. **`config/theme.yaml`** (extend)
   - **Extend `overrides`** (or add a `jobs` section) with keys for jobs-specific elements so layout and styling are overridable without code: e.g. `jobsPageContainer`, `jobsCard`, `jobsTableHeader`, `jobsPrimaryButton`, `jobsSecondaryButton`, `statusBadgeDefault`, and optionally per-status badge classes (e.g. `statusBadgeApplied`, `statusBadgeRejected`) or a mapping from status value to class string in config.
   - **Optional**: Add a `layout.jobs` section with semantic tokens (e.g. `maxWidth`, `paddingY`, `paddingX`) so jobs pages use the same pattern as home (theme spacing/sizing + overrides).

3. **Consumption**
   - Server components (jobs list, new, edit page wrappers) call `getThemeConfig()` and `getJobsConfig()`, compute class strings and copy, and pass them as props to client components where needed.
   - Client components (forms, table, delete button) receive class names and copy as props from the server parent, or receive a "config slice" (e.g. jobs copy + overrides) passed from server so they do not import server-only config loaders.

### Data Flow (Conceptual)

- **Config files** → **Loaders** (`getSiteConfig`, `getThemeConfig`, `getJobsConfig`) → **Server pages** (resolve classes + copy) → **Components** (receive props; no hard-coded layout/copy).
- Status badge colors: either (a) in `config/jobs.yaml` as a map (status value → Tailwind class string) or (b) in `config/theme.yaml` under a `jobs.statusBadges` map. Single source of truth; components look up by status key.

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments after implementation:

- [ ] `src/lib/config.ts` – jobs config loader and cache (if added here)
- [ ] `src/lib/config.types.ts` – jobs config types and theme overrides extension
- [ ] `config/theme.yaml` – jobs overrides or jobs layout section
- [ ] `config/jobs.yaml` – copy section or extended app copy
- [ ] `src/app/jobs/page.tsx` – consume theme + jobs config for layout and copy
- [ ] `src/app/jobs/new/page.tsx` – same
- [ ] `src/app/jobs/[id]/edit/page.tsx` – same; pass status badge class map to children
- [ ] `src/app/jobs/components/JobsTable.tsx` – receive copy and class props from server
- [ ] `src/app/jobs/components/PositionForm.tsx` – receive label/copy and class props
- [ ] `src/app/jobs/components/ApplicationForm.tsx` – receive status options and copy from config; class props from theme
- [ ] `src/app/jobs/components/DeletePositionButton.tsx` – receive label and button class from config

Tests expected to reference `[REQ-CONFIG_DRIVEN_APPEARANCE]`:

- [ ] Jobs page tests that assert config-driven copy and/or layout
- [ ] Config loader tests for jobs config (if new loader)

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date       | Commit | Validation Result | Notes                          |
|-----------|--------|-------------------|--------------------------------|
| 2026-02-06 | pending | Planned            | After implementation complete |

## Related Decisions

- Depends on: [REQ-CONFIG_DRIVEN_APPEARANCE], [REQ-CONFIG_DRIVEN_UI]
- Extends: [ARCH-CONFIG_DRIVEN_UI] (same pattern applied to all routes)
- Informs: [IMPL-CONFIG_DRIVEN_APPEARANCE]
- See also: [ARCH-CONFIG_DRIVEN_CRUD], [ARCH-CLASS_OVERRIDES]

---

*Last validated: 2026-02-06 by AI agent*
