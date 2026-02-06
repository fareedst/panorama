# [IMPL-JOBS_LIST_PAGE] Jobs List Page Implementation

**Cross-References**: [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement the jobs list page as a Next.js server component at `src/app/jobs/page.tsx` that loads job position data and displays it in a responsive table with color-coded status badges, action links, and an empty state.

## Rationale

- Server component enables fast initial page load with pre-rendered data
- Table format provides efficient overview of multiple positions
- Color coding helps users quickly identify application status
- Responsive design works on all device sizes
- Empty state guides users to create their first position

## Implementation Approach

### Page Component Structure

**File**: `src/app/jobs/page.tsx`

```typescript
import { getPositions, getApplications } from "../../lib/jobs.data";
import type { PositionWithStatus } from "../../lib/jobs.types";
import JobsTable from "./components/JobsTable";
import Link from "next/link";

/**
 * Jobs list page - displays all job positions in a table
 * [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]
 */
export default function JobsPage() {
  const positions = getPositions();
  const applications = getApplications();

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Job Search Tracker
          </h1>
          <Link
            href="/jobs/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Position
          </Link>
        </div>

        {/* Table */}
        <JobsTable positions={positionsWithStatus} />
      </div>
    </div>
  );
}
```

### Jobs Table Component

**File**: `src/app/jobs/components/JobsTable.tsx`

```typescript
import type { PositionWithStatus } from "../../../lib/jobs.types";
import Link from "next/link";

/**
 * Responsive table displaying job positions
 * [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]
 */
export default function JobsTable({ positions }: { positions: PositionWithStatus[] }) {
  return (
    <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Posted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {positions.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Job Row Component

```typescript
/**
 * Single job position table row
 * [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]
 */
function JobRow({ job }: { job: JobPosition }) {
  const formattedDate = new Date(job.postingDate).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {job.title}
        </div>
        {job.urls.length > 0 && (
          <a
            href={job.urls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View posting →
          </a>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {formattedDate}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={job.applicationStatus.status} />
      </td>
      <td className="px-6 py-4 text-right text-sm">
        <Link
          href={`/jobs/edit/${job.id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}
```

### Status Badge Component

```typescript
/**
 * Color-coded status badge
 * [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_STATUS]
 */
function StatusBadge({ status }: { status: ApplicationStatusType }) {
  const styles: Record<ApplicationStatusType, string> = {
    none: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    interested: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "to apply": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    applied: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  const labels: Record<ApplicationStatusType, string> = {
    none: "None",
    interested: "Interested",
    "to apply": "To Apply",
    applied: "Applied",
    rejected: "Rejected",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
```

### Empty State Component

```typescript
/**
 * Empty state when no positions exist
 * [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]
 */
function EmptyState() {
  return (
    <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No job positions yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Start tracking your job search by adding your first position
      </p>
      <Link
        href="/jobs/edit/new"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Your First Position
      </Link>
    </div>
  );
}
```

### Responsive Considerations

**Desktop (≥768px)**:
- Full table with all columns visible
- Hover effects on rows
- Adequate padding for readability

**Mobile (<768px)**:
- Horizontal scroll enabled on table
- Touch-friendly spacing (min 44px tap targets)
- Consider alternative: card layout for very small screens

## Code Markers

- `src/app/jobs/page.tsx`: Jobs list page component (server component)
- `src/app/jobs/components/JobsTable.tsx`: Table component rendering positions with status
- `src/app/jobs/page.test.tsx`: Page component tests (to be added)

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/app/jobs/page.tsx` - `[IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]`
- [x] `src/app/jobs/components/JobsTable.tsx` - `[IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]`
- [ ] `src/app/jobs/page.test.tsx` - `[REQ-JOB_TRACKER_LIST] [IMPL-JOBS_LIST_PAGE]`

## Related Decisions

- Depends on: [ARCH-JOB_TRACKER_UI], [IMPL-JOBS_DATA]
- Informs: UI patterns for other list views
- See also: [IMPL-JOBS_EDIT_PAGE]

---

*Last validated: 2026-02-06 by AI agent*
