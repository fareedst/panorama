# [ARCH-JOB_TRACKER_API] Job Tracker API Architecture

**Cross-References**: [REQ-JOB_TRACKER_CRUD]  
**Status**: Planned  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Job position mutations (create, update, delete) are handled through a Next.js API Route at `/api/jobs` that reads the current YAML config, performs the requested operation, and writes the updated config back to `config/jobs.yaml`. The API uses HTTP methods (POST, DELETE) to indicate operation type.

## Rationale

- **Server-side file operations**: YAML file writes must happen on the server; browser can't write to filesystem
- **RESTful API pattern**: Standard HTTP methods (POST, DELETE) clearly indicate operation intent
- **Data integrity**: Centralized API endpoint ensures all mutations go through validation
- **Atomic operations**: Read-modify-write pattern minimizes risk of data corruption
- **Type safety**: API validates request payloads against TypeScript interfaces before saving
- **Error handling**: Centralized error handling and response formatting

## Alternatives Considered

- **Server Actions**: Next.js 13+ feature; simpler than API routes but less familiar pattern
- **Separate endpoints per operation**: `/api/jobs/create`, `/api/jobs/update`, `/api/jobs/delete` - more verbose, less RESTful
- **GraphQL API**: Over-engineered for simple CRUD operations on local YAML file
- **Direct file writes from client**: Impossible in browser; requires server-side handling
- **tRPC**: Adds dependency and build complexity for minimal benefit in this use case

## Implementation Approach

### API Route Structure

```
src/app/api/jobs/
└── route.ts
```

### HTTP Methods

| Method | Operation | Request Body | Response |
|--------|-----------|--------------|----------|
| POST | Create or Update | `JobPosition` object | `{ success: true, id: string }` |
| DELETE | Delete | Query param `?id=job-1` | `{ success: true }` |
| GET (optional) | Read single | Query param `?id=job-1` | `JobPosition` object |

### POST Handler (Create/Update)

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate body against JobPosition schema
  // Generate ID if creating new (body.id === "new")
  // Load current config
  // Find and update or append position
  // Save config
  // Return success with ID
}
```

### DELETE Handler

```typescript
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // Validate ID exists
  // Load current config
  // Filter out position with matching ID
  // Save config
  // Return success
}
```

### Data Validation

- Validate required fields (title, postingDate)
- Validate date formats (ISO 8601)
- Validate status type (enum check)
- Validate URLs format (basic URL validation)
- Return 400 Bad Request for validation failures

### Error Handling

- 400 Bad Request: Invalid payload, missing required fields
- 404 Not Found: Position ID doesn't exist (for updates/deletes)
- 500 Internal Server Error: File system errors, YAML parsing errors
- All errors return consistent JSON: `{ error: string, details?: any }`

### Concurrency Considerations

- Read-modify-write operations are not atomic in filesystem
- For personal single-user application, risk is minimal
- Future enhancement: Add file locking or optimistic concurrency control if needed

### ID Generation

For new positions (when `body.id === "new"`):
```typescript
function generateJobId(positions: JobPosition[]): string {
  const maxId = Math.max(
    0,
    ...positions.map(p => parseInt(p.id.replace('job-', '')) || 0)
  );
  return `job-${maxId + 1}`;
}
```

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `src/app/api/jobs/route.ts` - API route handlers

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `src/app/api/jobs/route.test.ts` - API endpoint tests

## Related Decisions

- Depends on: [REQ-JOB_TRACKER_CRUD], [ARCH-JOB_TRACKER_STORAGE], [ARCH-APP_ROUTER]
- Informs: [IMPL-JOBS_API]
- See also: [IMPL-CONFIG_LOADER]

---

*Last validated: 2026-02-06 by AI agent*
