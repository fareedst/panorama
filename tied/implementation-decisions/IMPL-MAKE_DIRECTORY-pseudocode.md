# IMPL-MAKE_DIRECTORY essence pseudocode

// [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: Top-level — path resolution and bulk mkdir data layer

## BuildMakeDirectoryEntries

// [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — trim dirname; reject via validateRenameBasename; join pane.path with dirname per target

```
IMPL-MAKE_DIRECTORY_BuildMakeDirectoryEntries(paneTarget, dirname, initiatingPaneIndex, panes):
  INPUT: paneTarget (thisPane | allPanes), dirname string, initiatingPaneIndex, panes[] with path
  OUTPUT: MakeDirectoryEntry[] { paneIndex, path } — empty when basename invalid
  PRE: panes array available; dirname non-empty after trim when valid
  POST: returns one entry per target pane with joined absolute path or empty when invalid
  EFFECTS: pure
  FAILURE_MODES: INVALID_BASENAME; MISSING_PANE
  TERMINATION: total
  trimmed = trim(dirname)
  IF NOT validateRenameBasename(trimmed) THEN RETURN []
  IF paneTarget == "thisPane" THEN
    pane = panes[initiatingPaneIndex]
    IF NOT pane THEN RETURN []
    RETURN [{ paneIndex: initiatingPaneIndex, path: join(pane.path, trimmed) }]
  RETURN panes.map((pane, paneIndex) => ({ paneIndex, path: join(pane.path, trimmed) }))
```

## MakeDirectory

// [IMPL-MAKE_DIRECTORY] [IMPL-FILES_DATA] [REQ-DIRECTORY_NAVIGATION]: how — fs.mkdir non-recursive single level

```
IMPL-MAKE_DIRECTORY_MakeDirectory(dirPath):
  INPUT: dirPath absolute path
  OUTPUT: directory created at dirPath
  PRE: dirPath valid; parent directory exists
  POST: single-level directory exists at dirPath
  EFFECTS: IO
  FAILURE_MODES: MKDIR_FAILED; PATH_EXISTS
  TERMINATION: total
  AWAIT fs.mkdir(dirPath, { recursive: false })
```

## BulkMakeDirectory

// [IMPL-MAKE_DIRECTORY] [IMPL-FILES_DATA] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: how — Promise.allSettled per entry like bulkTouch

```
IMPL-MAKE_DIRECTORY_BulkMakeDirectory(entries):
  INPUT: entries[] { path }
  OUTPUT: { successCount, errorCount, errors[] }
  PRE: entries array non-empty with valid paths
  POST: aggregated success and error counts from allSettled per entry
  EFFECTS: IO
  DATA_TRANSITION: directories created for successful entries; failures recorded in errors[]
  TERMINATION: total
  FOR EACH entry IN entries AWAIT makeDirectory(entry.path) with allSettled aggregation
```

## CodeLocations

// [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: map implementing and verifying source files for this IMPL

// FILE: src/lib/make-directory.ts — buildMakeDirectoryEntries
// FILE: src/lib/files.data.ts — makeDirectory, bulkMakeDirectory
// FILE: src/app/api/files/route.ts — bulk-mkdir API route case
// FILE: src/lib/make-directory.test.ts — buildMakeDirectoryEntries tests
// FILE: src/lib/make-directory.data.test.ts — makeDirectory and bulkMakeDirectory tests
