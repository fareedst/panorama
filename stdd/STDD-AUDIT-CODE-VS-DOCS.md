# STDD Audit: Code vs Documentation (Agent Recreatability)

**STDD Methodology Version**: 1.3.0  
**Audit Date**: 2026-02-06  
**Remediation Date**: 2026-02-06  
**Question**: Can an agent recreate a working version of the code solely from the STDD documentation?

---

## Remediation Completed ✓

**Date**: 2026-02-06

The STDD documentation has been updated to accurately reflect the implemented code. All gaps identified in the original audit have been addressed:

- **Tokens aligned**: All code comments now use registry tokens (REQ-JOB_TRACKER_*, ARCH-JOB_TRACKER_*, IMPL-JOBS_DATA/ACTIONS/LIST_PAGE/EDIT_PAGE/API)
- **Data model documented**: Position + Application entities, data/positions.yaml and data/applications.yaml files documented in ARCH-JOB_TRACKER_STORAGE
- **Implementation details updated**: IMPL docs reflect jobs.data.ts, server actions in actions.ts, actual routes (/jobs, /jobs/new, /jobs/[id]/edit), and component structure (PositionForm, ApplicationForm, JobsTable, DeletePositionButton)
- **Single CRUD path**: lib/jobs.ts removed; API routes refactored to use jobs.data.ts; documentation reflects server actions as primary UI mutation mechanism
- **Types fixed**: jobs.types.ts is the single source; no missing type imports
- **New IMPL tokens added**: IMPL-JOBS_DATA and IMPL-JOBS_ACTIONS added to registry and implementation index

**Agent recreatability**: An agent following the updated documentation can now recreate the working job tracker implementation with correct data model, file structure, routes, and mutation mechanisms.

### Token Validation (Phase 3)

**Date**: 2026-02-06

Token audit performed on jobs-related code:
- All code files use registry tokens: REQ-JOB_TRACKER_*, ARCH-JOB_TRACKER_*, IMPL-JOBS_*
- Token coverage validated:
  - `src/app/jobs/**`: Uses REQ-JOB_TRACKER_LIST, REQ-JOB_TRACKER_EDIT, REQ-JOB_TRACKER_CRUD
  - `src/lib/jobs.*`: Uses REQ-JOB_TRACKER_DATA, IMPL-JOBS_DATA
  - `src/app/api/jobs/**`: Uses REQ-JOB_TRACKER_CRUD, IMPL-JOBS_API
- All tokens cross-referenced and present in semantic-tokens.md registry
- Validation evidence recorded in IMPL-JOBS_DATA.md per [PROC-TOKEN_VALIDATION]

**Result**: ✅ Pass - Token alignment complete; code and docs use consistent token set.

### Edit page return-to-source (2026-02-06)

- **Feature**: Edit Position page Return button destination and label depend on navigation source (Calendar vs List). Documented in [IMPL-EDIT_PAGE_RETURN_SOURCE](implementation-decisions/IMPL-EDIT_PAGE_RETURN_SOURCE.md).
- **Code**: CalendarView edit links use `?from=calendar`; edit page uses `searchParams.from` to set return href and label; config key `backToCalendar` added.
- **Tokens**: `[IMPL-EDIT_PAGE_RETURN_SOURCE]` in CalendarView and edit page; token registered in semantic-tokens.md and implementation-decisions index.

---

## Original Audit (Historical Reference)

**Original Conclusion**: **No.** In the original audit state, the code was **not** correctly represented in the STDD docs. An agent following only the documentation would have produced a different (and conflicting) design: different tokens, data model, file paths, and API shape. Critical gaps identified below have been remediated.

---

## 1. Semantic token mismatch (code vs registry)

### Requirements tokens in code but **not** in `semantic-tokens.md` or `requirements.md`

