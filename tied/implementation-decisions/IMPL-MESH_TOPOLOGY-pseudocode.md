# IMPL-MESH_TOPOLOGY essence pseudocode

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Validate mesh link graph, link CRUD helpers, and project nodes/edges for UI

## validateTopology

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — build adjacency from sync links including bidirectional reverse edges; detect cycles via DFS; find disconnected depots.

```
IMPL-MESH_TOPOLOGY_validateTopology(mesh):
  INPUT: Mesh with depots and links
  OUTPUT: { valid, warnings, hasCycle, disconnectedDepotIds }
  PRE: mesh depots and links arrays available
  POST: cycle and disconnected depot diagnostics returned with valid flag
  EFFECTS: pure
  TERMINATION: total
  BUILD adjacency from links; add reverse edge when direction bidirectional
  DATA hasCycle = DFS cycle detection from each depot
  IF hasCycle THEN append warning "Mesh topology contains a cycle"
  DATA disconnectedDepotIds = depots not appearing in any link endpoint
  IF disconnectedDepotIds non-empty AND links exist THEN append warning "Some depots are not connected by any link"
  RETURN { valid: NOT hasCycle, warnings, hasCycle, disconnectedDepotIds }
```

## projectTopologyGraph

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — map depots to nodes with ok|unreachable status; links to edges with ok|invalid status; include validation warnings.

```
IMPL-MESH_TOPOLOGY_projectTopologyGraph(mesh):
  INPUT: mesh
  OUTPUT: { nodes, edges, warnings }
  PRE: mesh depots and links available
  POST: UI graph projection with node/edge status and validation warnings
  EFFECTS: pure
  TERMINATION: total
  DATA validation = validateTopology(mesh)
  DATA disconnected = set(validation.disconnectedDepotIds)
  NODES = depots mapped to { id, depotId, name, status: unreachable when disconnected else ok }
  EDGES = links mapped to { id, linkId, sourceDepotId, targetDepotId, direction, status: invalid when depot missing else ok }
  RETURN { nodes, edges, warnings: validation.warnings }
```

## addLinkToMesh

// [IMPL-MESH_TOPOLOGY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — append link attrs and re-validate mesh; return domain error when link invalid (missing depot, self-link).

```
IMPL-MESH_TOPOLOGY_addLinkToMesh(mesh, linkAttrs):
  INPUT: mesh, linkAttrs
  OUTPUT: updated Mesh OR { code, message }
  PRE: mesh and linkAttrs available
  POST: validated mesh with appended link returned OR domain validation error
  EFFECTS: pure
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA next = validateMesh({ ...mesh, links: [...mesh.links, linkAttrs] })
  IF domain validation error THEN RETURN { code, message }
  RETURN next
```

## removeLinkFromMesh

// how — filter out link by id; no validation error path.

```
IMPL-MESH_TOPOLOGY_removeLinkFromMesh(mesh, linkId):
  INPUT: mesh, linkId
  OUTPUT: mesh with link removed
  PRE: mesh.links available
  POST: link filtered out by id without validation error path
  EFFECTS: pure
  TERMINATION: total
  RETURN { ...mesh, links: mesh.links filtered where id !== linkId }
```
