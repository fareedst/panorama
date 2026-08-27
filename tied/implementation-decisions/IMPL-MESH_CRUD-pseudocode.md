# IMPL-MESH_CRUD essence pseudocode

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: Mesh CRUD L2 service — validate via L1, persist MeshRecord, lifecycle and hard-delete guards

## createMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Delegate mesh shape validation to L1 validateMesh before wrapping and saving MeshRecord with configurationVersion 1.

```
IMPL-MESH_CRUD_createMesh(attrs, repository, activeSessionMeshIds):
  INPUT: attrs unknown attribute bag; repository MeshRepository; activeSessionMeshIds optional callback
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError
  DATA: validated Mesh, record MeshRecord with status active and ISO timestamps
  PRE: repository available for persistence
  POST: valid mesh persisted as active MeshRecord with configurationVersion 1 OR validation/service error returned
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA validated = CALL validateMesh(attrs)
  IF isDomainValidationError(validated) THEN RETURN validated
  DATA record = wrapMesh(validated, status active, configurationVersion 1)
  CALL repository.save(record)
  RETURN record
```

## getMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Thin read-through to repository by mesh id.

```
IMPL-MESH_CRUD_getMesh(meshId, repository):
  INPUT: meshId string; repository MeshRepository
  OUTPUT: MeshRecord | undefined
  PRE: meshId provided
  POST: repository record returned when present else undefined
  EFFECTS: pure
  TERMINATION: total
  RETURN CALL repository.get(meshId)
```

## updateMeshMetadata

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Merge name|description|tags|policy patch; optional expectedConfigurationVersion optimistic lock; re-validate full mesh; bump configurationVersion via nextMeshRecordAfterMeshMutation.

```
IMPL-MESH_CRUD_updateMeshMetadata(meshId, patch, repository):
  INPUT: meshId string; patch name|description|tags|policy|expectedConfigurationVersion; repository
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError
  PRE: meshId and patch available
  POST: merged mesh re-validated and saved with bumped configurationVersion OR error returned
  EFFECTS: State
  FAILURE_MODES: MESH_NOT_FOUND; STALE_CONFIGURATION; DOMAIN_VALIDATION
  TERMINATION: total
  DATA existing = CALL repository.get(meshId)
  IF existing is undefined THEN RETURN serviceError(mesh_not_found)
  DATA normalized = normalizeMeshRecordVersion(existing)
  IF patch.expectedConfigurationVersion is defined AND patch.expectedConfigurationVersion != normalized.configurationVersion THEN
    RETURN serviceError(stale_configuration)
  DATA merged = merge existing.mesh with patch (policy shallow merge when patch.policy present)
  DATA validated = CALL validateMesh(merged)
  IF isDomainValidationError(validated) THEN RETURN validated
  DATA record = nextMeshRecordAfterMeshMutation(existing, validated)
  CALL repository.save(record)
  RETURN record
```

## archiveMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Set lifecycle status archived without deleting mesh history.

```
IMPL-MESH_CRUD_archiveMesh(meshId, repository):
  INPUT: meshId string; repository
  OUTPUT: MeshRecord | MeshServiceError
  PRE: meshId provided
  POST: mesh record status set archived and persisted OR mesh_not_found returned
  EFFECTS: State
  FAILURE_MODES: MESH_NOT_FOUND
  TERMINATION: total
  DATA existing = CALL repository.get(meshId)
  IF existing is undefined THEN RETURN serviceError(mesh_not_found)
  DATA record = nextMeshRecordAfterLifecycleMutation(existing, status archived)
  CALL repository.save(record)
  RETURN record
```

## hardDeleteMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Block delete when mesh has active sync session; else delete from repository.

```
IMPL-MESH_CRUD_hardDeleteMesh(meshId, repository, activeSessionMeshIds):
  INPUT: meshId string; repository; activeSessionMeshIds callback
  OUTPUT: void | MeshServiceError
  PRE: activeSessionMeshIds callback available
  POST: mesh deleted when no active session OR mesh_has_active_session or mesh_not_found returned
  EFFECTS: State
  FAILURE_MODES: MESH_HAS_ACTIVE_SESSION; MESH_NOT_FOUND
  TERMINATION: total
  IF activeSessionMeshIds().has(meshId) THEN RETURN serviceError(mesh_has_active_session)
  IF repository.get(meshId) is undefined THEN RETURN serviceError(mesh_not_found)
  CALL repository.delete(meshId)
  RETURN undefined
```

## listMeshes

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: List meshes from repository with optional archived filter.

```
IMPL-MESH_CRUD_listMeshes(includeArchived, repository):
  INPUT: includeArchived boolean default false; repository
  OUTPUT: MeshRecord[]
  PRE: repository available
  POST: mesh records listed per includeArchived filter
  EFFECTS: pure
  TERMINATION: total
  RETURN CALL repository.list({ includeArchived })
```
