# [ARCH-JOB_TRACKER_STORAGE] Job Tracker Storage Architecture

**Cross-References**: [REQ-JOB_TRACKER_DATA], [REQ-JOB_TRACKER_STATUS]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Job position data is stored in two separate YAML data files (`data/positions.yaml`, `data/applications.yaml`) representing a relational model with Position and Application entities. Positions track job postings, while Applications track application status history for each position (one-to-many relationship).

## Rationale

- **Relational model**: Separating positions from applications enables tracking multiple application attempts or status changes over time for the same position
- **Data vs configuration**: Job data belongs in `data/` directory, distinct from application configuration in `config/`
- **Human-readable format**: YAML is easy to read and edit manually if needed
- **Version control friendly**: Text-based YAML files can be tracked in git, providing audit trail of job search activity
- **No database setup required**: Simplifies deployment and local development
- **Type safety**: TypeScript interfaces ensure data integrity when reading/writing
- **Suitable for personal use**: Single-user job tracking doesn't require concurrent access or complex query capabilities

## Alternatives Considered

- **Browser Local Storage**: Data wouldn't be backed up or version-controlled; limited to single browser
- **SQLite Database**: Over-engineered for single-user tracking; adds setup complexity
- **PostgreSQL/MySQL**: Requires database server; excessive for personal job tracking application
- **JSON file**: Less human-readable than YAML; no comments support
- **Spreadsheet (CSV)**: Limited structure; difficult to represent nested application status

## Implementation Approach

### Data Structure

**data/positions.yaml** - Job position records:
```yaml
- id: ea00df22-5daa-43d4-a556-6dc6b4f154f0
  title: Senior Software Engineer
  postingDate: '2026-01-15'
  urls:
    - https://company.com/careers/senior-swe
    - https://linkedin.com/jobs/12345
  description: Full stack role with React and Node.js
  notes: Great company culture, flexible remote work
  createdAt: '2026-01-15T10:00:00.000Z'
  updatedAt: '2026-01-15T10:00:00.000Z'
```

**data/applications.yaml** - Application status records:
```yaml
- id: f123e456-7890-1234-5678-901234567890
  positionId: ea00df22-5daa-43d4-a556-6dc6b4f154f0
  status: applied
  date: '2026-01-20'
  notes: Submitted through LinkedIn, referred by John
  createdAt: '2026-01-20T14:30:00.000Z'
  updatedAt: '2026-01-20T14:30:00.000Z'
```

### TypeScript Schema

```typescript
export type ApplicationStatus =
  | "none"        // No action taken yet
  | "interested"  // Position looks interesting
  | "to_apply"    // Planning to apply
  | "applied"     // Application submitted
  | "rejected";   // Application rejected or withdrawn

export interface Position {
  id: string;              // UUID
  title: string;           // Position title
  postingDate: string;     // ISO date string (YYYY-MM-DD)
  urls: string[];          // Array of related URLs
  description: string;     // Job description/requirements
  notes: string;           // General notes about the position
  createdAt: string;       // ISO datetime string
  updatedAt: string;       // ISO datetime string
}

export interface Application {
  id: string;              // UUID
  positionId: string;      // Foreign key to Position
  status: ApplicationStatus;
  date: string;            // ISO date string (YYYY-MM-DD)
  notes: string;           // Free-form notes about this application
  createdAt: string;       // ISO datetime string
  updatedAt: string;       // ISO datetime string
}

export interface PositionWithStatus extends Position {
  latestStatus?: ApplicationStatus;
  latestStatusDate?: string;
  applications?: Application[];
}
```

### Storage Location

- **Files**: `data/positions.yaml`, `data/applications.yaml`
- **Rationale**: Separates user data from application configuration; enables relational model
- **Backup**: Users can commit to git or copy files for backup

### Data Layer Module

Dedicated module `src/lib/jobs.data.ts` provides:
- **Position operations**: `getPositions()`, `savePosition()`, `deletePosition()`, `getPositionById()`
- **Application operations**: `getApplications()`, `saveApplication()`, `deleteApplication()`, `getApplicationById()`, `getApplicationsByPositionId()`
- **Module-level caching** for read operations (separate caches for positions and applications)
- **Cache invalidation** on write operations
- **Cascade delete**: Deleting a position also deletes its applications

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [x] `src/lib/jobs.types.ts` - TypeScript interfaces
- [x] `src/lib/jobs.data.ts` - Data access layer
- [x] `data/positions.yaml` - Position records
- [x] `data/applications.yaml` - Application records
- [ ] `src/lib/config.ts` - Extended with jobs config functions
- [ ] `src/lib/config.types.ts` - Job-related TypeScript interfaces

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `src/lib/config.test.ts` - Jobs config loader tests

## Related Decisions

- Depends on: [REQ-JOB_TRACKER_DATA], [REQ-JOB_TRACKER_STATUS], [ARCH-CONFIG_DRIVEN_UI]
- Informs: [IMPL-JOBS_CONFIG], [ARCH-JOB_TRACKER_API]
- See also: [IMPL-CONFIG_LOADER], [IMPL-YAML_CONFIG]

---

*Last validated: 2026-02-06 by AI agent*
