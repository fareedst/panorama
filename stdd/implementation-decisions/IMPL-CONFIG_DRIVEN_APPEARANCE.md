# [IMPL-CONFIG_DRIVEN_APPEARANCE] Config-Driven Appearance Implementation

**Cross-References**: [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement full config-driven appearance and layout for all pages by: (1) adding a jobs config loader and types for `config/jobs.yaml` (schema + copy); (2) extending `config/theme.yaml` with jobs layout/overrides and status badge class mapping; (3) refactoring all jobs pages and components to consume config (and theme) for layout, copy, and styling—removing every hard-coded layout class and user-facing string from jobs UI.

## Rationale

- Aligns code with [REQ-CONFIG_DRIVEN_APPEARANCE] and [ARCH-CONFIG_DRIVEN_APPEARANCE].
- Reuses existing config loader pattern (read YAML, deep-merge with defaults, cache) for jobs config.
- Keeps server-only config in server components; client components receive resolved props (copy, class names) to avoid importing Node-only loaders.

## Implementation Approach

### 1. Jobs config loader

- **Location**: Extend `src/lib/config.ts` with `getJobsConfig()` (or add `src/lib/jobs.config.ts` that reads `config/jobs.yaml`). Use same `readYamlFile` + `deepMerge` + module-level cache pattern as site/theme.
- **Types**: In `src/lib/config.types.ts` or jobs-specific types file, define `JobsConfig` (or extend existing jobs types) to include:
  - Existing: `app`, `fields`, `table`.
  - New: `copy` (or equivalent) for list title, add-new button, empty message, edit link, delete button, delete confirm, form section titles, etc., keyed by a stable identifier (e.g. `copy.listTitle`, `copy.addNewPosition`).
- **Defaults**: Provide `DEFAULT_JOBS_CONFIG` so partial YAML works. Export cache reset for tests.

### 2. Theme extension for jobs

- **In `config/theme.yaml`**: Add an `overrides.jobs` section (or top-level `jobs` with layout + overrides) containing:
  - Optional layout tokens: e.g. `maxWidth`, `paddingY`, `paddingX` for jobs page container.
  - Per-element override keys: e.g. `pageContainer`, `card`, `tableHeader`, `primaryButton`, `secondaryButton`, `dangerButton`, and optionally `statusBadgeDefault` plus per-status keys (`statusBadgeApplied`, `statusBadgeRejected`, etc.) or a single map `statusBadges: { applied: "…", rejected: "…", … }`.
- **In `config.types.ts`**: Extend `ThemeConfig` (or `ClassOverrides`) with a `jobs` property holding these keys.
- **In config loader**: Ensure `getThemeConfig()` returns the extended structure; add a small helper if needed, e.g. `getJobsThemeOverrides(theme)` or use `theme.overrides.jobs` / `theme.jobs`.

### 3. Jobs pages (server components)

- **List page** (`src/app/jobs/page.tsx`): Call `getJobsConfig()` and `getThemeConfig()`. Derive page title/subtitle from jobs config `app` and `copy`. Build container and button classes from theme (jobs layout + overrides). Pass copy and class names to layout and to `JobsTable` as props.
- **New page** (`src/app/jobs/new/page.tsx`): Same pattern; title, subtitle, card class from config; pass to `PositionForm` as needed.
- **Edit page** (`src/app/jobs/[id]/edit/page.tsx`): Same; section headings and card classes from config; resolve status badge class map from theme (or jobs config) and pass to children that render status badges.

### 4. Jobs components

- **JobsTable**: Accept props for container class, table header classes, empty-state copy (title + link text), edit link label, and status badge class map (status value → class string). Remove all hard-coded strings and `getStatusColorClass`; use map from props.
- **PositionForm**: Labels come from field definitions (already in jobs config); ensure form is driven by `fields` from `getJobsConfig()`. Input/card/button classes come from theme overrides passed as props (or from a shared context/provider set by server parent).
- **ApplicationForm**: Status options from jobs config (field of type select with options). Copy for "Add Application" / "Edit Application" and button labels from jobs config. Classes from props.
- **DeletePositionButton**: Label and button class from config (passed as props from edit page).

### 5. Status badge classes

- Define in config (theme or jobs) as a map: status value (e.g. `applied`, `rejected`) → Tailwind class string. Server resolves the map and passes it to table and edit page; components use `statusBadgeClass[status] ?? statusBadgeClass.default` (or similar). Remove `getStatusColorClass()` from components.

### 6. Home page

- Confirm no remaining hard-coded layout or copy that should live in config; existing implementation already uses theme and site config. If any default class strings are still literal in `page.tsx`, consider moving defaults into `DEFAULT_THEME_CONFIG` / `DEFAULT_SITE_CONFIG` so the source of truth is config.

## Token Coverage `[PROC-TOKEN_AUDIT]`

After implementation, all touched files must carry:

- `[IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]` in comments where config-driven appearance is applied.

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date       | Commit | Validation Result | Notes                          |
|-----------|--------|-------------------|--------------------------------|
| 2026-02-06 | pending | Planned            | After implementation complete |

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_APPEARANCE], [REQ-CONFIG_DRIVEN_APPEARANCE]
- Informs: Jobs list/edit/new pages and jobs components
- See also: [IMPL-CONFIG_LOADER], [IMPL-CLASS_OVERRIDES], [IMPL-JOBS_LIST_PAGE], [IMPL-JOBS_EDIT_PAGE]

---

*Last validated: 2026-02-06 by AI agent*
