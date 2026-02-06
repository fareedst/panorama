# [IMPL-JOBS_ACTIONS] Jobs Server Actions Implementation

**Cross-References**: [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement CRUD operations as Next.js Server Actions in `src/app/jobs/actions.ts`. Server Actions enable form submissions and mutations without client-side API routes, providing better performance and simpler code flow for the UI.

## Rationale

- **Zero JavaScript for mutations**: Forms can submit directly to Server Actions without client-side fetch code
- **Automatic revalidation**: `revalidatePath` ensures cache invalidation and fresh data
- **Server-side only**: All data operations stay on the server, no data layer code ships to client
- **Type safety**: Server Actions are fully typed, reducing runtime errors
- **Simpler than API routes**: No need for route handlers, request parsing, or response formatting for form submissions

## Implementation Approach

### Server Actions File

**File**: `src/app/jobs/actions.ts`

```typescript
"use server";

// [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
// Server Actions for CRUD operations on positions and applications.
```

### Position Actions

**createPosition(formData: FormData)**
- Parses form data into Position object
- Generates UUID for new position
- Sets createdAt and updatedAt timestamps
- Calls `savePosition()` from jobs.data.ts
- Revalidates `/jobs` path
- Redirects to `/jobs` list page

**updatePosition(id: string, formData: FormData)**
- Fetches existing position
- Updates fields from form data
- Updates `updatedAt` timestamp
- Calls `savePosition()`
- Revalidates `/jobs` and `/jobs/[id]/edit`
- Redirects to `/jobs`

**deletePosition(id: string)**
- Calls `deletePosition()` from jobs.data.ts (also deletes related applications)
- Revalidates `/jobs` path
- Redirects to `/jobs` list page

### Application Actions

**createApplication(formData: FormData)**
- Parses form data into Application object
- Generates UUID for new application
- Sets createdAt and updatedAt timestamps
- Calls `saveApplication()` from jobs.data.ts
- Revalidates `/jobs` and position edit page
- Returns success (form can stay on page)

**updateApplication(id: string, formData: FormData)**
- Fetches existing application
- Updates fields from form data
- Updates `updatedAt` timestamp
- Calls `saveApplication()`
- Revalidates affected paths

**deleteApplication(id: string)**
- Calls `deleteApplication()` from jobs.data.ts
- Revalidates affected paths

### Usage in Forms

Forms bind to Server Actions using the `action` attribute:

```tsx
<form action={createPosition}>
  {/* form fields */}
  <button type="submit">Create Position</button>
</form>
```

Or with `useFormState` for showing validation errors:

```tsx
"use client";
import { useFormState } from "react-dom";
import { createPosition } from "./actions";

const [state, formAction] = useFormState(createPosition, null);
<form action={formAction}>
  {/* form fields */}
</form>
```

### Revalidation Strategy

- **After position create/update/delete**: Revalidate `/jobs` (list page) and `/jobs/[id]/edit` (edit pages)
- **After application create/update/delete**: Revalidate `/jobs` and the specific position edit page
- Use `redirect()` after mutations that change the primary entity (position) to navigate user to list
- Use return values for application mutations so user can stay on the edit page

## Code Markers

- `src/app/jobs/actions.ts`: All Server Action implementations
- `src/app/jobs/[id]/edit/page.tsx`: Uses `updatePosition`, application actions
- `src/app/jobs/new/page.tsx`: Uses `createPosition`
- `src/app/jobs/components/PositionForm.tsx`: Renders forms that use position actions
- `src/app/jobs/components/ApplicationForm.tsx`: Renders forms that use application actions
- `src/app/jobs/components/DeletePositionButton.tsx`: Uses `deletePosition`

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files that carry `[IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]` annotations:
- [x] `src/app/jobs/actions.ts` - Server Actions implementation

Tests that reference `[REQ-JOB_TRACKER_CRUD]`:
- [ ] `src/app/jobs/actions.test.ts` - Server Actions tests (to be added)

## Related Decisions

- Depends on: [ARCH-JOB_TRACKER_UI], [REQ-JOB_TRACKER_CRUD], [IMPL-JOBS_DATA]
- Informs: [IMPL-JOBS_EDIT_PAGE] (forms bind to these actions)
- Alternative to: API routes for mutations (API routes still exist for external access, but UI uses Server Actions)

---

*Last validated: 2026-02-06 by AI agent*
