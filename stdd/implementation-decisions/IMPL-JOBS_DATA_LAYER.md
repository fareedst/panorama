# [IMPL-JOBS_DATA_LAYER] Jobs Data Layer (Config + CRUD)

**Cross-References**: [ARCH-YAML_DATA_STORAGE] [REQ-JOB_SEARCH_TRACKER]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement a data layer module (`src/lib/jobs.ts`) that provides both config loading (cached) and data CRUD operations (uncached) for job records, following the same patterns as `src/lib/config.ts`.

## Rationale

- Consistent with existing config loader patterns (deep merge, defaults, YAML reading)
- Separates config (cached, read-only) from data (uncached, read-write) concerns
- Provides a clean API surface for both API routes and server component pages

## Implementation Approach

### Type Definitions (`src/lib/jobs.types.ts`)

Key interfaces:
- `FieldOption` -- value/label pair for select options
- `FieldType` -- union: `"text" | "date" | "textarea" | "select" | "url-list"`
- `FieldConfig` -- single field definition (name, label, type, required, showInTable, options)
- `JobsAppConfig` -- top-level config: `{ app, fields, table }`
- `JobRecord` -- dynamic record: `{ id: string; [key: string]: string | string[] | undefined }`
- `JobsDataFile` -- data file shape: `{ records: JobRecord[] }`

### Config Loading (Cached)

```typescript
export function getJobsConfig(): JobsAppConfig
```

- Reads `config/jobs.yaml`, deep-merges with `DEFAULT_JOBS_CONFIG`, caches at module level
- Default config includes all 7 field definitions and 5 application status options

### Data Operations (Uncached)

```typescript
export function getJobRecords(): JobRecord[]      // All records, sorted by config defaults
export function getJobRecord(id: string): JobRecord | null  // Single record by ID
export function saveJobRecord(record: Partial<JobRecord>): JobRecord  // Create or update
export function deleteJobRecord(id: string): boolean  // Remove by ID
```

- `getJobRecords()` sorts by `table.defaultSort` / `table.defaultSortDirection` from config
- `saveJobRecord()` generates UUID via `crypto.randomUUID()` for new records
- `writeYamlFile()` ensures the `data/` directory exists before writing

### Deep Merge Utility

Uses the same `deepMerge()` function pattern as `config.ts` -- arrays are replaced not concatenated, objects are recursively merged.

## Code Markers

- `src/lib/jobs.ts`: Main module with all public functions
- `src/lib/jobs.types.ts`: All TypeScript interfaces
- Function `getJobsConfig()`: Config loader with cache
- Function `getJobRecords()`: Sorted record listing
- Function `saveJobRecord()`: Create/update with UUID generation
- Function `writeYamlFile()`: YAML serialization helper

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/jobs.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-CONFIG_DRIVEN_UI] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/lib/jobs.types.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-CONFIG_DRIVEN_UI] [REQ-JOB_SEARCH_TRACKER]

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | CRUD operations verified via API endpoints |

## Related Decisions

- Depends on: [ARCH-YAML_DATA_STORAGE], [IMPL-CONFIG_LOADER] (pattern reference)
- Informs: [IMPL-JOBS_API_ROUTES], [IMPL-JOBS_UI_PAGES]

---

*Last validated: 2026-02-06 by AI agent*
