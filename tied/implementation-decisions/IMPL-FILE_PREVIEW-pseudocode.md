# IMPL-FILE_PREVIEW essence pseudocode

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: Server preview and info API routes; client PreviewPanel and InfoPanel fetch JSON

## Summary contract

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_PREVIEW_Summary():
  INPUT: query path (required); preview optional type=text|image|archive
  OUTPUT: JSON preview payload or file metadata; HTTP 400/403/404/500 on errors
  DATA: MAX_TEXT_SIZE = 100 * 1024 bytes; extension lists for text/image/archive
  CONTROL: reject paths containing ".."; fs.stat before read
  PRE: path parameter present for API routes
  POST: preview or info JSON returned for valid file paths
  EFFECTS: IO
  FAILURE_MODES: INVALID_PATH; PATH_NOT_FILE; ENOENT; EACCES
  TERMINATION: total
```

## DetectFileTypeByExtension

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: how: detectFileType maps extension to text, image, archive, or binary

```
IMPL-FILE_PREVIEW_DetectFileTypeByExtension(context):
  INPUT: filePath
  OUTPUT: type text | image | archive | binary
  PRE: filePath has extractable extension
  POST: extension mapped to supported preview category or binary
  EFFECTS: pure
  TERMINATION: total
  EXTRACT ext := lowercase extension
  IF ext IN textExtensions THEN RETURN "text"
  IF ext IN imageExtensions THEN RETURN "image"
  IF ext IN archiveExtensions THEN RETURN "archive"
  RETURN "binary"
```

## GETApiFilesPreview

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: how: GET /api/files/preview?path=&type= branches by detected or requested type

```
IMPL-FILE_PREVIEW_GETApiFilesPreview(context):
  INPUT: path query param; optional type param
  OUTPUT: preview JSON response or HTTP error
  PRE: path present and free of ..
  POST: text/image/archive preview payload returned for valid file
  EFFECTS: IO
  FAILURE_MODES: MISSING_PATH; INVALID_PATH; PATH_NOT_FILE; UNSUPPORTED_TYPE; READ_FAILED
  TERMINATION: total
  IF path missing THEN RETURN 400 { error: "Missing path parameter" }
  IF path contains ".." THEN RETURN 400 { error: "Invalid path" }
  SET detectedType := DetectFileTypeByExtension(path)
  SET type := typeParam OR detectedType
  STAT path; IF NOT isFile THEN RETURN 400 { error: "Path is not a file" }
  SWITCH type
    CASE "text":
      IF size > MAX_TEXT_SIZE THEN
        READ first MAX_TEXT_SIZE bytes utf8
        RETURN { type: "text", content, truncated: true, originalSize }
      ELSE
        READ full file utf8
        RETURN { type: "text", content, truncated: false, originalSize }
    CASE "image":
      RETURN { type: "image", name, path, size, extension, url: /api/files/raw?path=encoded }
    CASE "archive":
      RETURN stub { type: "archive", name, path, size, extension, message: not yet implemented }
    DEFAULT:
      RETURN 400 { error: "Unsupported file type for preview", detectedType }
```

## GETApiFilesInfo

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: how: GET /api/files/info?path= returns stat metadata and formatted size

```
IMPL-FILE_PREVIEW_GETApiFilesInfo(context):
  INPUT: path query param
  OUTPUT: file metadata JSON or HTTP error
  PRE: path present and free of ..
  POST: stat metadata and formatted size returned
  EFFECTS: IO
  FAILURE_MODES: MISSING_PATH; INVALID_PATH; ENOENT; EACCES
  TERMINATION: total
  IF path missing THEN RETURN 400 { error: "Missing path parameter" }
  IF path contains ".." THEN RETURN 400 { error: "Invalid path" }
  STAT file
  BUILD info { name, path, directory, extension, isDirectory, isFile, isSymbolicLink,
               size, sizeFormatted, created, modified, accessed, mode, uid, gid, blocks?, blksize? }
  RETURN 200 info JSON
```

## ClientPreviewPanels

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: how: WorkspaceView previewPanel state; PreviewPanel and InfoPanel fetch APIs

```
IMPL-FILE_PREVIEW_ClientPreviewPanels(context):
  INPUT: selected filePath; panel type preview|info
  OUTPUT: rendered PreviewPanel or InfoPanel with fetched data
  PRE: WorkspaceView mounted with previewPanel state
  POST: panel fetches and displays preview or info for filePath
  EFFECTS: IO, State
  TERMINATION: total
  WorkspaceView SET previewPanel { type: preview|info, filePath }
  PreviewPanel FETCH /api/files/preview with path and type
  InfoPanel FETCH /api/files/info with path
  SearchDialog onSelectResult MAY open preview panel with filePath (line highlight future)
```

## CodeLocations

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: map implementing and verifying source files for this IMPL

// FILE: src/app/api/files/preview/route.ts — GET preview
// FILE: src/app/api/files/info/route.ts — GET info
// FILE: src/app/api/files/preview/route.test.ts — preview route tests
// FILE: src/app/api/files/info/route.test.ts — info route tests
// FILE: src/app/files/components/PreviewPanel.tsx — client preview UI
// FILE: src/app/files/components/InfoPanel.tsx — client info UI
// FILE: src/app/files/WorkspaceView.tsx — preview panel state and render

## ErrorHandling

// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]: how: map ENOENT→404, EACCES→403, other→500 with logged error

```
IMPL-FILE_PREVIEW_on_error(context, error):
  INPUT: caught error from preview or info route
  OUTPUT: HTTP error response JSON
  PRE: error thrown during preview or info handling
  POST: mapped status code and error message returned
  EFFECTS: IO
  FAILURE_MODES: ENOENT; EACCES; UNKNOWN_ERROR
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF message contains ENOENT THEN RETURN 404 { error: "File not found" }
  IF message contains EACCES THEN RETURN 403 { error: "Permission denied" }
  ELSE RETURN 500 { error: "Failed to preview file" } OR "Failed to get file info"
```
