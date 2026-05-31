# IMPL-RENAME_REGEX essence pseudocode

<!-- [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS] [REQ-FILE_SEARCH]: Top-level — shared regex validation, basename transform, path resolution, bulkRename data layer, bulk-rename API -->

```
FUNCTION validateRegex(pattern):
  // [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — length cap 500, compile test, ReDoS heuristics for nested repetition and many groups
  IF pattern.length > 500: RETURN { valid: false, error: "Pattern too long" }
  TRY new RegExp(pattern) CATCH RETURN { valid: false, error: "Invalid regex pattern" }
  IF dangerous nested repetition OR many groups: RETURN { valid: false, error: "Potentially dangerous regex pattern" }
  RETURN { valid: true }

FUNCTION validateRenameBasename(name):
  // [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — reject empty, dot names, and path separators in result basename
  IF NOT name OR name == "." OR name == "..": RETURN false
  IF name contains "/" OR "\\": RETURN false
  RETURN true

FUNCTION computeRenamedBasename(name, pattern, replacement):
  // [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — String.replace(RegExp(pattern), replacement); skip invalid pattern, no match, or unchanged result
  IF validateRegex(pattern) invalid: RETURN null
  newName = name.replace(new RegExp(pattern), replacement)
  IF newName == name OR NOT validateRenameBasename(newName): RETURN null
  RETURN newName

FUNCTION buildRenameRegexEntries(paneTarget, pattern, replacement, initiatingPaneIndex, paneFilesList, marks, contextFile):
  // [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — resolve basenames/paths via touch-file helpers; dedupe src; build { src, dest }
  basenames = resolveTouchBasenames(marks, contextFile)
  paths = resolveTouchPaths(paneTarget, initiatingPaneIndex, paneFilesList, basenames)
  FOR EACH unique path:
    newBasename = computeRenamedBasename(basename(path), pattern, replacement)
    IF newBasename: entries.push({ src: path, dest: join(dirname(path), newBasename) })
  RETURN entries

FUNCTION bulkRename(entries):
  // [IMPL-RENAME_REGEX] [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how — Promise.allSettled per entry calling renameFile; aggregate successCount and errors like bulkTouch
  results = Promise.allSettled(entries.map renameFile(src, dest))
  RETURN OperationResult { successCount, errorCount, errors }

API bulk-rename:
  // [IMPL-RENAME_REGEX] [ARCH-BATCH_OPERATIONS] [ARCH-FILE_OPERATIONS_API] [REQ-BULK_FILE_OPS]: how — validate entries array; per entry validate src/dest strings, no .., same dirname, validateRenameBasename(basename(dest)); assertSourcesVisible; delegate bulkRename
  IF NOT entries array OR empty: RETURN 400 "Entries array required"
  FOR EACH entry:
    IF missing src OR dest: RETURN 400
    IF src OR dest contains "..": RETURN 400 "Invalid path"
    IF dirname(src) != dirname(dest): RETURN 400 "Rename must stay in same directory"
    IF NOT validateRenameBasename(basename(dest)): RETURN 400 "Invalid destination name"
  blocked = assertSourcesVisible(all src paths)
  IF blocked: RETURN blocked response
  RETURN bulkRename(entries) OperationResult
```
