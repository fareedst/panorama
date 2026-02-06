# [ARCH-JOB_TRACKER_UI] Job Tracker UI Architecture

**Cross-References**: [REQ-JOB_TRACKER_LIST], [REQ-JOB_TRACKER_EDIT]  
**Status**: Planned  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

The job tracker UI consists of two main pages built using Next.js App Router: a server-rendered list page displaying all positions in a table, and a client-rendered edit page with a form for creating/updating positions. Both pages use plain Tailwind CSS for styling, following the existing template design patterns.

## Rationale

- **Separation of concerns**: List page (read-only) can be server-rendered for performance; edit page (interactive) uses client components for form handling
- **Consistent with existing patterns**: Uses App Router, file-based routing, and Tailwind CSS matching the template's established patterns
- **Mobile-first responsive**: Table design adapts to smaller screens with horizontal scroll or stacking
- **Accessibility**: Semantic HTML elements (table, form) with proper labels and ARIA attributes
- **Plain Tailwind CSS**: No component library dependency; maintains template simplicity and customizability

## Alternatives Considered

- **Single-page application**: Would require more client-side state management; server rendering is better for initial load
- **Modal-based editing**: Less intuitive for multi-field forms; dedicated page provides better UX
- **shadcn/ui components**: Adds dependency; plain Tailwind keeps template lightweight
- **Card layout instead of table**: Less efficient for scanning multiple positions; table is better for data comparison
- **Inline editing**: Complex state management; separate edit page is simpler and more reliable

## Implementation Approach

### Page Structure

```
src/app/jobs/
├── page.tsx              # List view (server component)
├── edit/
│   └── [id]/
│       └── page.tsx      # Edit view (client component)
└── layout.tsx (optional) # Shared layout for jobs section
```

### List Page (`/jobs`)

**Component Type**: Server Component

**Features**:
- Load jobs config with `getJobsConfig()`
- Display in responsive table
- Color-coded status badges
- Action links (Edit, Delete)
- "New Position" button
- Empty state message

**Table Columns**:
1. Title (primary, bold)
2. Posting Date (formatted)
3. Status (badge with color)
4. Actions (Edit link)

**Status Colors**:
- `none`: gray-500
- `interested`: blue-500
- `to apply`: yellow-500
- `applied`: purple-500
- `rejected`: red-500

### Edit Page (`/jobs/edit/[id]`)

**Component Type**: Client Component (`"use client"`)

**Features**:
- Load specific job by ID (or create new with id="new")
- Form with all fields
- Client-side validation
- Submit via API route
- Success redirect to list page
- Cancel button

**Form Fields**:
1. Title (text, required)
2. Posting Date (date, required)
3. URLs (textarea, one per line)
4. Description (textarea)
5. Application Status (dropdown)
6. Status Date (date, optional)
7. Status Notes (textarea)
8. General Notes (textarea)

**Form Layout**:
- Single column on mobile
- Labels above inputs
- Clear visual hierarchy
- Submit and Cancel buttons at bottom

### Responsive Design

**Desktop (≥768px)**:
- Full table with all columns
- Horizontal layout
- Fixed-width action column

**Mobile (<768px)**:
- Horizontal scroll for table OR
- Stacked card layout (alternative)
- Touch-friendly tap targets (44px minimum)

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `src/app/jobs/page.tsx` - Jobs list page
- [ ] `src/app/jobs/edit/[id]/page.tsx` - Job edit page

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `src/app/jobs/page.test.tsx` - List page tests
- [ ] `src/app/jobs/edit/[id]/page.test.tsx` - Edit page tests

## Related Decisions

- Depends on: [REQ-JOB_TRACKER_LIST], [REQ-JOB_TRACKER_EDIT], [ARCH-APP_ROUTER], [ARCH-SERVER_COMPONENTS]
- Informs: [IMPL-JOBS_LIST_PAGE], [IMPL-JOBS_EDIT_PAGE]
- See also: [ARCH-TAILWIND_V4], [ARCH-RESPONSIVE_FIRST]

---

*Last validated: 2026-02-06 by AI agent*
