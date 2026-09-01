# IMPL-ARCHIVE_DIRECTORY_PANES essence pseudocode

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: Top-level — server-only archive adapter, virtual locator codec, manifest projection, bounded extraction, read-only enforcement -->

## Summary contract

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-ARCHIVE_DIRECTORY_PANES]: how — parse supported archives server-side; project entries to FileStat; virtual locators round-trip; extract single file entries to ordinary dest; archive file never mutated -->

```
IMPL-ARCHIVE_DIRECTORY_PANES_Summary():
  INPUT: archive file path, optional entry path, validated ordinary dest for extract
  OUTPUT: FileStat[] for virtual listing; extract success/failure; stable error codes
  DATA: format registry, manifest entries, ArchiveSourceMeta, safety limits
  PRE: archive paths validated (no ..); untrusted archive bytes treated as external input
  POST: archive file size/mtime unchanged after any extract attempt; virtual rows carry archiveSource
  EFFECTS: read-only IO on archive; write only on extract to ordinary dest
  FAILURE_MODES: FORMAT_UNSUPPORTED, MANIFEST_TOO_LARGE, ENTRY_TOO_LARGE, UNSAFE_ENTRY_PATH, INVALID_ARCHIVE_LOCATOR
  TERMINATION: bounded by manifest entry cap and single-entry size cap
```

## ENCODE_VIRTUAL_ARCHIVE_PATH

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: how — absolute archive path + normalized entry path → @archive/v1/base64url(JSON) -->

```
ENCODE_VIRTUAL_ARCHIVE_PATH(archivePath, entryPath):
  INPUT: archivePath string (absolute host path), entryPath string (relative within archive or "")
  OUTPUT: virtualLocator string
  DATA: payload { a: archivePath, e: normalizedEntryPath }
  PRE: archivePath passes existing path validation; entryPath uses / separators only, no ..
  POST: result starts with @archive/v1/; round-trips through DECODE
  EFFECTS: pure
  FAILURE_MODES: invalid archivePath → throw before encode
  TERMINATION: total
  normalizedEntry := NORMALIZE_ARCHIVE_ENTRY_PATH(entryPath)
  payload := JSON.stringify({ a: archivePath, e: normalizedEntry })
  RETURN "@archive/v1/" + BASE64URL_ENCODE(payload)
```

## DECODE_VIRTUAL_ARCHIVE_PATH

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: how — strict prefix + schema validation; reject ambiguous or traversal payloads -->

```
DECODE_VIRTUAL_ARCHIVE_PATH(virtualLocator):
  INPUT: virtualLocator string
  OUTPUT: { archivePath, entryPath } OR error INVALID_ARCHIVE_LOCATOR
  DATA: prefix @archive/v1/, JSON schema { a: string, e: string }
  PRE: virtualLocator is non-empty string
  POST: archivePath validated absolute; entryPath normalized or ""
  EFFECTS: pure
  FAILURE_MODES: wrong prefix, bad base64url, missing a, archivePath contains .. → INVALID_ARCHIVE_LOCATOR
  TERMINATION: total
  IF NOT virtualLocator.startsWith("@archive/v1/"):
    RETURN error INVALID_ARCHIVE_LOCATOR
  payload := BASE64URL_DECODE(virtualLocator after prefix)
  IF payload.a missing OR payload.a contains "..":
    RETURN error INVALID_ARCHIVE_LOCATOR
  entryPath := NORMALIZE_ARCHIVE_ENTRY_PATH(payload.e OR "")
  RETURN { archivePath: payload.a, entryPath }
```

## DETECT_ARCHIVE_FORMAT

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: how — extension/MIME registry lookup with explicit v1 capability flags -->

```
DETECT_ARCHIVE_FORMAT(archivePath):
  INPUT: archivePath string
  OUTPUT: { formatKey, canList, canExtract } OR FORMAT_UNSUPPORTED
  DATA: ARCHIVE_FORMAT_REGISTRY
  PRE: archivePath is ordinary validated path
  POST: deferred formats return canList=false without throw
  EFFECTS: pure
  FAILURE_MODES: unknown extension → FORMAT_UNSUPPORTED
  TERMINATION: total
  ext := lowercase extension from archivePath
  entry := REGISTRY.lookup(ext)
  IF entry is stub (tar.bz2, 7z, rar):
    RETURN { formatKey: entry.key, canList: false, canExtract: false, errorCode: FORMAT_UNSUPPORTED }
  IF entry supports v1:
    RETURN { formatKey: entry.key, canList: true, canExtract: true }
  RETURN error FORMAT_UNSUPPORTED
```

## READ_ARCHIVE_MANIFEST

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-ARCHIVE_DIRECTORY_PANES]: how — bounded read of archive entries via format adapter; reject unsafe entry paths -->

