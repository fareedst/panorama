# IMPL-PANE_VOLUME_CAPACITY essence pseudocode

<!-- [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY]: Top-level — server statfs provider, listing enrichment, client normalization, pane state hydration, footer presentation -->

## Summary contract

<!-- [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING] [REQ-MULTI_PANE_LAYOUT]: how — server-only volume-stats module; GET /api/files always returns enriched object; panes store ephemeral volumeStats; footer renders capacity without blocking listing -->

```
IMPL-PANE_VOLUME_CAPACITY_Summary():
  INPUT: validated directory path per pane listing request
  OUTPUT: VolumeStats on listing responses; per-pane footer display
  DATA: fs.promises.statfs, VolumeStats contract, PaneState.volumeStats
  PRE: path validated before statfs (no .. traversal)
  POST: listing always succeeds; volumeStats carries explicit status
  EFFECTS: IO on server statfs; client state update only
  FAILURE_MODES: statfs failure → status unavailable|unsupported; never fabricate zeros
  TERMINATION: total per request
```

## GET_VOLUME_STATS

<!-- [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-PANE_VOLUME_CAPACITY]: how — server path → statfs when available → normalizeVolumeStats -->

```
GET_VOLUME_STATS(sourcePath):
  INPUT: sourcePath string (validated directory path)
  OUTPUT: VolumeStats
  DATA: fs.promises.statfs
  PRE: sourcePath is non-empty absolute or resolved path; caller validated traversal
  POST: VolumeStats with status available|unavailable|unsupported
  EFFECTS: IO
  FAILURE_MODES: statfs throws → unavailable STAT_FAILED; missing statfs API → unsupported
  DATA_TRANSITION: sourcePath → raw statfs → VolumeStats
  TERMINATION: total
  TRY:
    raw := AWAIT fs.promises.statfs(sourcePath)
    RETURN normalizeVolumeStats(raw, sourcePath)
  CATCH error:
    LOG DIAGNOSTIC statfs failure without leaking raw error to client
    RETURN VolumeStats { status: unavailable, errorCode: STAT_FAILED, sourcePath, totalBytes: 0, availableBytes: 0, freePercent: 0, deviceId: null }
```

## NORMALIZE_VOLUME_STATS

<!-- [IMPL-PANE_VOLUME_CAPACITY] [ARCH-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY]: how — raw statfs blocks → byte totals via bavail; clamp freePercent; explicit status -->

```
NORMALIZE_VOLUME_STATS(raw, sourcePath):
  INPUT: raw statfs result, sourcePath string
  OUTPUT: VolumeStats
  DATA: blockSize := raw.bsize OR raw.frsize; blocks, bavail, dev
  PRE: raw object from statfs OR null on unsupported platform
  POST: totalBytes >= 0; availableBytes >= 0; freePercent in [0,100] when available
  EFFECTS: pure
  FAILURE_MODES: totalBytes == 0 → unavailable INVALID_STATS; available > total → clamp or unavailable per contract
  TERMINATION: total
  IF platform lacks statfs OR raw is null:
    RETURN { status: unsupported, errorCode: UNSUPPORTED, sourcePath, totalBytes: 0, availableBytes: 0, freePercent: 0, deviceId: null }
  totalBytes := raw.blocks * blockSize
  availableBytes := raw.bavail * blockSize
  IF totalBytes <= 0:
    RETURN { status: unavailable, errorCode: INVALID_STATS, sourcePath, totalBytes: 0, availableBytes: 0, freePercent: 0, deviceId: raw.dev }
  freePercent := CLAMP((availableBytes / totalBytes) * 100, 0, 100)
  RETURN { status: available, sourcePath, totalBytes, availableBytes, freePercent, deviceId: raw.dev }
```

## ENRICH_DIRECTORY_LISTING

<!-- [IMPL-FILES_API] [IMPL-PANE_VOLUME_CAPACITY] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING]: how — GET always returns { files, volumeStats, hiddenCount?, totalCount? }; capacity failure isolated -->

```
ENRICH_DIRECTORY_LISTING(dirPath, sortedFiles, displaySpecId, hiddenCount, totalCount):
  INPUT: listed directory path, sorted FileStat[], optional display filter counts
  OUTPUT: DirectoryListingResponse JSON
  DATA: getVolumeStats from volume-stats.ts
  PRE: dirPath validated; files listed successfully
  POST: 200 JSON object never bare array; volumeStats present
  EFFECTS: IO (statfs)
  FAILURE_MODES: getVolumeStats failure still returns listing with unavailable stats
  TERMINATION: total
  volumeStats := AWAIT getVolumeStats(dirPath)
  RETURN { files: sortedFiles, volumeStats, hiddenCount: hiddenCount ?? 0, totalCount: totalCount ?? sortedFiles.length }
```

## SSR_ATTACH_VOLUME_STATS

