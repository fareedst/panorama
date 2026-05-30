# IMPL-MESH_TOPOLOGY essence pseudocode

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Validate mesh link graph, link CRUD helpers, and project nodes/edges for UI

## validateTopology

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — build adjacency from sync links including bidirectional reverse edges; detect cycles via DFS; find disconnected depots.

CONTRACT validateTopology
  INPUT: Mesh with depots and links
  OUTPUT: { valid, warnings, hasCycle, disconnectedDepotIds }

PROCEDURE IMPL-MESH_TOPOLOGY_validateTopology(mesh)
  BUILD adjacency from links; add reverse edge when direction bidirectional
  DATA hasCycle = DFS cycle detection from each depot
  IF hasCycle THEN append warning "Mesh topology contains a cycle"
  DATA disconnectedDepotIds = depots not appearing in any link endpoint
  IF disconnectedDepotIds non-empty AND links exist THEN append warning "Some depots are not connected by any link"
  RETURN { valid: NOT hasCycle, warnings, hasCycle, disconnectedDepotIds }

## projectTopologyGraph

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — map depots to nodes with ok|unreachable status; links to edges with ok|invalid status; include validation warnings.

CONTRACT projectTopologyGraph
  INPUT: mesh
  OUTPUT: { nodes, edges, warnings }

PROCEDURE IMPL-MESH_TOPOLOGY_projectTopologyGraph(mesh)
  DATA validation = validateTopology(mesh)
  DATA disconnected = set(validation.disconnectedDepotIds)
  NODES = depots mapped to { id, depotId, name, status: unreachable when disconnected else ok }
  EDGES = links mapped to { id, linkId, sourceDepotId, targetDepotId, direction, status: invalid when depot missing else ok }
  RETURN { nodes, edges, warnings: validation.warnings }

## addLinkToMesh

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — append link attrs and re-validate mesh; return domain error when link invalid (missing depot, self-link).

CONTRACT addLinkToMesh
  INPUT: mesh, linkAttrs
  OUTPUT: updated Mesh OR { code, message }

PROCEDURE IMPL-MESH_TOPOLOGY_addLinkToMesh(mesh, linkAttrs)
  DATA next = validateMesh({ ...mesh, links: [...mesh.links, linkAttrs] })
  IF domain validation error THEN RETURN { code, message }
  RETURN next

## removeLinkFromMesh

// how — filter out link by id; no validation error path.

PROCEDURE IMPL-MESH_TOPOLOGY_removeLinkFromMesh(mesh, linkId)
  RETURN { ...mesh, links: mesh.links filtered where id !== linkId }
