# IMPL-BULK_OPS essence pseudocode

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: client bulk copy/move/delete with confirm and progress dialogs; server Promise.allSettled per source via POST /api/files

## MAP_SOURCE_TO_DEST

// [IMPL-BULK_OPS] [IMPL-NSYNC_ENGINE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_TREE] [REQ-BULK_FILE_OPS]: how: map each source absolute path to destination under destBase preserving path relative to sourceBase (not basename flatten)

```
CONTRACT MAP_SOURCE_TO_DEST
  INPUT: sourcePath, sourceBase (pane.path), destBase (destination pane.path)
  OUTPUT: destPath absolute path under destBase
  DATA: relative slice aligned with linked-nav rules; path.join(destBase, relative)

PROCEDURE IMPL-BULK_OPS_MapSourceToDest(sourcePath, sourceBase, destBase)
  NORMALIZE sourceBase and destBase trailing slashes
  IF sourcePath NOT under sourceBase THEN error
  relative := sourceBase === '/' ? sourcePath.slice(1) : path.relative(sourceBase, sourcePath)
  RETURN join(destBase, relative) with slash normalization
```

## GET_OPERATION_FILES

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] [REQ-DIRECTORY_TREE] [REQ-FILE_MARKING_WEB]: how: resolve source paths from path-keyed marks visible in pane or cursor file path

```
CONTRACT GET_OPERATION_FILES
  INPUT: paneIndex, panes[], crossPaneVisibilityResult.displayFilesByPane
  OUTPUT: string[] of absolute file paths (may be empty)
  DATA: pane.marks Set of absolute paths, pane.cursor, visible file listing per pane

PROCEDURE IMPL-BULK_OPS_GetOperationFiles(paneIndex)
  visibleFiles := displayFilesByPane[paneIndex] ?? panes[paneIndex].files
  visiblePaths := Set of visibleFiles.map(f => f.path)
  IF pane.marks.size > 0 THEN
    FOR EACH markPath IN pane.marks
      IF markPath IN visiblePaths THEN APPEND markPath
    RETURN collected paths
  file := visibleFiles[pane.cursor]
  IF file exists THEN RETURN [file.path]
  RETURN []
```

## BULK_COPY

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: require 2 panes; dest is other pane path; detect overwrite conflicts; confirm then POST bulk-copy; refresh both panes and clear marks

```
CONTRACT BULK_COPY
  INPUT: focusIndex, panes[], getOperationFiles output
  OUTPUT: files copied to destination pane directory; panes refreshed; marks cleared
  DATA: destPaneIndex = focusIndex XOR 1, destDir = panes[destPaneIndex].path

PROCEDURE IMPL-BULK_OPS_BulkCopy()
  IF panes.length < 2 THEN alert Copy requires at least 2 panes AND RETURN
  sources := GetOperationFiles(focusIndex)
  IF sources empty THEN RETURN
  destPaneIndex := other pane index (0<->1 when two panes)
  destDir := panes[destPaneIndex].path
  sourceBase := panes[paneIndex].path
  conflicts := FOR EACH source destPath := MapSourceToDest(source, sourceBase, destDir); detect collision at destPath in dest pane visible rows
  OPEN ConfirmDialog title Copy Files with optional conflict list
  ON confirm
    OPEN ProgressDialog in-progress Copying Files total sources.length
    POST /api/files { operation: bulk-copy, sources, dest: destDir, sourceBase, displaySpecId? }
    ON success UPDATE ProgressDialog complete with OperationResult counts and errors
    AWAIT refreshPaneTree(sourcePaneIndex) AND handleNavigate(destPaneIndex, destDir)
    CLEAR marks on source pane
  ON fetch error alert failure AND close progress dialog
```

## BULK_MOVE

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: same client flow as BulkCopy with operation bulk-move and file.move keybinding (V)

```
CONTRACT BULK_MOVE
  INPUT: same as BULK_COPY
  OUTPUT: files moved to destination pane; panes refreshed; marks cleared

PROCEDURE IMPL-BULK_OPS_BulkMove()
  IF panes.length < 2 THEN alert Move requires at least 2 panes AND RETURN
  sources := GetOperationFiles(focusIndex)
  IF sources empty THEN RETURN
  destPaneIndex := other pane; detect conflicts as BulkCopy
  OPEN ConfirmDialog title Move Files
  ON confirm POST operation bulk-move THEN refresh both panes AND clear marks
```

## BULK_DELETE

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: destructive confirm then POST bulk-delete; refresh focused pane and clear marks

```
CONTRACT BULK_DELETE
  INPUT: focusIndex, getOperationFiles output
  OUTPUT: deleted files; pane listing refreshed; marks cleared

PROCEDURE IMPL-BULK_OPS_BulkDelete()
  sources := GetOperationFiles(focusIndex)
  IF sources empty THEN RETURN
  OPEN ConfirmDialog title Delete Files destructive styling WHEN title includes Delete
  ON confirm
    OPEN ProgressDialog Deleting Files
    POST /api/files { operation: bulk-delete, sources, displaySpecId? }
    UPDATE ProgressDialog Delete Complete with OperationResult
    AWAIT refresh focused pane listing
    CLEAR marks on focused pane
```

