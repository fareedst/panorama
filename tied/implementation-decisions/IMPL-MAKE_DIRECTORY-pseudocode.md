# IMPL-MAKE_DIRECTORY essence pseudocode

<!-- [IMPL-MAKE_DIRECTORY] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: Top-level — path resolution and bulk mkdir data layer -->

```
CONTRACT buildMakeDirectoryEntries
  INPUT: paneTarget (thisPane | allPanes), dirname string, initiatingPaneIndex, panes[] with path
  OUTPUT: MakeDirectoryEntry[] { paneIndex, path } — empty when basename invalid

CONTRACT bulkMakeDirectory
  INPUT: entries[] { path }
  OUTPUT: { successCount, errorCount, errors[] } — allSettled aggregation like bulkTouch

FUNCTION buildMakeDirectoryEntries(paneTarget, dirname, initiatingPaneIndex, panes):
  // [IMPL-MAKE_DIRECTORY] [REQ-DIRECTORY_NAVIGATION]: how — trim dirname; reject via validateRenameBasename; join pane.path with dirname per target
  trimmed = trim(dirname)
  IF NOT validateRenameBasename(trimmed): RETURN []

  IF paneTarget == "thisPane":
    pane = panes[initiatingPaneIndex]
    IF NOT pane: RETURN []
    RETURN [{ paneIndex: initiatingPaneIndex, path: join(pane.path, trimmed) }]

  // allPanes — one entry per pane current path (not cross-pane basename lookup)
  RETURN panes.map((pane, paneIndex) => ({ paneIndex, path: join(pane.path, trimmed) }))

FUNCTION makeDirectory(dirPath):
  // [IMPL-MAKE_DIRECTORY] [IMPL-FILES_DATA] [REQ-DIRECTORY_NAVIGATION]: how — fs.mkdir non-recursive single level
  AWAIT fs.mkdir(dirPath, { recursive: false })

FUNCTION bulkMakeDirectory(entries):
  // [IMPL-MAKE_DIRECTORY] [IMPL-FILES_DATA] [ARCH-FILE_OPERATIONS_API] [REQ-DIRECTORY_NAVIGATION]: how — Promise.allSettled per entry like bulkTouch
  FOR EACH entry IN entries: AWAIT makeDirectory(entry.path) with allSettled aggregation
```