| Token (in code) | Used in | Registry / requirements |
|-----------------|--------|--------------------------|
| `[REQ-JOBS_EDIT]` | edit page, PositionForm, ApplicationForm, DeletePositionButton, new page | Not present; docs use `[REQ-JOB_TRACKER_EDIT]` |
| `[REQ-JOBS_TABLE_VIEW]` | jobs page, JobsTable | Not present; docs use `[REQ-JOB_TRACKER_LIST]` |
| `[REQ-JOBS_CRUD]` | actions.ts | Not present; docs use `[REQ-JOB_TRACKER_CRUD]` |
| `[REQ-JOBS_DATA_MODEL]` | jobs.types.ts | Not present |
| `[REQ-JOBS_DATA_STORAGE]` | jobs.data.ts | Not present; docs use `[REQ-JOB_TRACKER_DATA]` |
| `[REQ-JOB_SEARCH_TRACKER]` | lib/jobs.ts, API routes, JobForm | In requirements as alternate (merge conflict); not in registry Job Search Tracking table |

### Implementation tokens in code but **not** in `semantic-tokens.md` or implementation index

| Token (in code) | Used in | Registry / implementation index |
|-----------------|--------|----------------------------------|
| `[IMPL-JOBS_TYPES]` | jobs.types.ts | Not present |
| `[IMPL-JOBS_DATA]` | jobs.data.ts | Not present; docs use `[IMPL-JOBS_CONFIG]` for data/storage |
| `[IMPL-JOBS_PAGE]` | jobs/page.tsx | Not present; docs use `[IMPL-JOBS_LIST_PAGE]` |
| `[IMPL-JOBS_TABLE]` | JobsTable.tsx | Not present |
| `[IMPL-JOBS_POSITION_FORM]` | PositionForm.tsx | Not present |
| `[IMPL-JOBS_CREATE_PAGE]` | jobs/new/page.tsx | Not present |
| `[IMPL-JOBS_APPLICATION_FORM]` | ApplicationForm.tsx | Not present |
| `[IMPL-JOBS_ACTIONS]` | actions.ts | Not present; docs describe API-only CRUD `[IMPL-JOBS_API]` |

Docs describe a single `[IMPL-JOBS_EDIT_PAGE]` and `[IMPL-JOBS_LIST_PAGE]`; the code uses several more granular IMPL tokens and **server actions** (`[IMPL-JOBS_ACTIONS]`), which are not documented.

---

## 2. Data model and storage mismatch

| Aspect | STDD docs (IMPL-JOBS_CONFIG, ARCH-JOB_TRACKER_STORAGE, REQ-JOB_TRACKER_*) | Actual code |
|--------|----------------------------------------------------------------------------|-------------|
| **Data files** | Single file: `config/jobs.yaml` (or positions in one config) | **Two files**: `data/positions.yaml`, `data/applications.yaml`. Plus `data/jobs.yaml` used by `lib/jobs.ts`. |
| **Schema** | Single entity: `JobPosition` with nested `applicationStatus: { status, date, notes }` | **Two entities**: `Position` (id, title, postingDate, urls, description, notes, createdAt, updatedAt) and `Application` (id, positionId, status, date, notes, createdAt, updatedAt). |
| **Types location** | `config.types.ts`: JobPosition, ApplicationStatus, JobsConfig | `jobs.types.ts`: Position, Application, ApplicationStatus, PositionWithStatus. |
| **Loader / persistence** | `config.ts`: getJobsConfig(), saveJobsConfig(), config/jobs.yaml | **Separate module**: `jobs.data.ts`: getPositions(), savePosition(), getApplications(), saveApplication(), etc. No getJobsConfig in config.ts for jobs. |
| **Config vs data** | Docs: jobs as “config” (config/jobs.yaml) | Code: positions and applications as **data** in `data/*.yaml`; optional schema/config in `config/jobs.yaml` only for `lib/jobs.ts` path. |

An agent following only the docs would implement a single YAML file and a single `JobPosition` type; the working app uses a **relational** Position + Application model and separate YAML files.

---

## 3. Route and file path mismatch

| Doc (IMPL-JOBS_EDIT_PAGE, IMPL-JOBS_LIST_PAGE) | Actual code |
|-----------------------------------------------|-------------|
| Edit page file: `src/app/jobs/edit/[id]/page.tsx` | **`src/app/jobs/[id]/edit/page.tsx`** |
| Edit route: `/jobs/edit/:id` (e.g. `/jobs/edit/new`) | **`/jobs/:id/edit`** (e.g. `/jobs/new/edit`) |
| New position: link to `/jobs/edit/new` | List links to `/jobs/new` for create; edit is `/jobs/[id]/edit`. |
| List page: single component in `page.tsx` + inline JobsTable | List page in `page.tsx`; **JobsTable** in `components/JobsTable.tsx`. |