```
READ_ARCHIVE_MANIFEST(archivePath):
  INPUT: archivePath string
  OUTPUT: ArchiveManifestEntry[]
  DATA: format adapter (yauzl | tar-stream), safety limits MAX_MANIFEST_ENTRIES, MAX_MANIFEST_READ_BYTES
  PRE: archive file exists readable; format detected with canList=true
  POST: entries normalized; count <= MAX_MANIFEST_ENTRIES; unsafe paths rejected
  EFFECTS: read-only IO on archive file
  FAILURE_MODES: corrupt archive → sanitized error; over limit → MANIFEST_TOO_LARGE; oversize entry metadata → ENTRY_TOO_LARGE
  DATA_TRANSITION: archive bytes → adapter entries → normalized manifest
  TERMINATION: total when manifest complete or limit exceeded
  format := DETECT_ARCHIVE_FORMAT(archivePath)
  IF NOT format.canList:
    RETURN error FORMAT_UNSUPPORTED
  entries := AWAIT adapter.readManifest(archivePath, { byteCounter, entryCounter })
  FOR EACH entry IN entries:
    IF entry.path fails UNSAFE_ENTRY_PATH rules:
      SKIP or REJECT entry per contract
    IF duplicate path seen:
      LOG warn duplicate; KEEP first stable entry
  IF entries.length > MAX_MANIFEST_ENTRIES:
    RETURN error MANIFEST_TOO_LARGE
  RETURN entries
```

## PROJECT_ARCHIVE_DIRECTORY

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-FILE_LISTING] [REQ-ARCHIVE_DIRECTORY_PANES]: how — manifest slice at entryPath → FileStat[] with virtual locators and archiveSource metadata -->

```
PROJECT_ARCHIVE_DIRECTORY(archivePath, entryPath):
  INPUT: archivePath, entryPath (directory within archive or "" for root)
  OUTPUT: FileStat[] sorted per listing contract
  DATA: manifest from READ_ARCHIVE_MANIFEST, ENCODE_VIRTUAL_ARCHIVE_PATH
  PRE: archive exists; entryPath is directory or root
  POST: each row.path is virtual locator; row.archiveSource present; ordinary sort fields populated
  EFFECTS: read-only IO
  FAILURE_MODES: missing archive → 404; unsupported → FORMAT_UNSUPPORTED
  DATA_TRANSITION: manifest → filtered children at entryPath → FileStat projection
  TERMINATION: total
  manifest := AWAIT READ_ARCHIVE_MANIFEST(archivePath)
  children := FILTER manifest entries whose parent path equals entryPath (direct children only)
  FOR EACH child IN children:
    stat.path := ENCODE_VIRTUAL_ARCHIVE_PATH(archivePath, child.fullPath)
    stat.name := basename(child.fullPath)
    stat.archiveSource := { archivePath, entryPath: child.fullPath, isArchiveRoot: entryPath=="", isVirtual: true, format, readOnly: true }
    stat.isDirectory := child.isDirectory
    stat.size, stat.mtime, stat.extension := from child metadata
  RETURN SORT children per active sort type
```

## EXTRACT_ARCHIVE_ENTRY

<!-- [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-COPY_OPERATIONS] [REQ-ARCHIVE_DIRECTORY_PANES]: how — stream single file entry to ordinary dest; archive immutable; temp write + rename on success -->

```
EXTRACT_ARCHIVE_ENTRY(archivePath, entryPath, destPath):
  INPUT: archivePath, entryPath (file not directory), destPath (ordinary absolute)
  OUTPUT: OperationResult { success: true } OR error
  DATA: adapter extract stream, MAX_ENTRY_UNCOMPRESSED_SIZE byte counter
  PRE: entryPath is safe relative file; destPath validated ordinary path; entry not directory or symlink
  POST: dest contains extracted bytes on success; archive file size/mtime unchanged
  EFFECTS: read archive; write dest via temp + rename
  FAILURE_MODES: directory/symlink → reject; oversize → ENTRY_TOO_LARGE; partial write → cleanup dest
  DATA_TRANSITION: archive entry bytes → temp file → rename to dest; best-effort mode/mtime
  TERMINATION: total when stream completes or limit exceeded
  RECORD archiveStatBefore := stat(archivePath)
  entry := LOOKUP manifest entry for entryPath
  IF entry.isDirectory OR entry.isSymlink:
    RETURN error UNSUPPORTED_ENTRY_TYPE
  tempPath := destPath + ".extract-tmp"
  TRY:
    AWAIT adapter.extractEntry(archivePath, entryPath, tempPath, { maxBytes: MAX_ENTRY_UNCOMPRESSED_SIZE })
    APPLY best-effort mode/mtime from entry metadata to tempPath
    RENAME tempPath → destPath per existing copy overwrite convention
  CATCH:
    DELETE tempPath if exists; TRUNCATE or remove partial dest per copy failure contract
    RETURN sanitized error
  ASSERT stat(archivePath) size/mtime equals archiveStatBefore
  RETURN { success: true }
```