## CONFIRM_DIALOG

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: Escape cancels; Enter confirms; optional scrollable conflict list; destructive red confirm for delete

```
CONTRACT CONFIRM_DIALOG
  INPUT: isOpen, title, message, conflicts?, onConfirm, onCancel
  OUTPUT: user confirmation or cancellation
  CONTROL: window keydown while open

PROCEDURE IMPL-BULK_OPS_ConfirmDialog()
  IF NOT isOpen THEN RETURN null render
  ON Escape key PREVENT default AND invoke onCancel
  ON Enter key PREVENT default AND invoke onConfirm
  IF conflicts present THEN RENDER scrollable comparison list per conflict entry
  RENDER Cancel and Confirm buttons; Confirm uses red styling WHEN destructive
```

## PROGRESS_DIALOG

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: percentage bar, current file while in progress, error list, success/fail summary when complete, Close when done

```
CONTRACT PROGRESS_DIALOG
  INPUT: total, completed, currentFile, errors[], isComplete, result?, isOpen
  OUTPUT: modal progress UI
  DATA: percentage = round(completed / total * 100) when total > 0 else 0

PROCEDURE IMPL-BULK_OPS_ProgressDialog()
  IF NOT isOpen THEN RETURN null render
  RENDER progress bar at percentage
  IF NOT isComplete AND currentFile non-empty THEN SHOW Processing currentFile
  IF errors non-empty THEN RENDER error count and file:error pairs
  IF isComplete AND result THEN RENDER successCount and errorCount summary
  IF isComplete THEN RENDER Close button invoking onClose
  IF NOT isComplete THEN RENDER spinner Operation in progress
```

## SERVER_BULK_HANDLERS

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: bulkCopy bulkMove bulkDelete in files.data.ts run Promise.allSettled per source without stopping on first failure

```
CONTRACT SERVER_BULK_HANDLERS
  INPUT: sources[] paths, destDir (copy/move only), sourceBase?, optional onProgress callback
  OUTPUT: OperationResult { successCount, errorCount, errors[] }
  DATA: parallel map over sources; dest := MapSourceToDest when sourceBase else join(destDir, basename)

PROCEDURE IMPL-BULK_OPS_ServerBulkHandlers(operation, sources, destDir?, sourceBase?)
  errors := []
  completed := 0
  results := AWAIT Promise.allSettled FOR EACH source IN sources
    dest := IF sourceBase THEN MapSourceToDest(source, sourceBase, destDir) ELSE join(destDir, basename(source))
    TRY single copyFile OR moveFile OR deleteFile for source -> dest
      INVOKE onProgress before and after each file with total completed currentFile errors
    ON error PUSH { file: source, error } AND rethrow so entry settles rejected
  successCount := count fulfilled results
  errorCount := count rejected results
  RETURN OperationResult without aborting remaining sources on first failure
```

## API_ROUTE_HANDLERS

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: POST /api/files cases bulk-copy bulk-move bulk-delete validate sources and dest then delegate to files.data bulk functions

```
CONTRACT API_ROUTE_HANDLERS
  INPUT: POST body { operation, sources, dest?, sourceBase? }
  OUTPUT: JSON OperationResult or 400 error
  CONTROL: assertSourcesVisible gate before filesystem mutation

PROCEDURE IMPL-BULK_OPS_ApiRouteHandlers(body)
  CASE operation
    bulk-copy OR bulk-move
      IF sources missing or empty THEN RETURN 400 Sources array required
      IF dest missing THEN RETURN 400 Destination directory required
      IF visibility blocked THEN RETURN blocked response
      result := AWAIT bulkCopy OR bulkMove(sources, dest, { sourceBase })
      RETURN JSON result
    bulk-delete
      IF sources missing or empty THEN RETURN 400 Sources array required
      IF visibility blocked THEN RETURN blocked response
      result := AWAIT bulkDelete(sources)
      RETURN JSON result
```

## V_KEY_FOR_MOVE

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: keybinding v maps to file.move calling handleBulkMove; M reserved for mark.toggle

```
CONTRACT V_KEY_FOR_MOVE
  INPUT: keybinding registry entry { key: v, action: file.move }
  OUTPUT: bulk move workflow invoked on V key

PROCEDURE IMPL-BULK_OPS_VKeyForMove()
  REGISTER handler file.move -> handleBulkMove
  DO NOT bind M to move; M remains mark.toggle-cursor
```

## CodeLocations

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: map implementing and verifying source files for this IMPL

// FILE: src/lib/cross-pane-path.ts — resolveCrossPaneDestPath shared mapper
// FILE: src/app/files/WorkspaceView.tsx — getOperationFiles, handleBulkCopy/Move/Delete, keybinding file.move
// FILE: src/app/files/components/ConfirmDialog.tsx — Escape/Enter confirm UX
// FILE: src/app/files/components/ProgressDialog.tsx — progress bar and completion summary
// FILE: src/app/api/files/route.ts — bulk-copy, bulk-move, bulk-delete cases
// FILE: src/lib/files.data.ts — bulkCopy, bulkMove, bulkDelete
// FILE: src/app/files/BulkOperations.test.tsx — client bulk workflow and ConfirmDialog tests