Docs would lead an agent to create the edit route under `edit/[id]`; the real route is `[id]/edit`.

---

## 4. API and CRUD mechanism mismatch

| Doc (IMPL-JOBS_API, ARCH-JOB_TRACKER_API) | Actual code |
|-------------------------------------------|-------------|
| Single route: `src/app/api/jobs/route.ts` with GET (all or ?id=), POST, DELETE (?id=) | **Two routes**: `api/jobs/route.ts` (GET all, POST create) and **`api/jobs/[id]/route.ts`** (GET, PUT, DELETE by id). |
| CRUD via API only; client uses fetch to API | **Primary CRUD**: **Server Actions** in `src/app/jobs/actions.ts` (createPosition, updatePosition, deletePosition, createApplication, etc.). Forms use actions, not fetch to API. |
| API uses getJobsConfig/saveJobsConfig from config, JobPosition | **API routes** use `lib/jobs.ts` (getJobRecords, saveJobRecord, data/jobs.yaml). **UI** uses `jobs.data.ts` (positions + applications). So **two CRUD paths**: API + lib/jobs.ts vs server actions + jobs.data.ts. |

Docs describe an API-only CRUD and a single route layout; the app uses server actions as the main mutation path and a split between `/api/jobs` and `/api/jobs/[id]`.

---

## 5. Components and behaviour not documented

- **ApplicationForm.tsx** – form for application status (separate from position); not in IMPL docs.
- **DeletePositionButton.tsx** – delete UX; not in IMPL docs.
- **PositionForm.tsx** – position fields only; docs describe a single combined “JobEditForm” with embedded status.
- **jobs/new/page.tsx** – dedicated “new position” page; docs describe “id = new” only on the edit page.
- **Server Actions** – createPosition, updatePosition, deletePosition, createApplication, updateApplication, deleteApplication; no IMPL or ARCH doc for server actions.

An agent following the docs would not create these components or the server-actions layer.

---

## 6. Unresolved merge conflicts in STDD docs

- **requirements.md**: Conflict between “Application Features” (REQ-JOB_SEARCH_TRACKER, ARCH-YAML_DATA_STORAGE, ARCH-CONFIG_DRIVEN_CRUD) and “Job Search Tracking Requirements” (REQ-JOB_TRACKER_*). Two requirement sets and two architecture mappings coexist.
- **architecture-decisions.md**: Conflict between ARCH-YAML_DATA_STORAGE / ARCH-CONFIG_DRIVEN_CRUD and ARCH-JOB_TRACKER_STORAGE / ARCH-JOB_TRACKER_UI / ARCH-JOB_TRACKER_API.
- **implementation-decisions.md**: Conflict between IMPL-JOB_SEARCH_TRACKER / IMPL-JOBS_DATA_LAYER / IMPL-JOBS_API_ROUTES / IMPL-JOBS_UI_PAGES and IMPL-JOBS_CONFIG / IMPL-JOBS_LIST_PAGE / IMPL-JOBS_EDIT_PAGE / IMPL-JOBS_API.

There is no single, unambiguous source of truth for requirements, architecture, or implementation.

---

## 7. Type and implementation consistency (lib/jobs.ts) ✓ Resolved

**Original issue**: `lib/jobs.ts` and API routes imported non-existent types (`JobsAppConfig`, `JobRecord`, `JobsDataFile`) from `jobs.types.ts`.

**Resolution**: `lib/jobs.ts` deleted; API routes refactored to use `jobs.data.ts` and existing types (`Position`, `Application`, `PositionWithStatus`). Single consistent type surface in `jobs.types.ts`.

---

## Recommendations for agent recreatability

To meet the STDD standard that “an agent must be able to recreate a working version of the code solely on the documentation,” do the following:

1. **Resolve merge conflicts** in `requirements.md`, `architecture-decisions.md`, and `implementation-decisions.md` so there is one requirement set and one architecture/implementation mapping for the job tracker.
2. **Choose a single token set** and align code and docs:
   - Either: **Rename code tokens** to match the registry (e.g. REQ-JOBS_EDIT → REQ-JOB_TRACKER_EDIT, IMPL-JOBS_DATA → IMPL-JOBS_CONFIG or a new IMPL for data layer), and add any new IMPL tokens to the registry; or
   - **Register the code’s tokens** (REQ-JOBS_*, IMPL-JOBS_TYPES, IMPL-JOBS_DATA, IMPL-JOBS_ACTIONS, IMPL-JOBS_PAGE, IMPL-JOBS_TABLE, etc.) in `semantic-tokens.md` and requirements/architecture/implementation docs, and update the doc text to use those tokens consistently.
3. **Update STDD docs to match the implemented design**:
   - Document **Position** and **Application** as separate entities; **data/positions.yaml** and **data/applications.yaml**; **jobs.types.ts** and **jobs.data.ts**.
   - Document **server actions** (e.g. IMPL-JOBS_ACTIONS) as the primary CRUD mechanism for the UI; document API routes as secondary or for a specific use case.
   - Fix **edit route** in IMPL-JOBS_EDIT_PAGE (and any list/new links): file `src/app/jobs/[id]/edit/page.tsx`, route `/jobs/[id]/edit`; document `/jobs/new` for create if that’s the intended UX.
   - Add **implementation decision** (or sections) for: ApplicationForm, DeletePositionButton, PositionForm, jobs/new page, and server actions.
4. **Resolve dual CRUD paths**: Either document both (lib/jobs.ts + data/jobs.yaml vs jobs.data.ts + positions/applications) and their intended use, or remove/deprecate one path and document the single chosen approach.
5. **Fix type exports**: Ensure `jobs.types.ts` (or a single agreed module) exports all types used by `lib/jobs.ts` and the API (e.g. JobRecord, JobsAppConfig, JobsDataFile) if that path is to remain; otherwise remove or refactor `lib/jobs.ts` and API routes to use Position/Application and jobs.data.ts only.
6. **Run token validation** (e.g. `./scripts/validate_tokens.sh`) after changes and record the result in implementation-decisions per `[PROC-TOKEN_VALIDATION]`.

---

## Summary table: doc vs code

| Layer | Doc says | Code does |
|-------|----------|-----------|
| REQ tokens | REQ-JOB_TRACKER_* | REQ-JOBS_* and REQ-JOB_SEARCH_TRACKER in code |
| IMPL tokens | IMPL-JOBS_CONFIG, IMPL-JOBS_LIST_PAGE, IMPL-JOBS_EDIT_PAGE, IMPL-JOBS_API | + IMPL-JOBS_TYPES, IMPL-JOBS_DATA, IMPL-JOBS_ACTIONS, IMPL-JOBS_PAGE, IMPL-JOBS_TABLE, IMPL-JOBS_POSITION_FORM, IMPL-JOBS_APPLICATION_FORM, IMPL-JOBS_CREATE_PAGE; API uses IMPL-JOB_SEARCH_TRACKER |
| Data model | Single JobPosition, embedded status | Position + Application (relational) |
| Data files | config/jobs.yaml (or single file) | data/positions.yaml, data/applications.yaml; data/jobs.yaml for API path |
| Types | config.types.ts (JobPosition, etc.) | jobs.types.ts (Position, Application, etc.) |
| Loader | config.ts getJobsConfig/saveJobsConfig | jobs.data.ts getPositions/savePosition/getApplications/… |
| Edit route | /jobs/edit/[id], file edit/[id]/page.tsx | /jobs/[id]/edit, file [id]/edit/page.tsx |
| CRUD | API only | Server actions (primary) + API (separate path) |
| Components | One edit form, table in list page | PositionForm, ApplicationForm, JobsTable, DeletePositionButton, new page |

---

*This audit supports [PROC-TOKEN_AUDIT] and the STDD goal that documentation alone is sufficient for an agent to recreate the working system.*