## GET_LIST_DIRECTORY_ARCHIVE_BRANCH

<!-- [IMPL-FILES_API] [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-FILE_LISTING] [REQ-ARCHIVE_DIRECTORY_PANES]: how — GET /api/files branches on virtual locator before listDirectory -->

```
GET_LIST_DIRECTORY_ARCHIVE_BRANCH(requestPath, displaySpecId):
  INPUT: requestPath query param (ordinary or virtual)
  OUTPUT: DirectoryListingResponse with projected files and volumeStats
  DATA: DECODE_VIRTUAL_ARCHIVE_PATH, PROJECT_ARCHIVE_DIRECTORY, getVolumeStats
  PRE: requestPath non-empty
  POST: ordinary paths unchanged behavior; virtual returns archiveSource on rows
  EFFECTS: read-only IO
  FAILURE_MODES: INVALID_ARCHIVE_LOCATOR → 400; missing archive → 404; FORMAT_UNSUPPORTED → 400
  TERMINATION: total
  IF requestPath starts with "@archive/v1/":
    decoded := DECODE_VIRTUAL_ARCHIVE_PATH(requestPath)
    IF decoded error:
      RETURN 400 { errorCode: INVALID_ARCHIVE_LOCATOR }
    files := AWAIT PROJECT_ARCHIVE_DIRECTORY(decoded.archivePath, decoded.entryPath)
    volumeStats := getVolumeStats(decoded.archivePath)
    RETURN enriched listing { files, volumeStats, hiddenCount?, totalCount? }
  ELSE:
    RETURN existing listDirectory flow unchanged
```

## POST_EXTRACT_ARCHIVE_ENTRY

<!-- [IMPL-FILES_API] [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-ARCHIVE_DIRECTORY_PANES] [REQ-COPY_OPERATIONS] [REQ-ARCHIVE_DIRECTORY_PANES]: how — dedicated POST operation; reject copy/move/delete with virtual src/dest -->

```
POST_EXTRACT_ARCHIVE_ENTRY(body):
  INPUT: { operation: "extract-archive-entry", archivePath, entryPath, dest }
  OUTPUT: { success: true } OR OperationResult error
  DATA: EXTRACT_ARCHIVE_ENTRY
  PRE: operation equals extract-archive-entry; archivePath and dest ordinary validated paths; entryPath safe file
  POST: archive unchanged; dest written on success
  EFFECTS: IO
  FAILURE_MODES: virtual locator in archivePath or dest → 400; mutating ops on virtual paths → 400
  TERMINATION: total
  IF body.src OR body.dest is virtual locator (for copy/move/etc):
    RETURN 400 { errorCode: VIRTUAL_PATH_MUTATION_REJECTED }
  IF body.operation == "extract-archive-entry":
    RETURN AWAIT EXTRACT_ARCHIVE_ENTRY(body.archivePath, body.entryPath, body.dest)
  ELSE IF body references virtual path as src or dest:
    RETURN 400 VIRTUAL_PATH_MUTATION_REJECTED
```

## OPEN_ARCHIVE_IN_PANE

<!-- [IMPL-WORKSPACE_VIEW] [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-DIRECTORY_NAVIGATION] [REQ-ARCHIVE_DIRECTORY_PANES]: how — Enter/double-click archive file sets pane path to root virtual locator and read-only flag -->

```
OPEN_ARCHIVE_IN_PANE(paneIndex, archiveFilePath):
  INPUT: focused pane index, archiveFilePath ordinary absolute
  OUTPUT: updated PaneState with virtual root path and isArchiveReadOnly true
  DATA: ENCODE_VIRTUAL_ARCHIVE_PATH(archivePath, "")
  PRE: archiveFilePath is file with supported or detectable archive extension
  POST: pane.path is virtual locator; listing fetched via GET branch
  EFFECTS: client state + API fetch
  FAILURE_MODES: unsupported format → user-visible error; fetch failure → error state
  TERMINATION: total
  locator := ENCODE_VIRTUAL_ARCHIVE_PATH(archiveFilePath, "")
  AWAIT fetchDirectoryListing(locator)
  UPDATE panes[paneIndex].path := locator
  SET panes[paneIndex].isArchiveReadOnly := true
```

## ARCHIVE_PARENT_NAVIGATION

