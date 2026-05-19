# IMPL-MESH_GUI essence pseudocode

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: React client components fetch /api/mesh; data-testid for E2E

## MeshLayout

// how: Navigation shell links list, detail sub-routes (topology, plan, sync, conflicts), monitoring, settings.

PROCEDURE IMPL-MESH_GUI_layout()
  RENDER nav with links to /mesh routes
  RENDER children outlet

## MeshListClient

// how: Fetch GET /api/mesh; create via POST; link to detail.

PROCEDURE IMPL-MESH_GUI_list()
  FETCH meshes; DISPLAY name, status, depot count
  ON create submit POST with name field testid new-mesh-name

## MeshDetailClient

// how: Load mesh; add depots and links via API; show summaries with testids.

PROCEDURE IMPL-MESH_GUI_detail(meshId)
  FETCH mesh by id
  POST depots and links
  RENDER depot-summary and link-summary

## PlanViewClient / SyncSessionClient / TopologyGraphClient / ConflictsClient

// how: Sub-feature pages call plan, sessions, topology, conflicts API endpoints.

PROCEDURE IMPL-MESH_GUI_plan(meshId)
  FETCH plan; generate-plan-btn; approve-plan-btn; plan-approved state

PROCEDURE IMPL-MESH_GUI_sync(meshId)
  START session; active-session-view; poll session status

PROCEDURE IMPL-MESH_GUI_topology(meshId)
  FETCH topology graph; render nodes and edges

PROCEDURE IMPL-MESH_GUI_conflicts(meshId)
  LIST conflicts; PATCH resolution choice
