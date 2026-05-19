# IMPL-MESH_DEPOT essence pseudocode

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_CRUD] [REQ-MESH_PLATFORM]: Depot CRUD embedded in mesh records via MeshRepository

## addDepot

// how: Validate depot at L1, append to mesh.depots, re-validate full mesh, save record.

PROCEDURE IMPL-MESH_DEPOT_addDepot(meshId, attrs, meshRepository)
  DATA record = loadMesh(meshId)
  IF mesh_not_found THEN RETURN error
  DATA depot = CALL validateDepot(attrs)
  IF domain error THEN RETURN error
  APPEND depot to record.mesh.depots
  CALL saveMesh with validateMesh
  RETURN depot

## updateDepot / removeDepot

// how: Mutate depot in mesh array by id; re-validate mesh on save.

PROCEDURE IMPL-MESH_DEPOT_updateDepot(meshId, depotId, patch, meshRepository)
  LOAD mesh; FIND depot; MERGE patch; validateDepot; saveMesh

PROCEDURE IMPL-MESH_DEPOT_removeDepot(meshId, depotId, meshRepository)
  FILTER depots excluding depotId; saveMesh

## discoverDepotCapabilities

// how: Return capability flags per depot kind (local, remote, virtual).

PROCEDURE IMPL-MESH_DEPOT_discoverDepotCapabilities(kind)
  SWITCH kind → canList, canRead, canWrite, supportsArchiveMode
