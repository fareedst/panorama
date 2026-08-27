# IMPL-MESH_DEPOT essence pseudocode

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_CRUD] [REQ-MESH_PLATFORM]: Depot CRUD embedded in mesh records via MeshRepository; re-validates mesh on save and bumps configurationVersion through nextMeshRecordAfterMeshMutation.

## discoverDepotCapabilities

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return capability flags per depot kind for planning and connector selection.

```
IMPL-MESH_DEPOT_discoverDepotCapabilities(kind):
  INPUT: kind (local | remote | virtual)
  OUTPUT: DepotCapabilities { canList, canRead, canWrite, supportsArchiveMode }
  PRE: depot kind provided
  POST: capability flags returned for planning and connector selection
  EFFECTS: pure
  TERMINATION: total
  SWITCH kind
    CASE virtual → RETURN { canList: true, canRead: true, canWrite: false, supportsArchiveMode: true }
    CASE remote → RETURN { canList: true, canRead: true, canWrite: true, supportsArchiveMode: false }
    DEFAULT local → RETURN { canList: true, canRead: true, canWrite: true, supportsArchiveMode: false }
```

## loadMeshAndSaveMesh

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_CRUD] [REQ-MESH_PLATFORM]: how — private helpers load MeshRecord from repository and persist validated mesh with configurationVersion bump.

```
IMPL-MESH_DEPOT_loadMesh(meshId, meshRepository):
  INPUT: meshId, meshRepository
  OUTPUT: MeshRecord OR { code: mesh_not_found }
  PRE: meshId and repository available
  POST: mesh record returned OR mesh_not_found error
  EFFECTS: pure
  FAILURE_MODES: MESH_NOT_FOUND
  TERMINATION: total
  DATA record = meshRepository.get(meshId)
  IF record absent THEN RETURN { code: mesh_not_found, message: "Mesh not found" }
  RETURN record

IMPL-MESH_DEPOT_saveMesh(record, mesh):
  INPUT: record, mesh (proposed)
  OUTPUT: DomainValidationError OR void (persisted)
  PRE: existing record and proposed mesh available
  POST: validated mesh persisted with configurationVersion bump OR domain validation error
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA validated = CALL validateMesh(mesh)
  IF domain validation error THEN RETURN error
  DATA nextRecord = CALL nextMeshRecordAfterMeshMutation(record, validated)
  CALL meshRepository.save(nextRecord)
```

## addDepot

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — validate depot at L1, reject duplicate names within mesh, append to depots, re-validate full mesh, save record.

```
IMPL-MESH_DEPOT_addDepot(meshId, attrs, meshRepository):
  INPUT: meshId, attrs, meshRepository
  OUTPUT: Depot OR DepotServiceError OR DomainValidationError
  PRE: meshId and depot attrs available
  POST: depot appended to mesh and persisted OR duplicate/validation/not-found error returned
  EFFECTS: State
  FAILURE_MODES: MESH_NOT_FOUND; DUPLICATE_DEPOT_NAME; DOMAIN_VALIDATION
  TERMINATION: total
  DATA record = CALL IMPL-MESH_DEPOT_loadMesh(meshId, meshRepository)
  IF mesh_not_found error THEN RETURN error
  DATA depot = CALL validateDepot(attrs)
  IF domain validation error THEN RETURN error
  IF any existing depot in record.mesh.depots has same name as depot.name THEN
    RETURN { code: duplicate_depot_name, message: "Depot name already exists in mesh" }
  DATA mesh = record.mesh with depots appended by depot
  CALL IMPL-MESH_DEPOT_saveMesh(record, mesh)
  ON save validation error THEN RETURN error
  RETURN depot
```

## updateDepot

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — merge patch into existing depot by id, re-validate depot entity, replace in depots array, save mesh.

```
IMPL-MESH_DEPOT_updateDepot(meshId, depotId, patch, meshRepository):
  INPUT: meshId, depotId, attrs (patch), meshRepository
  OUTPUT: Depot OR DepotServiceError OR DomainValidationError
  PRE: meshId, depotId, and patch available
  POST: updated depot persisted in mesh OR not-found/validation error returned
  EFFECTS: State
  FAILURE_MODES: MESH_NOT_FOUND; DEPOT_NOT_FOUND; DOMAIN_VALIDATION
  TERMINATION: total
  DATA record = CALL IMPL-MESH_DEPOT_loadMesh(meshId, meshRepository)
  IF mesh_not_found error THEN RETURN error
  DATA existing = FIND depot in record.mesh.depots WHERE id = depotId
  IF existing absent THEN RETURN { code: depot_not_found, message: "Depot not found" }
  DATA merged = merge existing with patch
  DATA depot = CALL validateDepot(merged)
  IF domain validation error THEN RETURN error
  DATA depots = map record.mesh.depots replacing matching id with depot
  CALL IMPL-MESH_DEPOT_saveMesh(record, record.mesh with depots)
  ON save validation error THEN RETURN error
  RETURN depot
```

## removeDepot

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — filter depot out by id, drop sync links referencing removed depot, save re-validated mesh.

```
IMPL-MESH_DEPOT_removeDepot(meshId, depotId, meshRepository):
  INPUT: meshId, depotId, meshRepository
  OUTPUT: DepotServiceError OR DomainValidationError OR void
  PRE: meshId and depotId available
  POST: depot and referencing links removed; mesh re-validated and saved OR error returned
  EFFECTS: State
  FAILURE_MODES: MESH_NOT_FOUND; DOMAIN_VALIDATION
  TERMINATION: total
  DATA record = CALL IMPL-MESH_DEPOT_loadMesh(meshId, meshRepository)
  IF mesh_not_found error THEN RETURN error
  DATA depots = FILTER record.mesh.depots WHERE id ≠ depotId
  DATA links = FILTER record.mesh.links WHERE sourceDepotId ≠ depotId AND targetDepotId ≠ depotId
  RETURN CALL IMPL-MESH_DEPOT_saveMesh(record, record.mesh with depots and links)
```

## getDepot

// [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — read-only lookup of depot by id without mutation.

```
IMPL-MESH_DEPOT_getDepot(meshId, depotId, meshRepository):
  INPUT: meshId, depotId, meshRepository
  OUTPUT: Depot OR undefined
  PRE: meshId and depotId provided
  POST: matching depot returned when present else undefined
  EFFECTS: pure
  TERMINATION: total
  DATA record = meshRepository.get(meshId)
  IF record absent THEN RETURN undefined
  RETURN FIND depot in record.mesh.depots WHERE id = depotId
```
