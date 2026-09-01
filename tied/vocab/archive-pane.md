# Archive-backed pane vocabulary (canonical)

## Scope

Covers **read-only archive-backed panes**: virtual archive locators, archive entry listing/navigation, extraction to ordinary filesystem destinations, and read-only UI/API enforcement. Server-only archive parsing lives in `src/lib/archive/`; no client parser imports.

Excludes **Archived mesh** lifecycle terms ([mesh-platform.md](mesh-platform.md)), ordinary directory listing ([workspace-pane.md](workspace-pane.md)), NSYNC sync ([nsync-multi-target.md](nsync-multi-target.md)), and nested-archive navigation (deferred v1).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-ARCHIVE_DIRECTORY_PANES](../requirements/REQ-ARCHIVE_DIRECTORY_PANES.yaml), [REQ-FILE_LISTING](../requirements/REQ-FILE_LISTING.yaml), [REQ-DIRECTORY_NAVIGATION](../requirements/REQ-DIRECTORY_NAVIGATION.yaml), [REQ-COPY_OPERATIONS](../requirements/REQ-COPY_OPERATIONS.yaml), [REQ-CROSS_PANE_COMPARISON](../requirements/REQ-CROSS_PANE_COMPARISON.yaml), [REQ-FILE_PREVIEW](../requirements/REQ-FILE_PREVIEW.yaml), [REQ-WORKSPACE_MESH_BRIDGE](../requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml), [REQ-PANE_VOLUME_CAPACITY](../requirements/REQ-PANE_VOLUME_CAPACITY.yaml) |
| ARCH | [ARCH-ARCHIVE_DIRECTORY_PANES](../architecture-decisions/ARCH-ARCHIVE_DIRECTORY_PANES.yaml), [ARCH-FILESYSTEM_ABSTRACTION](../architecture-decisions/ARCH-FILESYSTEM_ABSTRACTION.yaml), [ARCH-SERVER_CLIENT_BOUNDARY](../architecture-decisions/ARCH-SERVER_CLIENT_BOUNDARY.yaml), [ARCH-FILE_OPERATIONS_API](../architecture-decisions/ARCH-FILE_OPERATIONS_API.yaml) |
| IMPL | [IMPL-ARCHIVE_DIRECTORY_PANES](../implementation-decisions/IMPL-ARCHIVE_DIRECTORY_PANES.yaml), [IMPL-FILES_API](../implementation-decisions/IMPL-FILES_API.yaml), [IMPL-WORKSPACE_VIEW](../implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../implementation-decisions/IMPL-FILE_PANE.yaml), [IMPL-WORKSPACE_MESH_BRIDGE](../implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml), [IMPL-FILE_PREVIEW](../implementation-decisions/IMPL-FILE_PREVIEW.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-ARCHIVE_DIRECTORY_PANES-pseudocode.md` |

## See also

- [workspace-pane.md](workspace-pane.md) — **Pane**, **Pane state**, **Parent navigation**, **Pane URL deep link**
- [cross-pane-comparison.md](cross-pane-comparison.md) — basename comparison participation
- [mesh-platform.md](mesh-platform.md) — **Workspace snapshot** path persistence (not **Archived mesh**)

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Archive-backed pane** | Pane whose `path` is a **Virtual archive path**; listing shows **Archive entry** rows |
| **Virtual archive path** | Canonical `@archive/v1/…` locator encoding **Archive file path** + optional **Archive entry path** |
| **Archive file path** | Ordinary absolute path to `.zip`/`.tar.gz` on host filesystem |
| **Archive entry** | One node in archive manifest (file or directory) |
| **Archive entry path** | Normalized relative path within archive using `/` separators |
| **Archive root** | Virtual view when entry path is empty — top-level archive listing |
| **Read-only archive source** | Archive file and all virtual locators derived from it — no mutating ops |
| **Extraction** | Copy-out of one archive **file** entry to ordinary filesystem destination |
| **Archive format registry** | Server map of extension/MIME → adapter with explicit capability flags |
| **Extract…** | Context menu label for archive file entry copy-out (not ordinary **Copy**) |

## Naming bridge

| Canonical concept | UI label | Code symbol |
| --- | --- | --- |
| Virtual archive path | (none — encoded in pane path) | `@archive/v1/{base64url}` |
| Archive read-only chrome | `Archive: {basename}` | `data-testid="pane-archive-readonly"` |
| Extract archive entry | **Extract…** | `data-testid="archive-extract-menu-item"` |
| Invalid locator warning | (amber warning) | `data-testid="archive-locator-invalid-warning"` |

## Named concepts

- **Virtual archive path** — Prefix `@archive/v1/` + base64url(JSON `{ a: archiveAbsPath, e: entryPath }`); round-trips API, pane state, mesh snapshot, URL deep links.
- **Archive-backed pane** — `PaneState.path` holds virtual locator; `FileStat.archiveSource` on rows; mutating actions disabled.
- **Archive format registry** — v1 supports ZIP (`yauzl`), TAR/TAR.GZ (`tar-stream` + `zlib`); TAR.BZ2/7z/RAR return `FORMAT_UNSUPPORTED`.
- **Parent from archive root** — Navigate to `dirname(archiveFilePath)` ordinary listing, not virtual parent.
- **Volume stats for archive panes** — `getVolumeStats(archiveFilePath)`; entry sizes do not alter capacity values.
- **Shared manifest reader** — Single `src/lib/archive/` module powers listing and preview top-level entries.
- **Client-safe locator codec** — Browser-importable encode/decode/isVirtual helpers (no parser deps); server `src/lib/archive/` remains authoritative at API boundaries. Planned: `src/lib/archive-path-client.ts`.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Encode virtual archive path | `ENCODE_VIRTUAL_ARCHIVE_PATH` | IMPL-ARCHIVE_DIRECTORY_PANES |
| Decode virtual archive path | `DECODE_VIRTUAL_ARCHIVE_PATH` | IMPL-ARCHIVE_DIRECTORY_PANES |
| Detect archive format | `DETECT_ARCHIVE_FORMAT` | IMPL-ARCHIVE_DIRECTORY_PANES |
| Read archive manifest | `READ_ARCHIVE_MANIFEST` | IMPL-ARCHIVE_DIRECTORY_PANES |
| Project archive directory | `PROJECT_ARCHIVE_DIRECTORY` | IMPL-ARCHIVE_DIRECTORY_PANES |
| Extract archive entry | `EXTRACT_ARCHIVE_ENTRY` | IMPL-ARCHIVE_DIRECTORY_PANES |
| GET listing archive branch | `GET_LIST_DIRECTORY_ARCHIVE_BRANCH` | IMPL-FILES_API |
| POST extract archive entry | `POST_EXTRACT_ARCHIVE_ENTRY` | IMPL-FILES_API |
| Open archive in pane | `OPEN_ARCHIVE_IN_PANE` | IMPL-WORKSPACE_VIEW |
| Archive parent navigation | `ARCHIVE_PARENT_NAVIGATION` | IMPL-WORKSPACE_VIEW |
| Mesh restore archive path | `MESH_RESTORE_ARCHIVE_PATH` | IMPL-WORKSPACE_MESH_BRIDGE |
| Render archive read-only | `RENDER_ARCHIVE_READ_ONLY` | IMPL-FILE_PANE |
| Preview archive manifest | `PREVIEW_ARCHIVE_MANIFEST` | IMPL-FILE_PREVIEW |

## Alphabetical index

- **Archive entry** — manifest node (file or directory)
- **Archive entry path** — relative path within archive
- **Archive file path** — host `.zip`/`.tar` absolute path
- **Archive format registry** — server adapter map
- **Archive root** — empty `e` component in locator
- **Archive-backed pane** — read-only virtual directory pane
- **Extraction** — single file copy-out to ordinary dest
- **Extract…** — context menu action for file entries
- **Read-only archive source** — no mutating API/UI paths
- **Virtual archive path** — `@archive/v1/…` locator
- **Client-safe locator codec** — client-side virtual path encode/decode without parser imports
