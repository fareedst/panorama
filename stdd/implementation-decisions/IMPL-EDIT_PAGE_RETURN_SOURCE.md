# [IMPL-EDIT_PAGE_RETURN_SOURCE] Edit Position Return to Source View

**Cross-References**: [ARCH-JOB_TRACKER_UI] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_EDIT] [REQ-JOB_TRACKER_CALENDAR]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

When the user opens the Edit Position page from the Calendar view, the Return button must navigate back to the Calendar view and display a label that indicates that destination (e.g. "Return to Calendar"). When opened from the List view (or with no source), the Return button continues to navigate to the List view with the existing "Back to List" label.

## Rationale

- Users expect "Return" to go back to the view they came from, not always to the list.
- The button label must reflect the actual destination for clarity and accessibility.

## Implementation Approach

### Source indication via query parameter

Use a query parameter `from=calendar` when navigating from the Calendar view to the edit page. The edit page reads `searchParams` and chooses return URL and button label accordingly. When `from` is missing or not `calendar`, default to List (current behavior).

### 1. Calendar: pass source when linking to edit

**File**: `src/app/jobs/calendar/CalendarView.tsx`

- Position detail panel: set edit link to `/jobs/${selectedItem.data.id}/edit?from=calendar`.
- Application detail panel: set edit link to `/jobs/${selectedItem.data.positionId}/edit?from=calendar`.

List view links remain unchanged (no query param).

### 2. Edit page: use searchParams for return destination and label

**File**: `src/app/jobs/[id]/edit/page.tsx`

- Extend page props with `searchParams: Promise<{ from?: string }>` (Next.js App Router).
- Await both `params` and `searchParams` at the start of the component.
- Derive:
  - **Return URL**: if `searchParams.from === 'calendar'` then `/jobs/calendar`, else `/jobs`.
  - **Return label**: if from calendar use `copy.backToCalendar ?? "Return to Calendar"`, else `copy.backToList ?? "Back to List"`.
- Use these values for the existing Return `Link` (replace hard-coded `href="/jobs"` and `{backToList}`).

### 3. Config: add copy key for return-to-calendar label

**Files**: `config/jobs.yaml`, `src/lib/config.ts`, `src/lib/config.types.ts`

- Add optional copy key `backToCalendar` with default "Return to Calendar".
- Add to jobs copy section in YAML, config loader defaults, and TypeScript copy type.

## Resulting behavior

| Opened from | Return URL       | Button label (default)   |
|-------------|------------------|---------------------------|
| Calendar    | `/jobs/calendar` | "Return to Calendar"      |
| List / other| `/jobs`          | "Back to List"            |

## Code Markers

- `src/app/jobs/calendar/CalendarView.tsx`: Edit Position links append `?from=calendar`.
- `src/app/jobs/[id]/edit/page.tsx`: Accept `searchParams`, derive return href and label, use in Return Link.
- `config/jobs.yaml`, `src/lib/config.ts`, `src/lib/config.types.ts`: `backToCalendar` copy key.

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files that must carry `[IMPL-EDIT_PAGE_RETURN_SOURCE]` (and related tokens):

- [x] `src/app/jobs/calendar/CalendarView.tsx` – edit links append `?from=calendar`
- [x] `src/app/jobs/[id]/edit/page.tsx` – return link and label from searchParams

## Related Decisions

- Depends on: [IMPL-JOBS_EDIT_PAGE], [IMPL-CALENDAR_GRID]
- See also: [ARCH-JOB_TRACKER_UI], [ARCH-CALENDAR_VIEW]

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date       | Result | Notes |
|------------|--------|--------|
| 2026-02-06 | Done   | Implemented: CalendarView edit links use `?from=calendar`; edit page uses searchParams for return href/label; `backToCalendar` in config. Build and lints pass. |

---

*Last validated: 2026-02-06 (implementation complete)*
