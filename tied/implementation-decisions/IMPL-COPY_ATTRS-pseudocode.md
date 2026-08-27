# IMPL-COPY_ATTRS essence pseudocode

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: Shared preserveCopyAttributes() after copy completes (fs.copyFile or fs.cp); stat source then chmod + utimes on dest; each step try/catch so unsupported or denied ops do not fail the copy

## Summary contract

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: best-effort attribute preservation; copy operation success does not depend on chmod/utimes

```
IMPL-COPY_ATTRS_Summary():
  INPUT: sourcePath, destPath (dest must exist after copy completes)
  OUTPUT: dest mode and timestamps aligned with source when OS permits
  DATA: fs.stat(sourcePath); stat.mode, stat.atime, stat.mtime
  PRE: copy completed; dest exists
  POST: dest attributes aligned when OS permits OR silently unchanged
  EFFECTS: IO
  CONTROL: async; never throws to caller
  TERMINATION: total
```

## PreserveCopyAttributes

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy apply utimes and chmod from source stat; ignore per-step failures

```
IMPL-COPY_ATTRS_PreserveCopyAttributes(sourcePath, destPath):
  INPUT: sourcePath, destPath
  OUTPUT: side effect on dest only
  DATA: source file stat
  PRE: dest exists after copy
  POST: chmod and utimes applied when supported OR failures ignored
  EFFECTS: IO
  FAILURE_MODES: stat/chmod/utimes errors swallowed; never throws
  TERMINATION: total
  TRY
    stat := STAT sourcePath
    IF stat is not a regular file THEN RETURN
    TRY
      CHMOD destPath with stat.mode
    ON error
      IGNORE
    TRY
      UTIMES destPath with stat.atime, stat.mtime
    ON error
      IGNORE
  ON stat error
    IGNORE
```

## CallSitesAfterCopyFile

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: invoke preserveCopyAttributes immediately after successful copy (fs.copyFile or fs.cp) in sync engine and files.data copy paths

```
IMPL-COPY_ATTRS_CallSitesAfterCopyFile(source, dest):
  INPUT: completed copy(source, dest)
  OUTPUT: attributes preserved when supported
  DATA: src/lib/sync/operations.ts, src/lib/files.data.ts
  PRE: copyFile or fs.cp succeeded
  POST: PreserveCopyAttributes invoked
  EFFECTS: IO
  TERMINATION: total
  AWAIT copyFile(source, dest)
  AWAIT PreserveCopyAttributes(source, dest)
```

## CodeLocations

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/copyAttributes.ts — preserveCopyAttributes()
// FILE: src/lib/sync/operations.ts — called after copyFile
// FILE: src/lib/files.data.ts — called after copyFile
// FILE: src/lib/sync/engine.test.ts — mtime, atime, mode assertion after sync

## ErrorHandling

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: all failures swallowed inside procedure; copy remains successful

```
IMPL-COPY_ATTRS_on_error(context, error):
  INPUT: error from chmod/utimes/stat inside PreserveCopyAttributes
  OUTPUT: no propagation; copy remains successful
  PRE: error inside attribute preservation
  POST: error ignored; optional diagnostic at call site only
  EFFECTS: none
  TERMINATION: total
  LOG optional diagnostic at call site only
  NEVER propagate from PreserveCopyAttributes
```
