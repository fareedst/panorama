# [IMPL-JOBS_DATA] Jobs Data Layer Implementation

**Cross-References**: [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement the job tracker data layer as a dedicated module with two YAML files (`data/positions.yaml`, `data/applications.yaml`) representing separate Position and Application entities, following a relational model. The data layer provides CRUD operations with module-level caching for read performance.

## Rationale

- **Relational model**: Separating positions and applications enables one-to-many relationship (one position can have multiple application status updates over time)
- **Module-level caching**: Improves read performance for server components
- **YAML storage**: Human-readable, version-controllable, no database setup required
- **Separation from config**: Data (positions/applications) lives in `data/` directory, distinct from configuration (`config/`)
- **Type safety**: TypeScript interfaces in `jobs.types.ts` ensure data integrity

## Implementation Approach

### File Structure

```
src/lib/
  jobs.types.ts  # TypeScript interfaces
  jobs.data.ts   # Data access layer

data/
  positions.yaml      # Position records
  applications.yaml   # Application records
```

### TypeScript Interfaces

**File**: `src/lib/jobs.types.ts`

```typescript
// [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]

/** Application status values */
export type ApplicationStatus =
  | "none"
  | "interested"
  | "to_apply"
  | "applied"
  | "rejected";

/** Job position record - core job posting information */
export interface Position {
  id: string;              // UUID
  title: string;
  postingDate: string;     // ISO date string: YYYY-MM-DD
  urls: string[];          // Job posting URLs
  description: string;
  notes: string;
  createdAt: string;       // ISO datetime string
  updatedAt: string;       // ISO datetime string
}

/** Application record - tracks application status for a position */
export interface Application {
  id: string;              // UUID
  positionId: string;      // Foreign key to Position
  status: ApplicationStatus;
  date: string;            // ISO date string: YYYY-MM-DD
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Position with its latest application status (for table view) */
export interface PositionWithStatus extends Position {
  latestStatus?: ApplicationStatus;
  latestStatusDate?: string;
  applications?: Application[];
}
```

### Data Access Functions

**File**: `src/lib/jobs.data.ts`

**Position operations**:
- `getPositions()`: Returns all positions (cached)
- `savePosition(position)`: Creates or updates a position
- `deletePosition(id)`: Deletes a position and its applications
- `getPositionById(id)`: Gets a single position

**Application operations**:
- `getApplications()`: Returns all applications (cached)
- `getApplicationsByPositionId(positionId)`: Returns applications for a position
- `saveApplication(application)`: Creates or updates an application
- `deleteApplication(id)`: Deletes an application
- `getApplicationById(id)`: Gets a single application

**Caching**:
- Module-level caches: `_positionsCache`, `_applicationsCache`
- Cache invalidation on write operations
- Export `_resetPositionsCache()` and `_resetApplicationsCache()` for testing

### YAML File Format

**data/positions.yaml**:
```yaml
- id: ea00df22-5daa-43d4-a556-6dc6b4f154f0
  title: Senior Software Engineer
  postingDate: '2026-01-15'
  urls:
    - https://company.com/careers/senior-swe
  description: Full stack role with React and Node.js
  notes: Great company culture
  createdAt: '2026-01-15T10:00:00.000Z'
  updatedAt: '2026-01-15T10:00:00.000Z'
```

**data/applications.yaml**:
```yaml
- id: f123e456-7890-1234-5678-901234567890
  positionId: ea00df22-5daa-43d4-a556-6dc6b4f154f0
  status: applied
  date: '2026-01-20'
  notes: Submitted through LinkedIn, referred by John
  createdAt: '2026-01-20T14:30:00.000Z'
  updatedAt: '2026-01-20T14:30:00.000Z'
```

## Code Markers

- `src/lib/jobs.types.ts`: TypeScript interfaces for Position, Application, ApplicationStatus, PositionWithStatus
- `src/lib/jobs.data.ts`: Data access layer with CRUD operations
- `data/positions.yaml`: Position records storage
- `data/applications.yaml`: Application records storage

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files that carry `[IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]` annotations:
- [x] `src/lib/jobs.types.ts` - Type definitions
- [x] `src/lib/jobs.data.ts` - Data access layer

Tests that reference `[REQ-JOB_TRACKER_DATA]`:
- [ ] `src/lib/jobs.data.test.ts` - Data layer tests (to be added)

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | - | ✅ Pass | Token audit performed; all job-related code uses REQ-JOB_TRACKER_* tokens; IMPL-JOBS_DATA token correctly applied to jobs.types.ts and jobs.data.ts |

**Token audit summary** (2026-02-06):
- Tokens in jobs code: `[REQ-JOB_TRACKER_CRUD]`, `[REQ-JOB_TRACKER_DATA]`, `[REQ-JOB_TRACKER_EDIT]`, `[REQ-JOB_TRACKER_LIST]`
- IMPL tokens in jobs code: `[IMPL-JOBS_DATA]`, `[IMPL-JOBS_ACTIONS]`, `[IMPL-JOBS_LIST_PAGE]`, `[IMPL-JOBS_EDIT_PAGE]`, `[IMPL-JOBS_API]`
- ARCH tokens in jobs code: `[ARCH-JOB_TRACKER_STORAGE]`, `[ARCH-JOB_TRACKER_UI]`, `[ARCH-APP_ROUTER]`
- All tokens exist in semantic-tokens.md registry
- Token traceability verified: REQ → ARCH → IMPL chain documented

## Related Decisions

- Depends on: [ARCH-JOB_TRACKER_STORAGE], [REQ-JOB_TRACKER_DATA]
- Informs: [IMPL-JOBS_ACTIONS], [IMPL-JOBS_LIST_PAGE], [IMPL-JOBS_EDIT_PAGE], [IMPL-JOBS_API]

---

*Last validated: 2026-02-06 by AI agent*
