# [IMPL-JOBS_API_ROUTES] Jobs API Routes

**Cross-References**: [ARCH-CONFIG_DRIVEN_CRUD] [REQ-JOB_SEARCH_TRACKER]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement RESTful API routes using Next.js App Router route handlers for CRUD operations on job records.

## Rationale

- Next.js App Router natively supports route handlers (`route.ts`) co-located with pages
- RESTful conventions (GET, POST, PUT, DELETE) are standard and well-understood
- Route handlers run server-side, enabling direct filesystem access for YAML data
- Dynamic route segments (`[id]`) provide clean URL patterns for individual records

## Implementation Approach

### Route Structure

| Route | Method | Handler | Status Code | Description |
|-------|--------|---------|-------------|-------------|
| `/api/jobs` | GET | `route.ts` | 200 | List all records (sorted) |
| `/api/jobs` | POST | `route.ts` | 201 | Create new record |
| `/api/jobs/[id]` | GET | `[id]/route.ts` | 200 / 404 | Get single record |
| `/api/jobs/[id]` | PUT | `[id]/route.ts` | 200 | Update record |
| `/api/jobs/[id]` | DELETE | `[id]/route.ts` | 204 / 404 | Delete record |

### Request/Response Format

- **Request body**: JSON with field values matching config field names
- **Response**: JSON record object (with `id` field)
- **Errors**: JSON `{ error: "message" }` with appropriate HTTP status

### Dynamic Route Parameters

Next.js 16 uses `params: Promise<{ id: string }>` pattern for dynamic route segments. Parameters are awaited in each handler.

### File Locations

- `src/app/api/jobs/route.ts` -- collection endpoints (GET list, POST create)
- `src/app/api/jobs/[id]/route.ts` -- individual record endpoints (GET, PUT, DELETE)

## Code Markers

- `src/app/api/jobs/route.ts`: `GET()` and `POST()` handlers
- `src/app/api/jobs/[id]/route.ts`: `GET()`, `PUT()`, `DELETE()` handlers
- All handlers import from `src/lib/jobs.ts`

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/app/api/jobs/route.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-APP_ROUTER] [REQ-JOB_SEARCH_TRACKER]
- [x] `src/app/api/jobs/[id]/route.ts` - [IMPL-JOB_SEARCH_TRACKER] [ARCH-APP_ROUTER] [REQ-JOB_SEARCH_TRACKER]

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | All endpoints tested via curl: POST 201, GET 200, PUT 200, DELETE 204 |

## Related Decisions

- Depends on: [IMPL-JOBS_DATA_LAYER], [ARCH-APP_ROUTER]
- Informs: [IMPL-JOBS_UI_PAGES] (form submits to these endpoints)

---

*Last validated: 2026-02-06 by AI agent*
