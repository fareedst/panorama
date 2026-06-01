# IMPL-MESH_GUI essence pseudocode

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: React client components fetch /api/mesh; data-testid for E2E

## MeshLayout

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh navigation shell — global mesh hub routes, detail sub-routes (topology, **plan approval**, **sync start**, conflicts), monitoring, settings; `data-testid` for E2E.

PROCEDURE IMPL-MESH_GUI_layout()
  RENDER nav with links to /mesh routes
  RENDER children outlet

## MeshListClient

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: L5 GUI mesh list enriches GET /api/mesh rows with note and save time; POST create; link to mesh detail overview.

PROCEDURE IMPL-MESH_GUI_list()
  FETCH meshes from GET /api/mesh
  DISPLAY name, status, depot count in mesh-row testids
  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
  // how: Note column uses extractNotePrefixFromDescription(description); save time column uses formatDateTime(updatedAt); testids mesh-list-note, mesh-list-updated-at.
  DISPLAY note (description prefix) and most recent save time (updatedAt) per row
  // [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]
  // how: SortableHeader buttons toggle sortColumn/sortDirection client-side; aria-sort on active column; testids mesh-list-sort-*.
  SORTABLE_HEADERS: click column toggles asc/desc; compareMeshes for name, status, depots, note, updatedAt
  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
  // how: Files startup column — radio per row sets localStorage via setFilesStartupMeshId; summary + clear control; testids mesh-list-files-startup-*, files-startup-mesh-summary, files-startup-mesh-clear
  DISPLAY Files startup column with radio inputs; toolbar summary and Use config defaults clear
  ON create submit POST with name field testid new-mesh-name

## MeshDetailClient

// [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [REQ-MESH_GUI]: Load mesh DTO; POST **depots** and **sync links**; summaries with `data-testid` for E2E.

PROCEDURE IMPL-MESH_GUI_detail(meshId)
  FETCH mesh by id
  POST depots and links
  RENDER depot-summary and link-summary

## PlanViewClient

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_SAFETY]: Approve-only on plan page; dry-run recorded; execution deferred to Sync page.

PROCEDURE IMPL-MESH_GUI_plan(meshId)
  FETCH mesh and POST /plan for changeSet
  ON approve: POST sessions create + approve; store sessionId in sessionStorage; show plan-approved
  // how: Do not call start on approve — destructive confirmation and start happen on Sync Now.

## SyncSessionClient

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_E2E_RELEASE]: Start approved session with optional confirmedDestructive.

PROCEDURE IMPL-MESH_GUI_sync(meshId)
  READ approved sessionId from sessionStorage
  ON start-sync-btn: POST sessions action start with confirmedDestructive when plan has high-risk ops
  RENDER pause/resume/cancel when state allows; poll events for event-stream testid

## TopologyGraphClient / ConflictsClient

// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Topology projection and **conflicts** list UIs calling respective mesh APIs.

PROCEDURE IMPL-MESH_GUI_topology(meshId)
  FETCH topology graph; render nodes and edges

PROCEDURE IMPL-MESH_GUI_conflicts(meshId)
  LIST conflicts; PATCH resolution choice

## MeshScheduleClient

// [IMPL-MESH_GUI] [IMPL-MESH_SCHEDULE] [ARCH-MESH_LAYERED] [REQ-MESH_SCHEDULE] [REQ-MESH_GUI]: Per-mesh schedule enable/interval UI.

PROCEDURE IMPL-MESH_GUI_schedule(meshId)
  FETCH schedule; DISPLAY enabled and interval fields
  ON save POST schedule update with testid schedule-save-btn

## MeshExportClient

// [IMPL-MESH_GUI] [IMPL-MESH_IMPORT_EXPORT] [REQ-MESH_IMPORT_EXPORT]: Download mesh export JSON without secrets.

PROCEDURE IMPL-MESH_GUI_export(meshId)
  FETCH GET /export; OFFER download of sanitized configuration

## MeshHistoryClient / MeshLogsClient

// [IMPL-MESH_GUI] [IMPL-MESH_EVENTS] [REQ-MESH_MONITORING]: Session history and event log viewers.

PROCEDURE IMPL-MESH_GUI_history(meshId)
  FETCH sessions list; RENDER completed session rows

PROCEDURE IMPL-MESH_GUI_logs(meshId)
  FETCH events; RENDER event-stream testid for E2E polling

## MeshRulesClient

// [IMPL-MESH_GUI] [IMPL-MESH_POLICY] [REQ-MESH_GUI]: Policy path filters and safety flags editor.

PROCEDURE IMPL-MESH_GUI_rules(meshId)
  FETCH mesh policy; EDIT filters; POST policy update

## MeshArchiveClient

// [IMPL-MESH_GUI] [IMPL-MESH_CRUD] [REQ-MESH_CRUD]: Archive mesh from settings without deleting history.

PROCEDURE IMPL-MESH_GUI_archive(meshId)
  ON archive-mesh-btn POST archive; REDIRECT to mesh list

## MeshDepotsClient

// [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]
// how: Per-mesh depots sub-route — fetch mesh, add/remove depots via API, credential reference UI stub; testids mesh-depots, add-depot-*, depot-summary, manage-credentials-btn.

PROCEDURE IMPL-MESH_GUI_depots(meshId)
  FETCH GET /api/mesh/{meshId}
  RENDER MeshDetailNav + add-depot-form + depot-summary
  ON add-depot-btn POST /api/mesh/{meshId}/depots { name, kind, root }
  ON remove-depot-{id} DELETE /api/mesh/{meshId}/depots/{id}
  ON manage-credentials-btn POST /api/mesh/credentials with x-mesh-role operator → show credential-denied on 403
