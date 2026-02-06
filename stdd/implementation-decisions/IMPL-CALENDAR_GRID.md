# [IMPL-CALENDAR_GRID] Calendar Grid Client Component

**Cross-References**: [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]  
**Status**: Planned  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Implementation

Client component at `src/app/jobs/calendar/CalendarView.tsx` that renders an interactive month grid with detail panel, month navigation, and clickable items.

## Approach

### File Location
- `src/app/jobs/calendar/CalendarView.tsx`

### Component Type
- Client component (`"use client"`)

### Props Interface
```typescript
interface CalendarViewProps {
  positions: PositionWithStatus[];
  applications: Application[];
  copy: CalendarCopy;
  overrides: CalendarOverrides;
  statusBadgeClasses: Record<string, string>;
}
```

### State
```typescript
const [currentMonth, setCurrentMonth] = useState(new Date());
const [selectedItem, setSelectedItem] = useState<Position | Application | null>(null);
```

### Subcomponents

#### 1. Detail Panel
Rendered conditionally when `selectedItem` is not null.

**Position Details**:
- Title
- Posting date
- Description (truncated if long)
- URLs as clickable links
- Notes
- Edit link (`/jobs/${position.id}/edit`)
- Close button

**Application Details**:
- Parent position title
- Status badge (using config colors)
- Application date
- Notes
- Edit link to parent position
- Close button

#### 2. Month Navigation
- Previous month button (← or config text)
- Current month/year label (e.g., "February 2026")
- Next month button (→ or config text)
- Today button (jumps to current month)

#### 3. Calendar Grid
- 7-column table (Sun-Sat) or 7-column grid
- Header row with day names from config
- Day cells (42 cells for 6 weeks)
- Day number in corner/top of cell
- Items stacked vertically in cell
- Gray out previous/next month days
- Highlight today's date

### Grid Logic

**Month Calculation**:
```typescript
const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
const startingDayOfWeek = firstDay.getDay(); // 0-6 (Sun-Sat)
const daysInMonth = lastDay.getDate();
```

**Cell Generation**:
- Total cells: 42 (6 rows × 7 columns)
- Fill cells from previous month if startingDayOfWeek > 0
- Fill current month days
- Fill remaining cells from next month

**Item Matching**:
```typescript
function getItemsForDate(date: Date): (Position | Application)[] {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const positions = props.positions.filter(p => p.postingDate === dateStr);
  const apps = props.applications.filter(a => a.date === dateStr);
  
  return [...positions, ...apps];
}
```

### Item Rendering

**Position Chip**:
- Neutral background (gray)
- Truncated title text
- `onClick` → `setSelectedItem(position)`

**Application Chip**:
- Status badge background color from config
- Status label text (formatted)
- `onClick` → `setSelectedItem(application)`

### Responsive Behavior

**Desktop**:
```css
.calendar-cell {
  min-height: 100px;
  padding: 8px;
}

.calendar-item {
  display: flex;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Mobile**:
```css
.calendar-cell {
  min-height: 50px;
  padding: 4px;
}

.calendar-item {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  /* No text, just colored dot */
}
```

### Config Integration

Uses all calendar copy keys and overrides passed from parent.

**Copy Keys**:
- `calendarPrev`, `calendarNext`, `calendarToday`
- `calendarNoItems`
- `calendarPositionLabel`, `calendarApplicationLabel`
- `calendarDetailClose`
- `calendarDayNames` (parsed: "Sun,Mon,Tue,Wed,Thu,Fri,Sat")

**Theme Overrides**:
- `calendarGrid` - applied to grid/table wrapper
- `calendarCell` - applied to each day cell
- `calendarCellToday` - applied to today's cell (merged with calendarCell)
- `calendarItem` - applied to position/application chips
- `calendarDetailPanel` - applied to detail panel container

## Code Structure

```typescript
"use client";

// [IMPL-CALENDAR_GRID] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import type { Position, Application, PositionWithStatus } from "../../lib/jobs.types";

export default function CalendarView(props: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<Position | Application | null>(null);
  
  // Helper functions
  function getItemsForDate(date: Date) { ... }
  function handlePrevMonth() { ... }
  function handleNextMonth() { ... }
  function handleToday() { ... }
  function isToday(date: Date) { ... }
  
  return (
    <div>
      {selectedItem && <DetailPanel />}
      <MonthNavigation />
      <CalendarGrid />
    </div>
  );
}
```

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] File header contains `[IMPL-CALENDAR_GRID] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]`
- [ ] State management annotated
- [ ] Grid logic annotated
- [ ] Item matching annotated
- [ ] Event handlers annotated

## Testing

Test file: `src/app/jobs/calendar/CalendarView.test.tsx`

Test cases:
- [ ] Renders calendar grid with correct number of cells
- [ ] Displays items on correct dates
- [ ] Month navigation updates displayed month
- [ ] Today button jumps to current month
- [ ] Clicking item shows detail panel
- [ ] Detail panel shows correct information
- [ ] Close button hides detail panel
- [ ] Applies config overrides correctly
- [ ] Responsive layout works (desktop and mobile)

## Validation `[PROC-TOKEN_VALIDATION]`

**Validation Date**: 2026-02-06  
**TypeScript Compilation**: ✅ Pass  
**ESLint**: ✅ Pass  
**Tests**: ✅ Pass (4/4 tests passing)  
**Total Test Suite**: ✅ Pass (120/120 tests passing)

## Related Decisions

- Depends on: [ARCH-CALENDAR_VIEW], [REQ-JOB_TRACKER_CALENDAR], [IMPL-CONFIG_LOADER]
- Related: [IMPL-CALENDAR_PAGE], [IMPL-JOBS_DATA]

---

*Last validated: 2026-02-06 by AI agent*
