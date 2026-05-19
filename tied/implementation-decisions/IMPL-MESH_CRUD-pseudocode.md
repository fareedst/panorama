# IMPL-MESH_CRUD essence pseudocode

// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: Mesh CRUD L2 service — validate via L1, persist MeshRecord, lifecycle and hard-delete guards

## createMesh

// how: Delegate mesh shape validation to L1 validateMesh before wrapping and saving MeshRecord.

CONTRACT createMesh
  INPUT: attrs unknown attribute bag; repository MeshRepository; activeSessionMeshIds optional callback
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError
  DATA: validated Mesh, record MeshRecord with status active and ISO timestamps

PROCEDURE IMPL-MESH_CRUD_createMesh(attrs, repository, activeSessionMeshIds)
  DATA validated = CALL validateMesh(attrs)
  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: reject invalid mesh attrs at L1
  IF isDomainValidationError(validated) THEN RETURN validated
  DATA record = wrapMesh(validated, status active)
  CALL repository.save(record)
  RETURN record

## getMesh

// how: Thin read-through to repository by mesh id.

CONTRACT getMesh
  INPUT: meshId string
  OUTPUT: MeshRecord | undefined

PROCEDURE IMPL-MESH_CRUD_getMesh(meshId, repository)
  RETURN CALL repository.get(meshId)

## updateMeshMetadata

// how: Merge patch into existing mesh, re-validate full mesh, persist updated record.

CONTRACT updateMeshMetadata
  INPUT: meshId string; patch name|description|tags; repository
  OUTPUT: MeshRecord | DomainValidationError | MeshServiceError

PROCEDURE IMPL-MESH_CRUD_updateMeshMetadata(meshId, patch, repository)
  DATA existing = CALL repository.get(meshId)
  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: missing mesh returns mesh_not_found
  IF existing is undefined THEN RETURN serviceError(mesh_not_found)
  DATA validated = CALL validateMesh(merged existing.mesh and patch)
  IF isDomainValidationError(validated) THEN RETURN validated
  DATA record = existing with mesh validated and updatedAt now
  CALL repository.save(record)
  RETURN record

## archiveMesh

// how: Set lifecycle status archived without deleting mesh history.

CONTRACT archiveMesh
  INPUT: meshId string; repository
  OUTPUT: MeshRecord | MeshServiceError

PROCEDURE IMPL-MESH_CRUD_archiveMesh(meshId, repository)
  DATA existing = CALL repository.get(meshId)
  IF existing is undefined THEN RETURN serviceError(mesh_not_found)
  DATA record = existing with status archived and updatedAt now
  CALL repository.save(record)
  RETURN record

## hardDeleteMesh

// how: Block delete when mesh has active sync session; else delete from repository.

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

// how: List meshes from repository with optional archived filter.

CONTRACT listMeshes
  INPUT: includeArchived boolean default false; repository
  OUTPUT: MeshRecord[]

PROCEDURE IMPL-MESH_CRUD_listMeshes(includeArchived, repository)
  RETURN CALL repository.list({ includeArchived })
