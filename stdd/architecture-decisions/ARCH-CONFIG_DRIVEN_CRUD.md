# [ARCH-CONFIG_DRIVEN_CRUD] Config-Driven CRUD Pattern

**Cross-References**: [REQ-JOB_SEARCH_TRACKER], [ARCH-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Extend the existing config-driven UI architecture to CRUD features: field definitions, select options, table column visibility, and form rendering are all driven by a YAML configuration file (`config/jobs.yaml`). The same config drives both the form (edit/new pages) and the table (list page), ensuring consistency without duplicating field definitions.

## Rationale

- **Consistency**: Follows the established `config/site.yaml` and `config/theme.yaml` pattern, keeping configuration centralized in YAML
- **Customizability**: Users can add, remove, or reorder fields, change status options, or toggle table columns by editing YAML -- no code changes required
- **Single source of truth**: Field definitions are declared once and consumed by forms, tables, and API validation
- **Extensibility**: Adding a new field type requires only a new renderer in the form component and a new `type` value in config

## Alternatives Considered

- **Hard-coded fields**: Simpler to implement initially but defeats the config-driven philosophy; every schema change requires code edits
- **Database schema introspection**: More dynamic but adds complexity and couples the UI to the storage layer
- **JSON Schema**: More standardized but less readable than YAML and adds a dependency for validation

## Implementation Approach

### Config Structure (`config/jobs.yaml`)

```yaml
app:
  title: "Job Search Tracker"
  description: "Track open positions and applications"

fields:
  - name: title
    label: "Position Title"
    type: text          # text | date | textarea | select | url-list
    required: true
    showInTable: true
  - name: applicationStatus
    label: "Application Status"
    type: select
    showInTable: true
    options:
      - value: none
        label: "None"
      # ... more options

table:
  defaultSort: "postingDate"
  defaultSortDirection: "desc"
```

### Config-to-UI Mapping

| Config `type` | Form Input | Table Cell |
|---------------|-----------|------------|
| `text` | `<input type="text">` | Raw string |
| `date` | `<input type="date">` | Raw string |
| `textarea` | `<textarea>` | Raw string |
| `select` | `<select>` with `options` | Option label lookup |
| `url-list` | Dynamic URL input list with add/remove | Link count |

### Component Architecture

- **Server components** (table page, edit/new page wrappers) load config and data, pass them as props
- **Client component** (`JobForm`) receives field definitions and renders the appropriate form controls dynamically
- Table page iterates over `fields.filter(f => f.showInTable)` for column headers and cell values

### Deep Merge with Defaults

The jobs config loader uses the same `deepMerge` utility pattern as the site/theme config, ensuring partial YAML configs work correctly.

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [x] `config/jobs.yaml` - Field definitions and app config
- [x] `src/lib/jobs.ts` - Config loader with defaults and merge
- [x] `src/lib/jobs.types.ts` - TypeScript interfaces for config schema
- [x] `src/app/jobs/page.tsx` - Table driven by config fields
- [x] `src/app/jobs/components/JobForm.tsx` - Form driven by config fields
- [x] `src/app/jobs/new/page.tsx` - New record page
- [x] `src/app/jobs/[id]/edit/page.tsx` - Edit record page

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | All pages render correctly with config-driven fields |

## Related Decisions

- Depends on: [REQ-JOB_SEARCH_TRACKER], [ARCH-CONFIG_DRIVEN_UI]
- Extends: [ARCH-CONFIG_DRIVEN_UI] (config-driven pattern applied to CRUD)
- Informs: [IMPL-JOB_SEARCH_TRACKER], [IMPL-JOBS_UI_PAGES]
- See also: [ARCH-YAML_DATA_STORAGE], [ARCH-SERVER_COMPONENTS]

---

*Last validated: 2026-02-06 by AI agent*
