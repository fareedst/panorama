# IMPL-COPY_ATTRS essence pseudocode

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: Shared preserveCopyAttributes() after copy completes (fs.copyFile or fs.cp); stat source then chmod + utimes on dest; each step try/catch so unsupported or denied ops do not fail the copy

## Summary contract

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: best-effort attribute preservation; copy operation success does not depend on chmod/utimes

CONTRACT Summary
  INPUT: sourcePath, destPath (dest must exist after copy completes)
  OUTPUT: dest mode and timestamps aligned with source when OS permits
  DATA: fs.stat(sourcePath); stat.mode, stat.atime, stat.mtime
  CONTROL: async; never throws to caller

## PreserveCopyAttributes

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy apply utimes and chmod from source stat; ignore per-step failures

CONTRACT PreserveCopyAttributes
  INPUT: sourcePath, destPath
  OUTPUT: side effect on dest only
  DATA: source file stat

PROCEDURE IMPL-COPY_ATTRS_PreserveCopyAttributes(sourcePath, destPath)
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

## CallSitesAfterCopyFile

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: invoke preserveCopyAttributes immediately after successful copy (fs.copyFile or fs.cp) in sync engine and files.data copy paths

CONTRACT CallSitesAfterCopyFile
  INPUT: completed copy(source, dest)
  OUTPUT: attributes preserved when supported
  DATA: src/lib/sync/operations.ts, src/lib/files.data.ts

PROCEDURE IMPL-COPY_ATTRS_CallSitesAfterCopyFile(source, dest)
  AWAIT copyFile(source, dest)
  AWAIT PreserveCopyAttributes(source, dest)

## CodeLocations

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/copyAttributes.ts — preserveCopyAttributes()
// FILE: src/lib/sync/operations.ts — called after copyFile
// FILE: src/lib/files.data.ts — called after copyFile
// FILE: src/lib/sync/engine.test.ts — mtime, atime, mode assertion after sync

## ErrorHandling

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: all failures swallowed inside procedure; copy remains successful

PROCEDURE IMPL-COPY_ATTRS_on_error(context, error)
  LOG optional diagnostic at call site only
  NEVER propagate from PreserveCopyAttributes
