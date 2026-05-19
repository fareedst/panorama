# IMPL-FILES_UTILS essence pseudocode

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Top-level Client-Safe File Utilities: Created separate files.utils.ts for client-safe utilities like formatSize

## Summary contract

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILES_UTILS
  DATA: state and configuration per implementation_approach

## ClientComponentsFilePaneImport

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Client components (FilePane) import from files.utils.ts

CONTRACT ClientComponentsFilePaneImport
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_UTILS_ClientComponentsFilePaneImport(context)
  // Client components (FilePane) import from files.utils.ts
  CALL Client components (FilePane) import from files.utils.ts
  ON invalid input OR missing data THEN RETURN without mutation

## CreatedSrcLibFiles

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Created src/lib/files.utils.ts with no Node.js dependencies

CONTRACT CreatedSrcLibFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_UTILS_CreatedSrcLibFiles(context)
  // Created src/lib/files.utils.ts with no Node.js dependencies
  CALL Created src/lib/files.utils.ts with no Node.js dependencies
  ON invalid input OR missing data THEN RETURN without mutation

## FilesDataTsRe

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: files.data.ts re-exports formatSize for server-side consumers

CONTRACT FilesDataTsRe
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_UTILS_FilesDataTsRe(context)
  // files.data.ts re-exports formatSize for server-side consumers
  CALL files.data.ts re-exports formatSize for server-side consumers
  ON invalid input OR missing data THEN RETURN without mutation

## MovedFormatSizeFromFiles

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: Moved formatSize() from files.data.ts to files.utils.ts

CONTRACT MovedFormatSizeFromFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_UTILS_MovedFormatSizeFromFiles(context)
  // Moved formatSize() from files.data.ts to files.utils.ts
  CALL Moved formatSize() from files.data.ts to files.utils.ts
  ON invalid input OR missing data THEN RETURN without mutation

## ThisPreventsFsPromises

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: This prevents fs/promises from being pulled into client bundle

CONTRACT ThisPreventsFsPromises
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_UTILS_ThisPreventsFsPromises(context)
  // This prevents fs/promises from being pulled into client bundle
  CALL This prevents fs/promises from being pulled into client bundle
  ON invalid input OR missing data THEN RETURN without mutation

## CodeLocations

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — Client-safe utilities (no Node.js dependencies)
// FUNCTION: formatSize in src/lib/files.utils.ts

## ErrorHandling

// [IMPL-FILES_UTILS] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILES_UTILS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
