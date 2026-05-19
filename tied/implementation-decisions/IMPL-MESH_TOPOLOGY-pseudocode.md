# IMPL-MESH_TOPOLOGY essence pseudocode

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Validate mesh link graph and project nodes/edges for UI

## validateTopology

// how: Build adjacency from sync links; detect cycles via DFS.

CONTRACT validateTopology
  INPUT: Mesh with depots and links
  OUTPUT: { valid, hasCycle, orphanDepotIds }

PROCEDURE IMPL-MESH_TOPOLOGY_validateTopology(mesh)
  BUILD graph from links
  // [IMPL-MESH_TOPOLOGY] [REQ-MESH_SAFETY]: cycles feed safety checkTopologySafe
  IF cycle detected THEN hasCycle true
  FIND depots not reachable from any link endpoint
  RETURN validation result

## projectTopologyGraph

// how: Map depots to nodes and links to directed edges for GUI/API.

PROCEDURE IMPL-MESH_TOPOLOGY_projectTopologyGraph(mesh)
  NODES = depots as { id, label, kind }
  EDGES = links as { source, target, direction }
  RETURN { nodes, edges }
