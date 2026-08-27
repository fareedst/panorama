# IMPL-OVERWRITE_PROMPT essence pseudocode

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: Overwrite confirmation for bulk copy/move — detect basename conflicts from pane data, show comparison in ConfirmDialog before POST

## Summary contract

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: shared inputs for conflict detection, message assembly, and dialog rendering blocks below

```
IMPL-OVERWRITE_PROMPT_Summary():
  INPUT: source pane paths (marked or cursor), destination pane file listing, layout with two panes minimum
  OUTPUT: ConfirmDialog with optional FileConflict[] before bulk-copy or bulk-move POST
  DATA: panes[], focusIndex, destPaneIndex, FileConflict { name, existingSummary, sourceSummary, comparison }
  PRE: bulk copy or move initiated with sources and destination pane
  POST: user confirms or cancels before POST; conflicts surfaced when basename collisions exist
  EFFECTS: State, IO
  CONTROL: no extra API calls — uses existing pane FileStat records only
  TERMINATION: total
```

## DETECT_CONFLICTS

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: before confirm, foreach source path compare basename to destination pane file names; build FileConflict when match

```
IMPL-OVERWRITE_PROMPT_DetectConflicts(sources, sourcePane, destPane):
  INPUT: sources[] absolute paths, sourcePane files[], destPane files[]
  OUTPUT: conflicts[] FileConflict
  DATA: path.basename for each sourcePath
  PRE: sources and both pane listings available
  POST: conflicts array with entries for each basename collision with resolvable stats
  EFFECTS: pure
  TERMINATION: total
  SET conflicts := empty array
  FOR EACH sourcePath IN sources
    SET basename := path basename of sourcePath
    SET existingFile := destPane.files find where name equals basename
    IF existingFile is missing THEN CONTINUE
    SET sourceFile := sourcePane.files find where path equals sourcePath
    IF sourceFile is missing THEN CONTINUE
    CALL DescribeFileComparison(sourceFile, existingFile) -> summaries and comparison label
    APPEND FileConflict { name: basename, existingSummary, sourceSummary, comparison } to conflicts
  RETURN conflicts
```

## DESCRIBE_FILE_COMPARISON

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: format size and mtime for both files; label size delta and time delta for human-readable comparison string

```
IMPL-OVERWRITE_PROMPT_DescribeFileComparison(source, existing):
  INPUT: source FileStat, existing FileStat
  OUTPUT: { sourceSummary, existingSummary, comparison }
  DATA: formatSize, formatDateTime; mtime normalized to epoch ms
  PRE: both FileStat records with size and mtime
  POST: human-readable summaries and comparison label returned
  EFFECTS: pure
  TERMINATION: total
  SET sourceSummary := formatSize(source.size) + ", " + formatDateTime(source.mtime)
  SET existingSummary := formatSize(existing.size) + ", " + formatDateTime(existing.mtime)
  IF source.size equals existing.size THEN sizeComparison := "Same size"
  ELSE IF source.size greater than existing.size THEN sizeComparison := "Source larger (by " + formatSize(delta) + ")"
  ELSE sizeComparison := "Source smaller (by " + formatSize(delta) + ")"
  IF abs(sourceTime - existingTime) less than 1000 ms THEN timeComparison := "same date"
  ELSE IF sourceTime greater than existingTime THEN timeComparison := "source newer"
  ELSE timeComparison := "source older"
  SET comparison := sizeComparison + ", " + timeComparison
  RETURN { sourceSummary, existingSummary, comparison }
```

## CONFIRM_MESSAGE

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: base message shows source count and destDir; append overwrite count line when conflicts non-empty

```
IMPL-OVERWRITE_PROMPT_ConfirmMessage(title, sources, destDir, conflicts):
  INPUT: operation title (Copy Files | Move Files), sources.length, destDir, conflicts.length
  OUTPUT: message string, optional conflicts prop
  DATA: setConfirmDialog state
  PRE: sources and destDir defined
  POST: ConfirmDialog opened with message and optional conflicts prop
  EFFECTS: State
  TERMINATION: total
  SET message := title verb + sources.length + " file(s) to:" + newline + destDir
  IF conflicts.length greater than zero THEN
    APPEND newline + conflicts.length + " file(s) will be overwritten." to message
  OPEN ConfirmDialog with title, message, conflicts when length greater than zero else undefined
```

## CONFIRM_DIALOG_RENDER

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: scrollable yellow conflict panel lists each name with Existing (target), Selected (source), and comparison italic line

```
IMPL-OVERWRITE_PROMPT_ConfirmDialogRender(props):
  INPUT: conflicts[] FileConflict, isOpen, onConfirm, onCancel
  OUTPUT: modal UI or null when closed
  DATA: ConfirmDialog optional conflicts prop; Escape cancels; Enter confirms
  PRE: ConfirmDialog props defined
  POST: modal rendered when open; null when closed
  EFFECTS: State
  TERMINATION: total
  IF NOT isOpen THEN RETURN null
  RENDER message paragraph
  IF conflicts present AND length greater than zero THEN
    RENDER warning heading "The following file(s) will be overwritten:"
    FOR EACH conflict RENDER name, existingSummary, sourceSummary, comparison in scrollable panel
  RENDER Cancel and Confirm buttons
```

## CodeLocations

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleBulkCopy, handleBulkMove conflict detection and setConfirmDialog
// FILE: src/app/files/components/ConfirmDialog.tsx — FileConflict interface and conflict detail rendering
// FILE: src/lib/files.utils.ts — describeFileComparison utility
// TEST: src/app/files/BulkOperations.test.tsx — Overwrite Prompt describe block

## ErrorHandling

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: missing sourceFile stat skips that conflict entry; bulk POST errors surface via alert without breaking pane array

```
IMPL-OVERWRITE_PROMPT_on_error(context, error):
  INPUT: error from bulk operation or conflict detection
  OUTPUT: user alert or propagated error
  PRE: error context available
  POST: user notified on bulk failure; pane state preserved
  EFFECTS: IO
  FAILURE_MODES: bulk POST failure → alert and close progress dialog
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF bulk operation fails THEN alert user AND close progress dialog
  ELSE propagate to caller
```
