# IMPL-DISPLAY_FILTER_API essence pseudocode

## SERVER_FILTER_LISTING
# [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: GET /api/files lists directory then filterFileStats when displaySpecId resolves on server store; legacy array when omitted.

```
SERVER_FILTER_LISTING(path, displaySpecId):
  INPUT: directory path, displaySpecId string|null
  OUTPUT: JSON { files, hiddenCount, totalCount } OR legacy FileStat[] when no displaySpecId
  raw := listDirectory(path)
  IF NOT displaySpecId THEN RETURN sortFiles(raw) as JSON array (legacy)
  spec := serverGetDisplaySpec(displaySpecId)
  IF displaySpecId AND NOT spec THEN RETURN 400 { error: "Display spec not found", specError: true }
  filtered := filterFileStats(raw, spec)
  sorted := sortFiles(filtered.files)
  RETURN { files: sorted, hiddenCount: filtered.hiddenCount, totalCount: raw.length }
```

## VALIDATE_OPERATION_PATHS
# [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER] [REQ-BULK_FILE_OPS]
# how: Reject POST operation sources whose basename is not visible under active display spec in parent directory.

```
VALIDATE_OPERATION_PATHS(sources, displaySpecId):
  INPUT: sources absolute paths[], displaySpecId string|null
  OUTPUT: error string|null (HTTP 400 when set on POST /api/files)
  IF NOT displaySpecId THEN RETURN null
  spec := serverGetDisplaySpec(displaySpecId)
  IF NOT spec THEN RETURN "Display spec not found"
  GROUP sources BY parent directory dirname
  FOR each (dir, basenames) IN groups
    raw := listDirectory(dir)
    visibleNames := SET(filterFileStats(raw, spec).files.map name)
    FOR each basename IN basenames
      IF basename NOT IN visibleNames THEN RETURN "Path not visible under active display spec: dir/basename"
  RETURN null
```

## DISPLAY_SPECS_LIST
# [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: GET /api/display-specs returns server catalog from data/display-specs.json.

```
DISPLAY_SPECS_LIST():
  OUTPUT: { specs[] }
  RETURN serverListDisplaySpecs()
```

## DISPLAY_SPECS_CREATE
# [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER]
# how: POST validates via shared VALIDATE_SPEC; 201 on success, 400 with errors[] on validation failure.

```
DISPLAY_SPECS_CREATE(body):
  INPUT: { name, description?, rules[] }
  OUTPUT: 201 spec | 400 errors
  result := serverCreateDisplaySpec(body)
  IF validation failure THEN RETURN 400
  RETURN 201 result
```

## DISPLAY_SPECS_SYNC_CATALOG
# [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: PUT merges client localStorage catalog into server store preserving stable ids.

```
DISPLAY_SPECS_SYNC_CATALOG(clientSpecs):
  INPUT: clientSpecs DisplayFilterSpec[]
  OUTPUT: { ok: true, count }
  serverMergeDisplaySpecs(clientSpecs)
  RETURN { ok: true, count: clientSpecs.length }
```

## DISPLAY_SPECS_UPDATE_DELETE
# [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER]
# how: PATCH by body.id updates one spec; DELETE ?id= removes one spec.

```
DISPLAY_SPECS_UPDATE(body):
  INPUT: { id, name?, description?, rules? }
  OUTPUT: 200 spec | 404 | 400 errors

DISPLAY_SPECS_DELETE(id):
  INPUT: query id
  OUTPUT: 200 ok | 404
```
