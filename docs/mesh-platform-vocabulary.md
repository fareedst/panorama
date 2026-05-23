# Mesh platform vocabulary (canonical)

## Scope

**Mesh** synchronization **platform** (`/mesh` routes, mesh API, domain model): meshes, depots, sync links, sessions, plans, conflicts, connectors. Separate product surface from the **file manager** workspace and from **NSYNC** pane sync ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)). Excludes connector implementation algorithms.

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-MESH_PLATFORM](../tied/requirements/REQ-MESH_PLATFORM.yaml), [REQ-MESH_DOMAIN_MODEL](../tied/requirements/REQ-MESH_DOMAIN_MODEL.yaml), child REQs `REQ-MESH_*` in [requirements.yaml](../tied/requirements.yaml) |
| ARCH | [ARCH-MESH_LAYERED](../tied/architecture-decisions/ARCH-MESH_LAYERED.yaml) and related `ARCH-MESH_*` |
| IMPL | `IMPL-MESH_*` family — e.g. [IMPL-MESH_DOMAIN_TYPES](../tied/implementation-decisions/IMPL-MESH_DOMAIN_TYPES.yaml), [IMPL-MESH_RUNTIME](../tied/implementation-decisions/IMPL-MESH_RUNTIME.yaml), [IMPL-MESH_CRUD](../tied/implementation-decisions/IMPL-MESH_CRUD.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-MESH_*-pseudocode.md` |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Mesh** | “sync mesh”, sponsor label — not “graph” (use **topology** for structure) |
| **Depot** | “store”, “endpoint”, “root path” — a mesh-attached storage location |
| **Sync link** | “edge”, “relationship” — directed link between depots with policy |
| **Mesh record** | Persisted mesh document — not “project” |
| **Sync session** | “run”, “job” — approved plan execution context |
| **Dry-run plan** | “plan preview”, `isDryRun` — no mutating execute |
| **Change set** | Approved list of operations for a session |
| **Conflict** | Registered divergence requiring resolution — not “compare state” (file manager) |
| **Connector** | Adapter implementing list/copy for a depot **kind** (`fake`, `local`, `remote`, …) |
| **Credential reference** | Masked secret handle — never serialized plaintext ([REQ-MESH_PLATFORM](../tied/requirements/REQ-MESH_PLATFORM.yaml)) |
| **Plan approval** | Approve-only on Plan page — creates/approves session, does not start execution |
| **Sync start** | Start approved session on Sync Now page — may require `confirmedDestructive` |
| **Approved session handoff** | `sessionStorage` bridge storing approved `sessionId` from Plan → Sync |
| **Remote depot** | Depot `kind: remote` — uses **Remote connector** stub (no live network I/O) |
| **Remote connector** | Contract-compliant stub; `healthCheck` reports not configured |
| **Session progress** | `{ completed, failed, total }` counters during execution |
| **Archived mesh** | Soft-archived mesh hidden from default list; history retained ([REQ-MESH_CRUD](../tied/requirements/REQ-MESH_CRUD.yaml)) |
| **Per-mesh schedule** | Interval/cron metadata and due detection ([REQ-MESH_SCHEDULE](../tied/requirements/REQ-MESH_SCHEDULE.yaml)) |
| **Mesh hub route** | Global `/mesh/...` page without `:meshId` (informational shells); mesh **detail** routes use **`/mesh/:meshId/**` |
| **Virtual depot** | Depot `kind: virtual` — **VirtualConnector** synthetic inventory ([REQ-MESH_REAL_CONNECTORS](../tied/requirements/REQ-MESH_REAL_CONNECTORS.yaml)) |
| **Default connector fallback** | When `kind` is unknown/unregistered — **VirtualConnector** (synthetic stub), not a live filesystem connector |
| **Workspace snapshot** | Tag `workspace-snapshot`; UI state JSON in `description.workspaceSnapshot` ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| **Saved snapshot baseline** | Parsed snapshot from loaded mesh `description`; compared to live workspace for diff badge ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)) |
| **Workspace update** | In-place save of current file-manager state to an existing mesh | `PUT /api/mesh/:meshId/workspace` | `UPDATE_EXISTING_WORKSPACE` |
| **Workspace diff** | Compare live workspace to saved baseline | `mesh.diffWorkspace`, `WorkspaceDiffDialog` | `DIFF_SAVED_VS_CURRENT` |
| **Open in File Manager** | Mesh detail restore entry (new tab) | `/files?meshId=` | `IMPL-WORKSPACE_MESH_BRIDGE` restore (server bootstrap + client rehydrate fallback) |
| **Mesh restore pending** | Server `getMesh` miss; client rehydrates | prop `meshRestorePending` on Files page | `RESTORE_ON_FILES_PAGE` |
| **Client mesh rehydrate** | Client `/api/mesh/:meshId` full restore | `RESTORE_LAYOUT_IN_WORKSPACE_VIEW` | `IMPL-WORKSPACE_MESH_BRIDGE` |
| **Cross-surface link** | New-tab navigation between Mesh GUI and File Manager workspace; `target="_blank"`, `rel="noopener noreferrer"`, screen-reader disclosure |
| **Open mesh from workspace** | File Manager header nav to Mesh | `/mesh` or `/mesh/:meshId` | `open-mesh-from-workspace` |
| **Mesh list note** | Human-readable prefix before snapshot JSON in `description` | `extractNotePrefixFromDescription` | `mesh-list-note` |
| **Most recent save time** | Mesh record `updatedAt` (last metadata/workspace save) | `GET /api/mesh` list + detail | `mesh-list-updated-at` |
| **Sortable mesh list** | Client-side column sort on mesh list headers | `MeshListClient` | `mesh-list-sort-*` |

## Naming bridge

| Canonical concept | UI (Mesh GUI) | API / code | Pseudo-code prefix |
| --- | --- | --- | --- |
| Mesh hub (Depots/Policies/Sync) | `global-depots-page`, policies copy, Sync landing | `/mesh/depots`, `/mesh/policies`, `/mesh/sync` | `IMPL-MESH_GUI_layout` |
| Credential store | (API only) | `POST /api/mesh/credentials` | `IMPL-MESH_API_credentials` |
| Mesh list | list view (name, state, depots, note, save time; sortable headers) | `GET /api/mesh` | `IMPL-MESH_GUI_list` |
| Mesh list note | `mesh-list-note` column | description prefix | `extractNotePrefixFromDescription` |
| Most recent save time | `mesh-list-updated-at` column | mesh `updatedAt` | `formatDateTime` |
| Sortable mesh list | `mesh-list-sort-*` header buttons | client `sortColumn` / `sortDirection` | `IMPL-MESH_GUI_list` |
| Create mesh | create form | `POST /api/mesh` | `IMPL-MESH_CRUD_createMesh` |
| Topology graph | topology screen | validate + project | `IMPL-MESH_TOPOLOGY_validateTopology` |
| Generate plan | plan view, `generate-plan-btn` | `POST /plan` | `IMPL-MESH_RUNTIME_generatePlan` |
| Plan approval | plan view, `approve-plan-btn`, `plan-approved` | `POST /sessions` create + approve | `IMPL-MESH_GUI_plan` |
| Approved session handoff | (browser) | `sessionStorage` approved session id | `IMPL-MESH_GUI_plan` |
| Sync start | Sync Now, `start-sync-btn` | `POST /sessions` action start | `IMPL-MESH_GUI_sync` |
| Session progress | active session view | `GET /sessions?sessionId=` | `IMPL-MESH_RUNTIME_getSessionProgress` |
| Run session | sync action | `runApprovedSession` | `IMPL-MESH_RUNTIME_runApprovedSession` |
| Depot CRUD | depot editor | depot routes | `IMPL-MESH_DEPOT_*` |
| Export mesh | export page | `GET /export` | `IMPL-MESH_GUI_export` |
| Archive mesh | settings, `archive-mesh-btn` | mesh archive API | `IMPL-MESH_GUI_archive` |
| Schedule | schedule page | schedule routes | `IMPL-MESH_GUI_schedule` |
| Workspace snapshot summary | `workspace-snapshot-summary` (note, save time, layout, shared sort, **file columns**, per-pane sort, display filters) | `workspaceSnapshotSummary`, `WorkspaceSnapshotSummaryList`, `fileColumnsLabel` | `WORKSPACE_SNAPSHOT_SUMMARY` |
| Open workspace from mesh | `open-workspace-from-mesh` | `/files?meshId=` (new tab) | `IMPL-WORKSPACE_MESH_BRIDGE` |
| Open mesh from workspace | `open-mesh-from-workspace` | `/mesh` or `/mesh/:meshId` (new tab) | `IMPL-WORKSPACE_MESH_BRIDGE` |
| Update workspace from file manager | save dialog update mode | `PUT /api/mesh/:meshId/workspace` | `UPDATE_EXISTING_WORKSPACE` |
| Diff workspace vs saved | `workspace-diff-dialog`, header Diff | `diffWorkspaceSnapshots` | `DIFF_SAVED_VS_CURRENT` |

## Named concepts

- **Mesh** — Top-level aggregate: depots, sync links, policy, metadata; validated by `VALIDATE_MESH`.
- **Depot** — Named storage endpoint on a mesh; has `kind` and connection attributes.
- **Sync link** — Connects two depots with direction and filters; validated against mesh depot set.
- **Policy** — Path filters, safety flags, defaults (`DEFAULT_POLICY`, `VALIDATE_POLICY`).
- **Mesh hub route** — Global mesh shell page (no `:meshId`); contrasts with **mesh detail** routes.
- **Mesh runtime** — Facade for authorize → plan → session → execute (`MeshRuntime`).
- **Mesh repository** — Persistence (`JsonMeshRepository`, `createMeshRepository`).
- **Role / permission** — `IMPL-MESH_AUTH_can`, `require`; header `parseMeshRole`.
- **WorkspaceSnapshot** — JSON object under `description.workspaceSnapshot`; tag `workspace-snapshot` on save ([REQ-WORKSPACE_MESH_BRIDGE](../tied/requirements/REQ-WORKSPACE_MESH_BRIDGE.yaml)). **v1** — base fields (`layout`, `focusIndex`, `linkedMode`, `comparisonMode`, `panes[]` with path/sort/cursor). **v2** — per-pane `displaySpecId`. **v3** — workspace `sharedSort` (`PaneSortSettings`). **v4** — workspace `fileColumns` (`FilesColumnConfig[]` order/visibility/format); capture always writes v4; parse accepts v1–v4 and normalizes to v4 (v1/v2 default `sharedSort`; v1–v3 omit `fileColumns` → YAML defaults on restore).
- **Mesh list note** — Optional human text before snapshot JSON; shown in mesh list **Note** column and mesh detail snapshot summary.
- **Most recent save time** — Mesh record `updatedAt`; shown in mesh list and detail snapshot summary when workspace was last saved.
- **Sortable mesh list** — Mesh list table headers toggle ascending/descending client-side sort per column.
- **Workspace update** — `PUT /api/mesh/:meshId/workspace` applies `buildMeshPatchPayload` and `planDepotSync` so mesh metadata and depot roots match the captured snapshot ([IMPL-WORKSPACE_MESH_BRIDGE](../tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE.yaml)).
- **Saved snapshot baseline** — Client `savedSnapshot` used by `diffWorkspaceSnapshots`; after update save, set to the exact captured snapshot so the diff badge clears without re-parse drift.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Validate mesh aggregate | `VALIDATE_MESH` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH` | IMPL-MESH_DOMAIN_TYPES |
| Validate depot | `VALIDATE_DEPOT` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT` | IMPL-MESH_DOMAIN_TYPES |
| Validate sync link | `VALIDATE_SYNC_LINK` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK` | IMPL-MESH_DOMAIN_TYPES |
| Topology validation | `validateTopology` → `IMPL-MESH_TOPOLOGY_validateTopology` | IMPL-MESH_TOPOLOGY |
| Create mesh | `createMesh` → `IMPL-MESH_CRUD_createMesh` | IMPL-MESH_CRUD |
| Generate plan | `generatePlan` → `IMPL-MESH_RUNTIME_generatePlan` | IMPL-MESH_RUNTIME |
| Plan approval (GUI) | `IMPL-MESH_GUI_plan` | IMPL-MESH_GUI |
| Sync start (GUI) | `IMPL-MESH_GUI_sync` | IMPL-MESH_GUI |
| Session progress | `getSessionProgress` → `IMPL-MESH_RUNTIME_getSessionProgress` | IMPL-MESH_RUNTIME |
| Cancel execution flag | `cancelSessionExecution` | IMPL-MESH_RUNTIME |
| Remote connector | `IMPL-MESH_CONNECTOR_remote` | IMPL-MESH_CONNECTOR |
| Execute approved session | `runApprovedSession` → `IMPL-MESH_RUNTIME_runApprovedSession` | IMPL-MESH_RUNTIME |
| Register conflict | `registerConflict` → `IMPL-MESH_CONFLICT_registerConflict` | IMPL-MESH_CONFLICT |
| Execute operations | `executeOperations` → `IMPL-MESH_EXECUTOR_executeOperations` | IMPL-MESH_EXECUTOR |
| Update existing workspace | `UPDATE_EXISTING_WORKSPACE` | IMPL-WORKSPACE_MESH_BRIDGE |
| Diff saved vs current | `DIFF_SAVED_VS_CURRENT` | IMPL-WORKSPACE_MESH_BRIDGE |
| Format pane sort label | `FORMAT_PANE_SORT_SETTINGS` | IMPL-WORKSPACE_MESH_BRIDGE |
| Format file columns label | `FORMAT_FILE_COLUMNS_LABEL` | IMPL-WORKSPACE_MESH_BRIDGE, IMPL-FILE_COLUMN_CONFIG |
| Snapshot v4 file columns | `SNAPSHOT_V4_FILE_COLUMNS` | IMPL-WORKSPACE_MESH_BRIDGE, IMPL-FILE_COLUMN_CONFIG |
| Workspace snapshot summary (full) | `WORKSPACE_SNAPSHOT_SUMMARY` | IMPL-WORKSPACE_MESH_BRIDGE |
| Save workspace from UI | `STORE_FROM_WORKSPACE_UI` | IMPL-WORKSPACE_MESH_BRIDGE |

## Alphabetical index

- **Cross-surface link** — new-tab navigation between Mesh GUI and File Manager workspace
- **Approved session handoff** — Plan → Sync via `sessionStorage`
- **Archived mesh** — soft-archived; excluded from default list
- **Mesh hub route** — global `/mesh/...` placeholder without `:meshId`
- **Credential store API** — `POST /api/mesh/credentials` (masked **credential references** only)
- **Change set** — approved operations batch
- **Conflict** — mesh-level resolution item
- **Connector** — depot access adapter
- **Credential reference** — masked secret pointer
- **Depot** — mesh storage endpoint
- **Dry-run plan** — non-mutating plan
- **Per-mesh schedule** — automated sync interval metadata
- **Plan approval** — approve session without starting sync
- **Remote connector** — stub adapter for `remote` depots
- **Remote depot** — depot kind using remote connector stub
- **Mesh** — top-level sync configuration
- **Mesh runtime** — orchestration facade
- **Open mesh from workspace** — header `open-mesh-from-workspace` to `/mesh` or `/mesh/:meshId`
- **Client mesh rehydrate** — when server bootstrap misses mesh, workspace client fetches mesh API and hydrates panes
- **Mesh restore pending** — `/files?meshId=` with server miss defers default panes until client rehydrate
- **Open in File Manager** — mesh detail restore to `/files?meshId=` (new tab); dual-path server + client restore
- **Sync link** — depot-to-depot link
- **Session progress** — completed/failed/total counters during run
- **Sync session** — plan execution instance
- **Sync start** — begin approved session on Sync Now page
- **Topology** — graph validation/projection
- **Saved snapshot baseline** — client baseline for workspace diff; cleared on successful update save
- **Workspace diff** — live vs saved snapshot comparison (`mesh.diffWorkspace`)
- **Workspace snapshot** — tag `workspace-snapshot`; `description.workspaceSnapshot` v1/v2/v3/v4 JSON (v2 `displaySpecId`; v3 `sharedSort`; v4 `fileColumns`)
- **Mesh list note** — description prefix before snapshot JSON
- **Most recent save time** — mesh `updatedAt` on list and detail
- **Sortable mesh list** — client-side sortable mesh list columns
- **Workspace update** — `PUT /api/mesh/:meshId/workspace` from file manager

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) — file-manager multi-pane sync (different subsystem)
