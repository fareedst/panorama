# IMPL-FILES_UTILS essence pseudocode

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Client-safe file utilities module — no Node.js imports; formatSize for display; consumed by FilePane and other client components; server re-exports via files.data for backward compatibility

## Summary contract

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: isolate display helpers from fs/promises so client bundle never pulls server filesystem code

CONTRACT Summary
  INPUT: byte counts (formatSize scope for this IMPL)
  OUTPUT: human-readable size strings
  DATA: no fs/path/os dependencies in this module
  CONTROL: client components import from files.utils.ts; files.data.ts re-exports formatSize only

## FormatSize

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: binary scale 1024; units B through TB; zero returns "0 B"; sub-KB shows integer B; larger uses one decimal place

CONTRACT FormatSize
  INPUT: bytes number
  OUTPUT: formatted string e.g. "0 B", "500 B", "1.0 KB", "1.5 MB", "1.0 GB", "1.0 TB"

PROCEDURE IMPL-FILES_UTILS_formatSize(bytes)
  IF bytes equals 0 THEN RETURN "0 B"
  i := floor(log(bytes) / log(1024))
  IF i equals 0 THEN RETURN "{bytes} B"
  size := bytes / 1024^i
  RETURN "{size toFixed(1)} {units[i]}"

## ClientServerBoundary

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: formatSize moved from files.data.ts; files.data re-exports; client UI imports files.utils directly

CONTRACT ClientServerBoundary
  INPUT: module import graph
  OUTPUT: client bundle excludes fs/promises
  DATA: files.utils.ts (client-safe), files.data.ts re-export line

PROCEDURE IMPL-FILES_UTILS_ClientServerBoundary()
  ASSERT files.utils.ts has no Node built-in imports
  ASSERT FilePane and client tests import formatSize from files.utils
  ASSERT files.data.ts exports formatSize from files.utils for server callers

## CodeLocations

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — formatSize and other client-safe helpers
// FILE: src/lib/files.utils.test.ts — formatSize unit tests (describe formatSize - REQ_FILE_LISTING)
// FILE: src/lib/files.data.ts — re-export formatSize

## ErrorHandling

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: pure functions; no recoverable runtime errors beyond numeric input (callers pass file sizes from FileStat)

PROCEDURE IMPL-FILES_UTILS_on_error(context, error)
  NOT APPLICABLE — synchronous formatting only
