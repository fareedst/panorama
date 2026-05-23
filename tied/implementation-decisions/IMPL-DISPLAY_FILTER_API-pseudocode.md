# IMPL-DISPLAY_FILTER_API essence pseudocode

## SERVER_FILTER_LISTING
# [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: GET /api/files lists directory then APPLY_PANE_LISTING when displaySpecId resolves on server store.

```
SERVER_FILTER_LISTING(path, displaySpecId):
  INPUT: directory path, displaySpecId string|null
  OUTPUT: JSON { files, hiddenCount, totalCount } OR legacy FileStat[] when no spec
  raw := listDirectory(path)
  IF NOT displaySpecId THEN RETURN raw array (legacy)
  spec := serverStore.get(displaySpecId)
  IF displaySpecId AND NOT spec THEN RETURN 404
  filtered := APPLY_PANE_LISTING(raw, spec)
  RETURN { files: filtered.files, hiddenCount: filtered.hiddenCount, totalCount: raw.length }
```

## VALIDATE_OPERATION_PATHS
# [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER] [REQ-BULK_FILE_OPS]
# how: Reject POST bulk sources whose basename is not visible under active display spec for parent directory.

```
VALIDATE_OPERATION_PATHS(sources, displaySpecId):
  INPUT: sources absolute paths[], displaySpecId string|null
  OUTPUT: error string|null (400 when set)
  IF NOT displaySpecId THEN RETURN null
  FOR each source IN sources
    parentDir := dirname(source)
    visible := SET(SERVER_FILTER_LISTING(parentDir, displaySpecId).files.map basename)
    IF basename(source) NOT IN visible THEN RETURN "Path not visible under active display spec"
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
