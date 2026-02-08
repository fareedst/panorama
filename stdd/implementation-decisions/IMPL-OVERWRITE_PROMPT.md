# [IMPL-OVERWRITE_PROMPT] Overwrite Confirmation with File Comparison

**Category**: Implementation Decision  
**Status**: ✅ Implemented  
**Created**: 2026-02-08  
**Last Updated**: 2026-02-08

---

## Decision

Implement an enhanced overwrite confirmation prompt for copy and move operations that displays existing file attributes, source file attributes, and a clear comparison before the user confirms the operation.

## Context

The initial bulk file operations implementation ([IMPL-BULK_OPS]) showed a simple confirmation dialog with only the destination directory path. When files with matching names exist in the target directory, the backend silently overwrites them via `fs.copyFile` or `fs.rename`. This provides no visibility into what will be replaced, making it easy to accidentally overwrite newer or larger files.

[REQ-BULK_FILE_OPS] listed "overwrite confirmation for copy/move" as a future enhancement. This implementation fulfills that requirement by:
- Detecting file conflicts before showing the confirmation dialog
- Displaying detailed information about both existing and source files
- Providing a comparison summary (size and time differences)

## Implementation Details

### Conflict Detection

Before opening the confirm dialog, both `handleBulkCopy` and `handleBulkMove` in `WorkspaceView.tsx`:
1. Iterate through all source file paths from `getOperationFiles()`
2. Extract the basename using `path.basename()` from `path-browserify`
3. Search the destination pane's file list for matching names
4. For each match, build a `FileConflict` object with formatted details

**No additional API calls** are needed - all file stats are already loaded in both panes.

### Comparison Logic

The `describeFileComparison()` utility in `src/lib/files.utils.ts`:
- Formats file sizes using existing `formatSize()` helper
- Formats modification times using existing `formatDateTime()` helper
- Compares sizes: reports "Same size" | "Source larger (by X)" | "Source smaller (by X)"
- Compares times: reports "same date" (within 1 second) | "source newer" | "source older"
- Returns a single-line comparison string: `"<size comparison>, <time comparison>"`

Timestamps are normalized (handling both Date objects and ISO strings from JSON serialization) before comparison to account for mtime serialization.

### ConfirmDialog Enhancement

Extended `ConfirmDialog.tsx` component API:
- Added optional `conflicts?: FileConflict[]` prop
- `FileConflict` interface:
  ```typescript
  interface FileConflict {
    name: string;
    existingSummary: string;  // "400 B, 2024-01-15 10:00:00"
    sourceSummary: string;    // "500 B, 2024-02-01 10:00:00"
    comparison: string;        // "Source larger (by 100 B), source newer"
  }
  ```
- When `conflicts` array is present:
  - Dialog width increases to `max-w-2xl` (from `max-w-md`) to accommodate details
  - Yellow warning section displays below the main message
  - Conflicts rendered in scrollable container (`max-h-48 overflow-y-auto`)
  - Each conflict shows filename, existing/source labels, and comparison text

### Message Construction

When conflicts exist:
- Base message: `"Copy/Move N file(s) to:\n<destDir>\n\nN file(s) will be overwritten."`
- Conflict details section shows individual file comparisons

When no conflicts:
- Simple message: `"Copy/Move N file(s) to:\n<destDir>"`
- No conflict section

## Dependencies

- `path-browserify`: Required for `path.basename()` in browser environment (installed as part of this implementation)
- Existing `formatSize()` and `formatDateTime()` from `@/lib/files.utils`
- Existing pane file lists (no new API endpoints)

## Alternatives Considered

**Option A - String-only message (minimal change)**:
- Keep ConfirmDialog unchanged, build conflict details as formatted string
- Pros: No component API changes
- Cons: Poor readability for multiple conflicts, harder to scan

**Option B - Rich overwrite section (chosen)**:
- Extend ConfirmDialog with structured conflict data
- Pros: Clear layout, scrollable for many conflicts, consistent formatting
- Cons: Slight component API extension

Option B was chosen for better UX, especially when multiple files conflict.

## Traceability

- **Requirement**: [REQ-BULK_FILE_OPS] (Overwrite confirmation feature)
- **Architecture**: [ARCH-BATCH_OPERATIONS]
- **Related**: [IMPL-BULK_OPS], [IMPL-FILES_DATA]
- **Tests**: `src/app/files/BulkOperations.test.tsx` (overwrite prompt tests)
- **Code**:
  - `src/app/files/WorkspaceView.tsx` - Conflict detection in handleBulkCopy and handleBulkMove
  - `src/app/files/components/ConfirmDialog.tsx` - FileConflict interface and rendering
  - `src/lib/files.utils.ts` - describeFileComparison() utility

## Validation

- ✅ Unit test: Copy with single conflicting file shows comparison
- ✅ Unit test: Move with single conflicting file shows comparison
- ✅ Unit test: Copy with no conflicts shows no overwrite section
- ✅ Unit test: Copy with multiple conflicts shows all comparisons
- ✅ Manual verification: Comparison text accurately describes size and time differences

## Notes

- Filesystem timestamp precision: Times within 1 second are considered equal
- Directories can also trigger conflicts if the destination has a directory with the same name
- The backend still performs the actual overwrite; this enhancement only affects the confirmation UX
- Future enhancement: Could add a "Don't ask again" checkbox or per-file overwrite choices

---

*Implemented*: 2026-02-08  
*Implemented by*: AI Agent