<!-- [IMPL-FILE_MANAGER_PAGE] [IMPL-PANE_VOLUME_CAPACITY] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-FILE_MANAGER_PAGE] [REQ-PANE_VOLUME_CAPACITY]: how — server bootstrap attaches volumeStats to initial pane payloads -->

```
SSR_ATTACH_VOLUME_STATS(initialPanes):
  INPUT: initialPanes[] with path per pane
  OUTPUT: initialPanes with optional volumeStats per pane
  DATA: getVolumeStats
  PRE: server component bootstrap paths resolved
  POST: each pane has volumeStats when provider succeeds; null acceptable until client backfill
  EFFECTS: IO
  TERMINATION: total
  FOR EACH pane IN initialPanes:
    pane.volumeStats := AWAIT getVolumeStats(pane.path)
  RETURN initialPanes
```

## NORMALIZE_LISTING_RESPONSE

<!-- [IMPL-PANE_VOLUME_CAPACITY] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING]: how — client fetch always expects enriched object; malformed → unavailable default -->

```
NORMALIZE_LISTING_RESPONSE(data):
  INPUT: JSON from GET /api/files
  OUTPUT: DirectoryListingResponse with volumeStats
  DATA: VolumeStats contract
  PRE: fetch succeeded (response.ok)
  POST: files array present; volumeStats with explicit status
  EFFECTS: pure
  FAILURE_MODES: missing volumeStats → unavailable default; malformed numerics → unavailable
  TERMINATION: total
  REQUIRE data is object with files array (v1 — no bare array branch)
  volumeStats := normalizeVolumeStatsFromApi(data.volumeStats) OR unavailable default
  RETURN { files: data.files, volumeStats, hiddenCount, totalCount, serverPreFiltered }
```

## UPDATE_PANE_VOLUME_STATS

<!-- [IMPL-WORKSPACE_VIEW] [IMPL-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY] [REQ-MULTI_PANE_LAYOUT] [REQ-DIRECTORY_NAVIGATION]: how — store stats on pane state; mount backfill when null; stale async guard aligned with listing -->

```
UPDATE_PANE_VOLUME_STATS(paneIndex, volumeStats, navigationGeneration):
  INPUT: pane index, VolumeStats, optional generation token
  OUTPUT: updated PaneState
  DATA: PaneState.volumeStats
  PRE: paneIndex valid
  POST: only affected pane updated; stale generation ignored
  EFFECTS: client state
  FAILURE_MODES: stale response → no overwrite
  TERMINATION: total
  IF generation != currentNavigationGeneration[paneIndex]: RETURN unchanged
  panes[paneIndex].volumeStats := volumeStats

MOUNT_BACKFILL_VOLUME_STATS(panes):
  INPUT: panes with volumeStats null
  OUTPUT: fetch listing for missing stats once on mount
  PRE: client mount after SSR/mesh bootstrap
  POST: panes without stats trigger one fetchDirectoryListing
  EFFECTS: network IO
  TERMINATION: total
  FOR EACH pane WHERE pane.volumeStats == null:
    listing := AWAIT fetchDirectoryListing(pane.path, pane.activeDisplaySpecId)
    UPDATE_PANE_VOLUME_STATS(pane.index, listing.volumeStats)
```

## RENDER_PANE_VOLUME_STATS

<!-- [IMPL-FILE_PANE] [IMPL-PANE_VOLUME_CAPACITY] [REQ-PANE_VOLUME_CAPACITY] [REQ-FILE_LISTING]: how — footer segment with compact format, aria-label, status variants; empty dir shows capacity -->

```
RENDER_PANE_VOLUME_STATS(volumeStats, panePath):
  INPUT: VolumeStats | null, pane base path for aria context
  OUTPUT: footer DOM segment or null when unsupported omit policy
  DATA: formatSize from files.utils
  PRE: FilePane render with pane bounds
  POST: available shows bytes and percent; unavailable/unsupported never show zero placeholders
  EFFECTS: DOM
  TERMINATION: total
  IF volumeStats == null OR status == unavailable:
    RENDER data-testid="pane-volume-stats-unavailable" text "Storage: unavailable"
  ELSE IF status == unsupported:
    RENDER optional omit OR "Storage: unsupported"
  ELSE:
    compact := "Free {formatSize(availableBytes)} ({freePercent}%) · Total {formatSize(totalBytes)}"
    aria := "Available: {formatSize(availableBytes)} of {formatSize(totalBytes)} ({freePercent}%) at {panePath}"
    RENDER data-testid="pane-volume-stats" with aria-label

FOOTER_VISIBILITY_INCLUDES_CAPACITY(volumeStats):
  // [IMPL-FILE_PANE] [REQ-PANE_VOLUME_CAPACITY]: how — footer visible when capacity segment present even if files empty
  RETURN files.length > 0 OR marks.size > 0 OR hiddenCount > 0 OR volumeStats != null
```
