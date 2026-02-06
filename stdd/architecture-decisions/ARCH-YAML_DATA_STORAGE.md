# [ARCH-YAML_DATA_STORAGE] YAML File-Based Data Storage

**Cross-References**: [REQ-JOB_SEARCH_TRACKER]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Use YAML files for persistent data storage of application records, leveraging the existing `js-yaml` dependency for both reading and writing. Data files reside in the `data/` directory at project root, separate from configuration files in `config/`.

## Rationale

- **Zero new dependencies**: `js-yaml` is already installed for the config loader; its `dump()` function handles writing
- **Consistency with config pattern**: The project already uses YAML for configuration; using it for data maintains a single file format across the project
- **Human-readable**: Records stored in YAML are easy to inspect, manually edit, and version-control
- **Self-contained**: No external database server or connection string needed; the application works immediately after clone
- **Server-side access**: Next.js Server Components and API routes can read/write files directly via Node.js `fs` module

## Alternatives Considered

- **SQLite via better-sqlite3**: More structured queries, but adds a native binary dependency and increases setup complexity
- **JSON files**: Less readable than YAML; no comment support; noisier diffs in version control
- **Browser localStorage**: Client-side only; no server-side rendering support; data loss on browser clear
- **PostgreSQL/MySQL**: Over-engineered for a local single-user tracker; requires external database server

## Implementation Approach

### File Layout

| File | Purpose |
|------|---------|
| `data/jobs.yaml` | Job position records |

### Data Format

Records are stored under a top-level `records` key as a YAML sequence. Each record has an `id` field (UUID v4) and dynamic fields matching the config schema.

### Read/Write Pattern

- **Read**: `fs.readFileSync` + `yaml.load()` (same as config loader)
- **Write**: `yaml.dump()` + `fs.writeFileSync` with `{ lineWidth: -1, noRefs: true }` for clean output
- **No caching**: Data reads are always fresh to reflect mutations (unlike config which is cached)

### ID Generation

Records use `crypto.randomUUID()` for unique identifiers, avoiding external UUID libraries.

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [x] `src/lib/jobs.ts` - Data reader/writer module
- [x] `src/lib/jobs.types.ts` - Data type definitions
- [x] `data/jobs.yaml` - Data file header comment

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | Full CRUD cycle verified via curl |

## Related Decisions

- Depends on: [REQ-JOB_SEARCH_TRACKER]
- Extends: [ARCH-CONFIG_DRIVEN_UI] (same YAML tooling)
- Informs: [IMPL-JOBS_DATA_LAYER]
- See also: [IMPL-YAML_CONFIG]

---

*Last validated: 2026-02-06 by AI agent*
