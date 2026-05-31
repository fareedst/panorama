# IMPL-TOUCH_MTIME essence pseudocode

<!-- [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: Top-level — server and client resolution for Touch mtime writes -->

```
FUNCTION resolveTouchBasenames(marks, fallbackFile):
  // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — marks non-empty → marked basenames; else right-clicked file name
  IF marks.size > 0:
    RETURN [...marks]
  RETURN [fallbackFile.name]

FUNCTION resolveTouchPaths(paneTarget, initiatingPaneIndex, paneFilesList, basenames):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — thisPane uses initiating listing; allPanes uses resolveCrossPanePathsForFilename per basename
  entries = []
  FOR EACH basename IN basenames:
    IF paneTarget == "thisPane":
      file = find file.name == basename in paneFilesList[initiatingPaneIndex]
      IF file: entries.push({ path: file.path, basename })
    ELSE IF paneTarget == "allPanes":
      FOR EACH entry IN resolveCrossPanePathsForFilename(paneFilesList, basename):
        entries.push({ path: entry.path, basename })
  RETURN entries

FUNCTION resolveAggregateMtime(mtimes, role):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-CROSS_PANE_COMPARISON]: how — min or max mtime across shared copies; null when fewer than two mtimes
  IF mtimes.length < 2: RETURN null
  IF role == "earliest": RETURN min(mtimes)
  RETURN max(mtimes)

FUNCTION getSharedCompareState(paneFilesList, basename):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-CROSS_PANE_COMPARISON]: how — CompareState from buildEnhancedComparisonIndex when basename in 2+ panes
  index = buildEnhancedComparisonIndex(paneFilesList)
  entry = index.get(basename)
  IF entry.panes.length < 2: RETURN null
  RETURN { panes, sizes, mtimes }

FUNCTION isEarliestLatestModeAvailable(paneFilesList, basenames):
  // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — true when any basename in scope has shared compare state
  RETURN basenames.some(b => getSharedCompareState(paneFilesList, b) != null)

FUNCTION resolveTouchMtimeForBasename(mode, specifiedDate, compareState):
  // [IMPL-TOUCH_MTIME] [REQ-CROSS_PANE_COMPARISON] [REQ-TOUCH_MTIME]: how — now/specify direct; earliest/latest from CompareState.mtimes via resolveAggregateMtime
  SWITCH mode:
    "now": RETURN new Date()
    "specified": RETURN specifiedDate
    "earliest": RETURN resolveAggregateMtime(compareState.mtimes, "earliest")
    "latest": RETURN resolveAggregateMtime(compareState.mtimes, "latest")

FUNCTION buildTouchEntries(paneTarget, mode, specifiedDate, initiatingPaneIndex, paneFilesList, marks, fallbackFile):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — flatten path × per-basename mtime into API entries; dedupe paths
  basenames = resolveTouchBasenames(marks, fallbackFile)
  paths = resolveTouchPaths(paneTarget, initiatingPaneIndex, paneFilesList, basenames)
  result = []
  FOR EACH { path, basename } IN paths (dedupe by path):
    state = getSharedCompareState(paneFilesList, basename)
    mtime = resolveTouchMtimeForBasename(mode, specifiedDate, state)
    IF mtime != null AND NOT NaN(mtime): result.push({ path, mtime })
  RETURN result

FUNCTION setFileMtime(filePath, mtime):
  // [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-FILE_OPERATIONS]: how — stat then utimes preserving atime; files and directories
  stat = fs.stat(filePath)
  fs.utimes(filePath, stat.atime, mtime)

FUNCTION bulkTouch(entries):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — Promise.allSettled per entry like bulkDelete
  FOR EACH entry IN entries:
    TRY setFileMtime(entry.path, entry.mtime)
  RETURN { successCount, errorCount, errors }

API POST bulk-touch(body):
  // [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME] [REQ-FILE_OPERATIONS]: how — validate entries array; per-entry path/mtime; reject ..; assertSourcesVisible; delegate bulkTouch
  IF NOT body.entries OR empty: RETURN 400 "Entries array required"
  FOR EACH entry IN body.entries:
    IF NOT entry.path OR entry.path includes "..": RETURN 400
    IF NOT entry.mtime OR invalid Date(entry.mtime): RETURN 400
  blocked = await assertSourcesVisible(paths)
  IF blocked: RETURN blocked
  RETURN bulkTouch(parsed)
```