<!-- [IMPL-WORKSPACE_VIEW] [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-DIRECTORY_NAVIGATION] [REQ-ARCHIVE_DIRECTORY_PANES]: how — parent from archive root returns dirname(archiveFilePath) ordinary listing -->

```
ARCHIVE_PARENT_NAVIGATION(paneIndex, currentVirtualPath):
  INPUT: pane index, current virtual locator
  OUTPUT: pane navigated to ordinary parent directory of archive file when at archive root
  DATA: DECODE_VIRTUAL_ARCHIVE_PATH, path.dirname
  PRE: currentVirtualPath is virtual locator
  POST: at root (entryPath ""), pane.path becomes ordinary dirname(archivePath); isArchiveReadOnly cleared
  EFFECTS: client navigation
  FAILURE_MODES: invalid locator → warning + empty degrade
  TERMINATION: total
  decoded := DECODE_VIRTUAL_ARCHIVE_PATH(currentVirtualPath)
  IF decoded.entryPath is not empty:
    parentEntry := dirname(decoded.entryPath)
    NAVIGATE to ENCODE_VIRTUAL_ARCHIVE_PATH(decoded.archivePath, parentEntry)
  ELSE:
    parentDir := dirname(decoded.archivePath)
    NAVIGATE to parentDir ordinary path
    CLEAR isArchiveReadOnly
```

## MESH_RESTORE_ARCHIVE_PATH

<!-- [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-ARCHIVE_DIRECTORY_PANES]: how — snapshot pane.path may hold virtual locator; listing via GET branch; missing archive degrades -->

```
MESH_RESTORE_ARCHIVE_PATH(snapshotPanePath):
  INPUT: pane.path from workspace snapshot (ordinary or virtual)
  OUTPUT: listing files or degraded empty with workspace-restore-warning
  DATA: listDirectoryViaFilesApi, DECODE_VIRTUAL_ARCHIVE_PATH
  PRE: snapshotPanePath non-empty string
  POST: virtual paths list via archive branch; missing archive → warning not throw
  EFFECTS: API fetch on restore
  FAILURE_MODES: missing archive file → warning + empty listing; invalid locator → warning
  TERMINATION: total
  IF snapshotPanePath starts with "@archive/v1/":
    TRY:
      RETURN AWAIT listDirectoryViaFilesApi(snapshotPanePath)
    CATCH missing archive OR invalid:
      EMIT workspace-restore-warning
      RETURN empty listing with isArchiveReadOnly if decodable
  ELSE:
    RETURN existing ordinary restore flow
```

## RENDER_ARCHIVE_READ_ONLY

<!-- [IMPL-FILE_PANE] [IMPL-ARCHIVE_DIRECTORY_PANES] [REQ-ARCHIVE_DIRECTORY_PANES]: how — header chrome, disabled mutators, Extract enabled for file entries -->

```
RENDER_ARCHIVE_READ_ONLY(pane, contextMenuTarget):
  INPUT: pane with isArchiveReadOnly, selected FileStat row
  OUTPUT: UI with archive affordance and gated actions
  DATA: data-testid pane-archive-readonly, archive-extract-menu-item
  PRE: pane.isArchiveReadOnly true
  POST: delete/rename/move/touch/execute/mkdir disabled; Extract enabled for non-directory file entries; Set as Base disabled
  EFFECTS: presentation only
  FAILURE_MODES: none — gating is deterministic
  TERMINATION: total
  RENDER header segment "Archive: {basename(archivePath)}"
  IF contextMenuTarget is file entry AND NOT directory:
    ENABLE Extract menu item
  DISABLE destructive and mutating menu items
  DISABLE drag/drop move into/out of archive
```

## PREVIEW_ARCHIVE_MANIFEST

<!-- [IMPL-FILE_PREVIEW] [IMPL-ARCHIVE_DIRECTORY_PANES] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW] [REQ-ARCHIVE_DIRECTORY_PANES]: how — replace stub with top-level entries from shared READ_ARCHIVE_MANIFEST / PROJECT at root -->

```
PREVIEW_ARCHIVE_MANIFEST(archivePath):
  INPUT: archivePath ordinary absolute
  OUTPUT: preview payload listing top-level entry names/metadata (not stub message)
  DATA: PROJECT_ARCHIVE_DIRECTORY(archivePath, "")
  PRE: archivePath is file; preview type archive
  POST: response uses same entry normalization as pane listing at root
  EFFECTS: read-only IO
  FAILURE_MODES: FORMAT_UNSUPPORTED, corrupt → sanitized preview error object
  TERMINATION: total
  entries := AWAIT PROJECT_ARCHIVE_DIRECTORY(archivePath, "")
  RETURN preview JSON with entries summary (replace not yet implemented stub)
```
