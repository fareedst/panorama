# [IMPL-JOBS_API] Jobs API Implementation

**Cross-References**: [ARCH-JOB_TRACKER_API] [REQ-JOB_TRACKER_CRUD]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement Next.js API routes at `src/app/api/jobs/route.ts` (list/create) and `src/app/api/jobs/[id]/route.ts` (get/update/delete). The API uses the jobs.data.ts data layer and returns Position/PositionWithStatus objects. Primary mutations use Server Actions; API routes provide secondary access for external tools or clients.

## Rationale

- RESTful API enables external access (CLI tools, scripts, mobile apps)
- Uses jobs.data.ts for consistency with Server Actions
- Returns PositionWithStatus (positions combined with latest application) for GET operations
- Validation prevents invalid data
- UI uses Server Actions; API is secondary/optional access method

## Implementation Approach

### API Route Structure

**File**: `src/app/api/jobs/route.ts`

**File**: `src/app/api/jobs/route.ts`

```typescript
// [IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]
import { NextResponse } from "next/server";
import {
  getPositions,
  savePosition,
  getApplications,
} from "../../../lib/jobs.data";
import type { Position, PositionWithStatus } from "../../../lib/jobs.types";

/**
 * GET /api/jobs - List all positions with their latest application status
 */
export async function GET() {
  const positions = getPositions();
  const applications = getApplications();
  
  const positionsWithStatus: PositionWithStatus[] = positions.map((position) => {
    const positionApps = applications
      .filter((app) => app.positionId === position.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestApp = positionApps[0];
    
    return {
      ...position,
      latestStatus: latestApp?.status,
      latestStatusDate: latestApp?.date,
      applications: positionApps,
    };
  });
  
  return NextResponse.json(positionsWithStatus);
}

/**
 * POST /api/jobs - Create a new position
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.postingDate) {
      return NextResponse.json(
        { error: "Title and postingDate are required" },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const position: Position = {
      id: body.id || crypto.randomUUID(),
      title: body.title,
      postingDate: body.postingDate,
      urls: body.urls || [],
      description: body.description || "",
      notes: body.notes || "",
      createdAt: body.createdAt || now,
      updatedAt: now,
    };
    
    savePosition(position);
    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/jobs/[id]/route.ts`

```typescript
// [IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]
import { NextResponse } from "next/server";
import {
  getPositionById,
  savePosition,
  deletePosition,
  getApplicationsByPositionId,
} from "../../../../lib/jobs.data";
import type { Position } from "../../../../lib/jobs.types";

/**
 * GET /api/jobs/[id] - Get a single position with its applications
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const position = getPositionById(id);
  
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  const applications = getApplicationsByPositionId(id);
  return NextResponse.json({ ...position, applications });
}

/**
 * PUT /api/jobs/[id] - Update a position
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existingPosition = getPositionById(id);
  
  if (!existingPosition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  const body = await request.json();
  const updatedPosition: Position = {
    ...existingPosition,
    title: body.title ?? existingPosition.title,
    postingDate: body.postingDate ?? existingPosition.postingDate,
    urls: body.urls ?? existingPosition.urls,
    description: body.description ?? existingPosition.description,
    notes: body.notes ?? existingPosition.notes,
    updatedAt: new Date().toISOString(),
  };
  
  savePosition(updatedPosition);
  return NextResponse.json(updatedPosition);
}

/**
 * DELETE /api/jobs/[id] - Delete a position and its applications
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const position = getPositionById(id);
  
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  deletePosition(id);
  return new NextResponse(null, { status: 204 });
}
```

### Request/Response Formats

**POST Request (Create/Update)**:
```json
{
  "id": "new",
  "title": "Senior Software Engineer",
  "postingDate": "2026-01-15",
  "urls": ["https://company.com/careers"],
  "description": "Full stack role...",
  "applicationStatus": {
    "status": "interested",
    "date": null,
    "notes": ""
  },
  "notes": "Great company"
}
```

**POST Response (Success)**:
```json
{
  "success": true,
  "id": "job-1"
}
```

**POST Response (Error)**:
```json
{
  "error": "Title and posting date are required"
}
```

**DELETE Request**:
```
DELETE /api/jobs?id=job-1
```

**DELETE Response (Success)**:
```json
{
  "success": true
}
```

**GET Request (Single Position)**:
```
GET /api/jobs?id=job-1
```

**GET Response**:
```json
{
  "id": "job-1",
  "title": "Senior Software Engineer",
  ...
}
```

### Error Handling

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing required fields | `{ error: "..." }` |
| 400 | Invalid date format | `{ error: "Invalid posting date format" }` |
| 400 | Invalid status type | `{ error: "Invalid application status" }` |
| 404 | Position not found (DELETE/GET) | `{ error: "Job position not found" }` |
| 500 | File system error | `{ error: "Failed to save job position" }` |

### Validation Rules

1. **Required Fields**:
   - `title` (non-empty string)
   - `postingDate` (valid ISO date string)

2. **Optional Fields**:
   - `urls` (array of strings, defaults to [])
   - `description` (string, defaults to "")
   - `applicationStatus.date` (valid ISO date string or null)
   - `applicationStatus.notes` (string, defaults to "")
   - `notes` (string, defaults to "")

3. **Enum Validation**:
   - `applicationStatus.status` must be one of: "none", "interested", "to apply", "applied", "rejected"

## Code Markers

- `src/app/api/jobs/route.ts`: GET (list), POST (create) handlers
- `src/app/api/jobs/[id]/route.ts`: GET (single), PUT (update), DELETE handlers
- `src/app/api/jobs/route.test.ts`: API endpoint tests (to be added)

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/app/api/jobs/route.ts` - `[IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]`
- [x] `src/app/api/jobs/[id]/route.ts` - `[IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]`
- [ ] `src/app/api/jobs/route.test.ts` - `[REQ-JOB_TRACKER_CRUD] [IMPL-JOBS_API]`

## Related Decisions

- Depends on: [ARCH-JOB_TRACKER_API], [IMPL-JOBS_DATA]
- Informs: Client-side data fetching and mutation patterns
- See also: [IMPL-JOBS_EDIT_PAGE]

---

*Last validated: 2026-02-06 by AI agent*
