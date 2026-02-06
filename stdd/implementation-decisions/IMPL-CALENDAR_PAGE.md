# [IMPL-CALENDAR_PAGE] Calendar Page Server Component

**Cross-References**: [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]  
**Status**: Planned  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Implementation

Server component at `src/app/jobs/calendar/page.tsx` that loads data and config, then renders the calendar page shell with a client component for interactivity.

## Approach

### File Location
- `src/app/jobs/calendar/page.tsx`

### Responsibilities
1. Load positions via `getPositions()` from `src/lib/jobs.data.ts`
2. Load applications via `getApplications()` from `src/lib/jobs.data.ts`
3. Load jobs config via `getJobsConfig()` from `src/lib/config.ts`
4. Load theme config via `getThemeConfig()` from `src/lib/config.ts`
5. Combine positions with applications using `combinePositionsWithStatuses()` logic (extract or duplicate from list page)
6. Build status badge class map using `getStatusBadgeClass()` helper
7. Extract calendar copy from jobs config
8. Extract calendar overrides from theme config
9. Render page shell (header with title, subtitle, back link)
10. Pass data to `CalendarView` client component

### Page Shell Structure
```tsx
<div className={pageContainerClass}>
  <div className={innerClass}>
    <div className="header">
      <Link href="/jobs">{copy.calendarBackToList}</Link>
      <h1>{copy.calendarTitle}</h1>
      <p>{copy.calendarSubtitle}</p>
    </div>
    <CalendarView
      positions={positionsWithStatuses}
      applications={applications}
      copy={calendarCopy}
      overrides={calendarOverrides}
      statusBadgeClasses={statusBadgeClasses}
    />
  </div>
</div>
```

### Config Copy Keys Used
- `calendarTitle`
- `calendarSubtitle`
- `calendarBackToList`
- Plus all keys passed to `CalendarView`

### Config Overrides Used
- `pageContainer` (from jobs overrides)
- Plus calendar-specific overrides passed to `CalendarView`

## Code Structure

```typescript
// [IMPL-CALENDAR_PAGE] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]
import { getPositions, getApplications } from "../../lib/jobs.data";
import { getJobsConfig, getThemeConfig, getStatusBadgeClass } from "../../lib/config";
import CalendarView from "./CalendarView";

// Helper function to combine positions with applications
function combinePositionsWithStatuses() { ... }

export default function CalendarPage() {
  const positions = getPositions();
  const applications = getApplications();
  const jobsConfig = getJobsConfig();
  const theme = getThemeConfig();
  
  const positionsWithStatuses = combinePositionsWithStatuses();
  const statusBadgeClasses = buildStatusBadgeClasses(theme);
  
  const copy = {
    // Extract calendar copy from jobsConfig.copy
  };
  
  const overrides = {
    // Extract calendar overrides from theme.jobs.overrides
  };
  
  return (
    // Page shell JSX
  );
}
```

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] File header contains `[IMPL-CALENDAR_PAGE] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]`
- [ ] Helper functions annotated with tokens
- [ ] Data loading calls annotated
- [ ] Config extraction annotated

## Testing

Test file: `src/app/jobs/calendar/page.test.tsx`

Test cases:
- [ ] Renders without errors
- [ ] Loads positions and applications
- [ ] Passes correct props to CalendarView
- [ ] Renders page header with config copy
- [ ] Applies config overrides

## Validation `[PROC-TOKEN_VALIDATION]`

**Validation Date**: 2026-02-06  
**TypeScript Compilation**: ✅ Pass  
**ESLint**: ✅ Pass  
**Tests**: ✅ Pass (3/3 tests passing)  
**Total Test Suite**: ✅ Pass (120/120 tests passing)

## Related Decisions

- Depends on: [ARCH-CALENDAR_VIEW], [REQ-JOB_TRACKER_CALENDAR], [IMPL-JOBS_DATA], [IMPL-CONFIG_LOADER]
- Related: [IMPL-CALENDAR_GRID], [IMPL-JOBS_LIST_PAGE]

---

*Last validated: 2026-02-06 by AI agent*
