# IMPL-MESH_CRUD essence pseudocode

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: Mesh CRUD L2 service — validate via L1, persist MeshRecord, lifecycle and hard-delete guards

## createMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Delegate mesh shape validation to L1 validateMesh before wrapping and saving MeshRecord with configurationVersion 1.

CONTRACT createMesh
  INPUT: attrs unknown attribute bag; repository MeshRepository; activeSessionMeshIds optional callback
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError
  DATA: validated Mesh, record MeshRecord with status active and ISO timestamps

PROCEDURE IMPL-MESH_CRUD_createMesh(attrs, repository, activeSessionMeshIds)
  DATA validated = CALL validateMesh(attrs)
  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: reject invalid mesh attrs at L1
  IF isDomainValidationError(validated) THEN RETURN validated
  DATA record = wrapMesh(validated, status active, configurationVersion 1)
  CALL repository.save(record)
  RETURN record

## getMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Thin read-through to repository by mesh id.

CONTRACT getMesh
  INPUT: meshId string
  OUTPUT: MeshRecord | undefined

PROCEDURE IMPL-MESH_CRUD_getMesh(meshId, repository)
  RETURN CALL repository.get(meshId)

## updateMeshMetadata

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Merge name|description|tags|policy patch; optional expectedConfigurationVersion optimistic lock; re-validate full mesh; bump configurationVersion via nextMeshRecordAfterMeshMutation.

CONTRACT updateMeshMetadata
  INPUT: meshId string; patch name|description|tags|policy|expectedConfigurationVersion; repository
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError

PROCEDURE IMPL-MESH_CRUD_updateMeshMetadata(meshId, patch, repository)
  DATA existing = CALL repository.get(meshId)
  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: missing mesh returns mesh_not_found
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

## archiveMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Set lifecycle status archived without deleting mesh history.

CONTRACT archiveMesh
  INPUT: meshId string; repository
  OUTPUT: MeshRecord | MeshServiceError

PROCEDURE IMPL-MESH_CRUD_archiveMesh(meshId, repository)
  DATA existing = CALL repository.get(meshId)
  IF existing is undefined THEN RETURN serviceError(mesh_not_found)
  DATA record = nextMeshRecordAfterLifecycleMutation(existing, status archived)
  CALL repository.save(record)
  RETURN record

## hardDeleteMesh

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: Block delete when mesh has active sync session; else delete from repository.

CONTRACT hardDeleteMesh
  INPUT: meshId string; repository; activeSessionMeshIds callback
  OUTPUT: void | MeshServiceError

PROCEDURE IMPL-MESH_CRUD_hardDeleteMesh(meshId, repository, activeSessionMeshIds)
  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: prevent_hard_delete_when_mesh_has_active_session
  IF activeSessionMeshIds().has(meshId) THEN RETURN serviceError(mesh_has_active_session)
  IF repository.get(meshId) is undefined THEN RETURN serviceError(mesh_not_found)
  CALL repository.delete(meshId)
  RETURN undefined

## listMeshes

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: how: List meshes from repository with optional archived filter.

CONTRACT listMeshes
  INPUT: includeArchived boolean default false; repository
  OUTPUT: MeshRecord[]

PROCEDURE IMPL-MESH_CRUD_listMeshes(includeArchived, repository)
  RETURN CALL repository.list({ includeArchived })
