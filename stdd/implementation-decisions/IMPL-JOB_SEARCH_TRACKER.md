# [IMPL-JOB_SEARCH_TRACKER] Job Search Tracker Feature

**Cross-References**: [ARCH-CONFIG_DRIVEN_CRUD] [ARCH-YAML_DATA_STORAGE] [REQ-JOB_SEARCH_TRACKER]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement a complete job search activity tracker as the first config-driven CRUD application, extending the existing YAML configuration architecture with data storage, API routes, and dynamic form/table UI components.

## Rationale

- Demonstrates that the config-driven architecture can power data-backed features, not just static content
- Provides immediate utility for job seekers tracking positions and applications
- Establishes patterns (config-driven forms, tables, API routes, YAML data) reusable for future apps
- No new dependencies required -- uses existing `js-yaml` and Node.js `crypto` module

## Implementation Approach

### Feature Structure

```
config/jobs.yaml              # App schema: field definitions, status options, table config
data/jobs.yaml                # Data storage: position records
src/lib/jobs.types.ts         # TypeScript interfaces (FieldConfig, JobRecord, etc.)
src/lib/jobs.ts               # Config loader + data CRUD module
src/app/api/jobs/route.ts     # GET (list) + POST (create) API
src/app/api/jobs/[id]/route.ts # GET (single) + PUT (update) + DELETE API
src/app/jobs/page.tsx         # Table view (server component)
src/app/jobs/new/page.tsx     # New record page (server component wrapper)
src/app/jobs/[id]/edit/page.tsx # Edit record page (server component wrapper)
src/app/jobs/components/JobForm.tsx # Dynamic form (client component)
```

### Data Flow

```
config/jobs.yaml --> getJobsConfig() --> pages + form (field definitions)
data/jobs.yaml   --> getJobRecords() --> table page (record list)
                 --> getJobRecord()  --> edit page (single record)
JobForm (client) --> fetch(/api/jobs) --> saveJobRecord() --> data/jobs.yaml
```

### Key Design Decisions

1. **Server/client split**: Pages are server components for data loading; `JobForm` is a client component for interactivity
2. **Dynamic field rendering**: Form iterates over config `fields` array and renders the appropriate input for each `type`
3. **No caching for data**: Config is cached (read once); data reads are always fresh to reflect mutations
4. **UUID for IDs**: `crypto.randomUUID()` avoids external dependencies
5. **Navigation**: Home page `site.yaml` updated with a "Job Search Tracker" button linking to `/jobs`

## Code Markers

- `config/jobs.yaml`: Field definitions, status options, table settings
- `src/lib/jobs.ts`: `getJobsConfig()`, `getJobRecords()`, `getJobRecord()`, `saveJobRecord()`, `deleteJobRecord()`
- `src/lib/jobs.types.ts`: `FieldConfig`, `FieldType`, `JobsAppConfig`, `JobRecord`, `JobsDataFile`
- `src/app/jobs/page.tsx`: Config-driven table with `formatCellValue()` helper
- `src/app/jobs/components/JobForm.tsx`: Dynamic field renderer, `UrlListField` sub-component
- `src/app/api/jobs/route.ts`: `GET` and `POST` handlers
- `src/app/api/jobs/[id]/route.ts`: `GET`, `PUT`, and `DELETE` handlers

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files/functions that carry `[IMPL-*] [ARCH-*] [REQ-*]` annotations:
- [x] `config/jobs.yaml` - [REQ-JOB_SEARCH_TRACKER]
- [x] `data/jobs.yaml` - [REQ-JOB_SEARCH_TRACKER]
- [x] `src/lib/jobs.types.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-CONFIG_DRIVEN_UI] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/lib/jobs.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-CONFIG_DRIVEN_UI] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/api/jobs/route.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-APP_ROUTER] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/api/jobs/[id]/route.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-APP_ROUTER] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/new/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/[id]/edit/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/components/JobForm.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | Full CRUD cycle verified, all routes 200, TypeScript clean |

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_CRUD], [ARCH-YAML_DATA_STORAGE], [ARCH-CONFIG_DRIVEN_UI]
- Informs: [IMPL-JOBS_DATA_LAYER], [IMPL-JOBS_API_ROUTES], [IMPL-JOBS_UI_PAGES]

---

*Last validated: 2026-02-06 by AI agent*
