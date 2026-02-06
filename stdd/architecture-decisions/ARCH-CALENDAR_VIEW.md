# [ARCH-CALENDAR_VIEW] Calendar Month View Architecture

**Cross-References**: [REQ-JOB_TRACKER_CALENDAR]  
**Status**: Planned  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

The calendar view is implemented as a hybrid server/client component architecture: a server component loads data and configuration, then passes it to a client component that renders an interactive month grid with a detail panel. The month grid displays positions on their posting dates and applications on their application dates. Clicking any item displays its details in a panel above the grid.

## Rationale

- **Server/Client Split**: Server component handles data loading (positions, applications, config), client component manages interactivity (month navigation, item selection, detail panel state)
- **Config-Driven UI**: All text, styling, and layout follow existing config patterns ([REQ-CONFIG_DRIVEN_APPEARANCE])
- **Standard Calendar Layout**: 7-column grid (Sun-Sat) provides familiar UX
- **Detail Panel Above Grid**: Keeps calendar context visible while showing item details
- **Reuses Existing Data Layer**: Uses `getPositions()`, `getApplications()` from [IMPL-JOBS_DATA] with no modifications

## Alternatives Considered

- **Modal for details**: Obscures calendar context; panel above grid is better for maintaining context
- **Full-page calendar library**: Adds dependency and complexity; custom grid is simpler and more maintainable
- **Separate route for each item**: Loses calendar context; inline detail panel is superior UX
- **Detail panel on side**: Poor mobile experience; panel above grid works on all screen sizes
- **Inline expansion in cells**: Hard to read on small cells; dedicated panel provides better space

## Implementation Approach

### Page Structure

```
src/app/jobs/calendar/
├── page.tsx              # Server component (data loading)
└── CalendarView.tsx      # Client component (interactive grid)
```

### Server Component (`page.tsx`)

**Responsibilities**:
- Load positions via `getPositions()`
- Load applications via `getApplications()`
- Load jobs config via `getJobsConfig()`
- Load theme config via `getThemeConfig()`
- Combine positions with applications (reuse logic from list page)
- Build status badge class map from theme config
- Extract calendar copy and overrides from config
- Render page shell (header, title, subtitle, back link)
- Pass serialized data to `CalendarView`

**Page Shell**:
- Header with calendar title and subtitle (from config)
- Back to list link (from config)
- `CalendarView` client component

### Client Component (`CalendarView.tsx`)

**Component Type**: Client Component (`"use client"`)

**State**:
- `currentMonth`: Date - currently displayed month
- `selectedItem`: Position | Application | null - item to show in detail panel

**Subcomponents**:
1. **Detail Panel**: Conditional render when `selectedItem` is set
   - Position details: title, postingDate, description (truncated), URLs (links), notes, edit link
   - Application details: position title, status badge, date, notes, edit link
   - Close button sets `selectedItem` to null
2. **Month Navigation**: Prev/Next buttons, month/year label, Today button
3. **Calendar Grid**: 7-column table for days of month
   - Header row with day names (Sun, Mon, Tue, etc. from config)
   - Day cells show day number + items for that date
   - Position items: neutral chip with truncated title
   - Application items: status badge colored chip with status label
   - Clicking item chip calls `setSelectedItem(...)`

**Calendar Grid Logic**:
- Calculate first day of month (determines starting column)
- Calculate number of days in month
- Fill grid with day cells (42 cells = 6 weeks × 7 days)
- Gray out days from previous/next month
- Highlight today's date (border or background)
- Match items to dates by ISO date string comparison

**Item Rendering**:
- Positions: Match `postingDate` to cell date
- Applications: Match `date` to cell date
- Multiple items per day: stack vertically in cell
- Truncate long titles to fit cell width
- Click handler stores full item object in state

### Responsive Design

**Desktop (≥768px)**:
- Grid cells spacious (80-100px)
- Item text visible in chips
- Detail panel full width above grid
- Month navigation horizontal

**Mobile (<768px)**:
- Grid cells compact (40-50px)
- Item chips show colored dots only (no text)
- Detail panel full width above grid
- Month navigation stacked or compact

### Config Integration

**Copy Keys** (in `config/jobs.yaml`):
```yaml
copy:
  calendarTitle: "Calendar View"
  calendarSubtitle: "Positions and applications by date"
  calendarPrev: "Previous"
  calendarNext: "Next"
  calendarToday: "Today"
  calendarNoItems: "No items for this day"
  calendarPositionLabel: "Position"
  calendarApplicationLabel: "Application"
  calendarDetailClose: "Close"
  calendarBackToList: "Back to List"
  calendarDayNames: "Sun,Mon,Tue,Wed,Thu,Fri,Sat"
```

**Theme Overrides** (in `config/theme.yaml`):
```yaml
jobs:
  overrides:
    calendarGrid: ""
    calendarCell: ""
    calendarCellToday: ""
    calendarItem: ""
    calendarDetailPanel: ""
```

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `src/app/jobs/calendar/page.tsx` - Calendar page server component
- [ ] `src/app/jobs/calendar/CalendarView.tsx` - Calendar view client component

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `src/app/jobs/calendar/page.test.tsx` - Page tests
- [ ] `src/app/jobs/calendar/CalendarView.test.tsx` - Component tests

## Related Decisions

- Depends on: [REQ-JOB_TRACKER_CALENDAR], [ARCH-APP_ROUTER], [ARCH-SERVER_COMPONENTS], [ARCH-CONFIG_DRIVEN_APPEARANCE], [ARCH-JOB_TRACKER_STORAGE]
- Informs: [IMPL-CALENDAR_PAGE], [IMPL-CALENDAR_GRID]
- See also: [ARCH-TAILWIND_V4], [ARCH-RESPONSIVE_FIRST]

---

*Last validated: 2026-02-06 by AI agent*
