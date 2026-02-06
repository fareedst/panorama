# [IMPL-JOBS_EDIT_PAGE] Jobs Edit Page Implementation

**Cross-References**: [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement the job edit page as a Next.js server component at `src/app/jobs/[id]/edit/page.tsx` for editing existing positions, and a create page at `src/app/jobs/new/page.tsx` for new positions. Forms use Server Actions for mutations and are split into PositionForm (position details) and ApplicationForm (application status).

## Rationale

- Server components enable faster initial page load with pre-fetched data
- Separate routes `/jobs/new` and `/jobs/[id]/edit` clarify intent
- Server Actions for mutations provide type safety without API routes
- Split forms (PositionForm + ApplicationForm) separate concerns
- Delete button allows removing positions from edit page

## Implementation Approach

### Edit Page Component

**File**: `src/app/jobs/[id]/edit/page.tsx`

```typescript
import { getPositionById, getApplicationsByPositionId } from "../../../../lib/jobs.data";
import PositionForm from "../../components/PositionForm";
import ApplicationForm from "../../components/ApplicationForm";
import DeletePositionButton from "../../components/DeletePositionButton";
import Link from "next/link";

/**
 * Job edit page - form for updating existing positions
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
 */
export default async function EditPositionPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const position = getPositionById(id);
  const applications = getApplicationsByPositionId(id);
  
  const [job, setJob] = useState<JobPosition>({
    id: params.id,
    title: "",
    postingDate: "",
    urls: [],
    description: "",
    applicationStatus: {
      status: "none",
      date: null,
      notes: "",
    },
    notes: "",
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing job if editing
  useEffect(() => {
    if (!isNew) {
      loadJob(params.id);
    }
  }, [params.id, isNew]);

  async function loadJob(id: string) {
    // Fetch job data from API or config
    // Set job state
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Validate required fields
    if (!job.title || !job.postingDate) {
      setError("Title and posting date are required");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save job");
      }
      
      router.push("/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/jobs");
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {isNew ? "Add New Position" : "Edit Position"}
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <JobEditForm job={job} setJob={setJob} />
          
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? "Saving..." : "Save Position"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Create Page Component

**File**: `src/app/jobs/new/page.tsx`

```typescript
import PositionForm from "../components/PositionForm";

/**
 * Job create page - form for creating new positions
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
 */
export default function NewPositionPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Add New Position
        </h1>
        <PositionForm />
      </div>
    </div>
  );
}
```

### Position Form Component

**File**: `src/app/jobs/components/PositionForm.tsx`

```typescript
"use client";

import { createPosition, updatePosition } from "../actions";
import type { Position } from "../../../lib/jobs.types";

/**
 * Form for position fields (title, date, URLs, description, notes)
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
 */
export default function PositionForm({ position }: { position?: Position }) {
  return (
    <>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Position Title *
        </label>
        <input
          type="text"
          value={job.title}
          onChange={(e) => setJob({ ...job, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Posting Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Posting Date *
        </label>
        <input
          type="date"
          value={job.postingDate}
          onChange={(e) => setJob({ ...job, postingDate: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URLs (one per line)
        </label>
        <textarea
          value={job.urls.join("\n")}
          onChange={(e) => setJob({ 
            ...job, 
            urls: e.target.value.split("\n").filter(u => u.trim()) 
          })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://company.com/careers/job-123"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={job.description}
          onChange={(e) => setJob({ ...job, description: e.target.value })}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Application Status */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Application Status
        </h3>
        
        <div className="space-y-4">
          {/* Status Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={job.applicationStatus.status}
              onChange={(e) => setJob({
                ...job,
                applicationStatus: {
                  ...job.applicationStatus,
                  status: e.target.value as ApplicationStatusType,
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">None</option>
              <option value="interested">Interested</option>
              <option value="to apply">To Apply</option>
              <option value="applied">Applied</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Status Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Date
            </label>
            <input
              type="date"
              value={job.applicationStatus.date || ""}
              onChange={(e) => setJob({
                ...job,
                applicationStatus: {
                  ...job.applicationStatus,
                  date: e.target.value || null,
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Notes
            </label>
            <textarea
              value={job.applicationStatus.notes}
              onChange={(e) => setJob({
                ...job,
                applicationStatus: {
                  ...job.applicationStatus,
                  notes: e.target.value,
                }
              })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* General Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          General Notes
        </label>
        <textarea
          value={job.notes}
          onChange={(e) => setJob({ ...job, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );
}
```

### Loading State Component

```typescript
/**
 * Loading state while fetching job data
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI]
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Loading...</div>
    </div>
  );
}
```

### Application Form Component

**File**: `src/app/jobs/components/ApplicationForm.tsx`

```typescript
"use client";

import { createApplication, updateApplication, deleteApplication } from "../actions";
import type { Application, ApplicationStatus } from "../../../lib/jobs.types";

/**
 * Form for application status (status, date, notes)
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
 */
export default function ApplicationForm({ 
  positionId, 
  applications 
}: { 
  positionId: string; 
  applications: Application[] 
}) {
  // Renders list of applications with edit/delete buttons
  // Plus a form to add new application status
}
```

### Delete Button Component

**File**: `src/app/jobs/components/DeletePositionButton.tsx`

```typescript
"use client";

import { deletePosition } from "../actions";

/**
 * Delete button for removing position
 * [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
 */
export default function DeletePositionButton({ positionId }: { positionId: string }) {
  // Calls deletePosition server action with confirmation
}
```

## Code Markers

- `src/app/jobs/[id]/edit/page.tsx`: Job edit page (server component)
- `src/app/jobs/new/page.tsx`: Job create page (server component)
- `src/app/jobs/components/PositionForm.tsx`: Position fields form (client component)
- `src/app/jobs/components/ApplicationForm.tsx`: Application status form (client component)
- `src/app/jobs/components/DeletePositionButton.tsx`: Delete button (client component)

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/app/jobs/[id]/edit/page.tsx` - `[IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]`
- [x] `src/app/jobs/new/page.tsx` - `[IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]`
- [x] `src/app/jobs/components/PositionForm.tsx` - `[IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]`
- [x] `src/app/jobs/components/ApplicationForm.tsx` - `[IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]`
- [x] `src/app/jobs/components/DeletePositionButton.tsx` - `[IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]`

## Related Decisions

- Depends on: [ARCH-JOB_TRACKER_UI], [IMPL-JOBS_DATA], [IMPL-JOBS_ACTIONS]
- Informs: Form patterns for other edit views
- See also: [IMPL-JOBS_LIST_PAGE]

---

*Last validated: 2026-02-06 by AI agent*
