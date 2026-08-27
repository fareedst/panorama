# IMPL-FILES_UTILS essence pseudocode

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Client-safe file utilities module — no Node.js imports; formatSize for display; consumed by FilePane and other client components; server re-exports via files.data for backward compatibility

## Summary contract

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: isolate display helpers from fs/promises so client bundle never pulls server filesystem code

```
IMPL-FILES_UTILS_Summary():
  INPUT: byte counts (formatSize scope for this IMPL)
  OUTPUT: human-readable size strings
  DATA: no fs/path/os dependencies in this module
  PRE: client-safe module loaded
  POST: display helpers available without Node built-ins
  EFFECTS: pure
  CONTROL: client components import from files.utils.ts; files.data.ts re-exports formatSize only
  TERMINATION: total
```

## FormatSize

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: binary scale 1024; units B through TB; zero returns "0 B"; sub-KB shows integer B; larger uses one decimal place

```
IMPL-FILES_UTILS_formatSize(bytes):
  INPUT: bytes number
  OUTPUT: formatted string e.g. "0 B", "500 B", "1.0 KB", "1.5 MB", "1.0 GB", "1.0 TB"
  PRE: numeric byte count
  POST: human-readable size string
  EFFECTS: pure
  TERMINATION: total
  IF bytes equals 0 THEN RETURN "0 B"
  i := floor(log(bytes) / log(1024))
  IF i equals 0 THEN RETURN "{bytes} B"
  size := bytes / 1024^i
  RETURN "{size toFixed(1)} {units[i]}"
```

## ClientServerBoundary

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: formatSize moved from files.data.ts; files.data re-exports; client UI imports files.utils directly

```
IMPL-FILES_UTILS_ClientServerBoundary():
  INPUT: module import graph
  OUTPUT: client bundle excludes fs/promises
  DATA: files.utils.ts (client-safe), files.data.ts re-export line
  PRE: build graph analyzed
  POST: client bundle has no Node fs imports via this module
  EFFECTS: pure
  TERMINATION: total
  ASSERT files.utils.ts has no Node built-in imports
  ASSERT FilePane and client tests import formatSize from files.utils
  ASSERT files.data.ts exports formatSize from files.utils for server callers
```

## CodeLocations

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — formatSize and other client-safe helpers
// FILE: src/lib/files.utils.test.ts — formatSize unit tests (describe formatSize - REQ_FILE_LISTING)
// FILE: src/lib/files.data.ts — re-export formatSize

## ErrorHandling

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: pure functions; no recoverable runtime errors beyond numeric input (callers pass file sizes from FileStat)

```
IMPL-FILES_UTILS_on_error(context, error):
  INPUT: n/a — synchronous formatting only
  OUTPUT: n/a
  PRE: NOT APPLICABLE
  POST: NOT APPLICABLE
  EFFECTS: none
  TERMINATION: total
  NOT APPLICABLE — synchronous formatting only
```
