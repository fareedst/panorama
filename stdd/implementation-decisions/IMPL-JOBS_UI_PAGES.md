# [IMPL-JOBS_UI_PAGES] Jobs UI Pages (Table, Form, Edit)

**Cross-References**: [ARCH-CONFIG_DRIVEN_CRUD] [REQ-JOB_SEARCH_TRACKER]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement three pages and one reusable client component for the job search tracker UI, using server components for data loading and a client component for interactive forms.

## Rationale

- **Server/client split** follows the architecture decision [ARCH-SERVER_COMPONENTS]: pages load data server-side, the form handles user interaction client-side
- **Single form component** (`JobForm`) is reused for both new and edit pages, reducing duplication
- **Config-driven rendering** means the form and table dynamically adapt to field definitions without code changes

## Implementation Approach

### Page Components (Server)

#### Table Page (`/jobs`) -- `src/app/jobs/page.tsx`

- Reads `getJobsConfig()` and `getJobRecords()`
- Filters fields by `showInTable: true` for column headers
- Renders each record as a table row using `formatCellValue()` helper
- `formatCellValue()` handles select label lookups, url-list counts, and empty values
- Empty state shows a dashed border placeholder with guidance
- "New Position" button links to `/jobs/new`
- Each row has an "Edit" link to `/jobs/[id]/edit`

#### New Page (`/jobs/new`) -- `src/app/jobs/new/page.tsx`

- Reads `getJobsConfig()` for field definitions
- Renders `JobForm` with no initial record data

#### Edit Page (`/jobs/[id]/edit`) -- `src/app/jobs/[id]/edit/page.tsx`

- Reads `getJobsConfig()` and `getJobRecord(id)`
- Returns 404 via `notFound()` if record doesn't exist
- Renders `JobForm` with existing record data pre-filled

### Form Component (Client)

#### `JobForm` -- `src/app/jobs/components/JobForm.tsx`

- `"use client"` directive for React hooks and event handlers
- Props: `fields` (config), `record` (optional existing data), `appTitle`
- Builds initial form state from record or empty values
- Dynamic field renderer maps config `type` to input component:
  - `text` -> `<input type="text">`
  - `date` -> `<input type="date">`
  - `textarea` -> `<textarea>`
  - `select` -> `<select>` with options from config
  - `url-list` -> `UrlListField` sub-component (add/remove URL inputs)
- `UrlListField` sub-component manages a dynamic list of URL inputs
- On submit: calls `fetch()` to POST (new) or PUT (edit) API route
- On success: `router.push("/jobs")` + `router.refresh()`
- Error handling: displays error message banner

### Styling

All components use Tailwind CSS with:
- Dark mode support (`dark:` variants)
- Consistent form input styling (borders, focus rings, spacing)
- Responsive layout (max-width containers, padding)
- Theme-compatible colors (zinc palette matching existing design)

## Code Markers

- `src/app/jobs/page.tsx`: `JobsPage()`, `formatCellValue()`
- `src/app/jobs/new/page.tsx`: `NewJobPage()`
- `src/app/jobs/[id]/edit/page.tsx`: `EditJobPage()`
- `src/app/jobs/components/JobForm.tsx`: `JobForm()`, `UrlListField()`, `renderField()`

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/app/jobs/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/new/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/[id]/edit/page.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/jobs/components/JobForm.tsx` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-SERVER_COMPONENTS] [REQ-JOB_SEARCH_TRACKER]

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | All pages return 200, form creates/updates records successfully |

## Related Decisions

- Depends on: [IMPL-JOBS_DATA_LAYER], [IMPL-JOBS_API_ROUTES], [ARCH-SERVER_COMPONENTS]
- See also: [IMPL-HOME_PAGE] (page component pattern reference)

---

*Last validated: 2026-02-06 by AI agent*
