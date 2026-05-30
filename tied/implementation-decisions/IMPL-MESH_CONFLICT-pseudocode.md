# IMPL-MESH_CONFLICT essence pseudocode

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Track pending sync conflicts, resolve lifecycle, and gate destructive execution

## create

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: L1 validateConflict; store by id; optionally index meshId for scoped list.

CONTRACT create
  INPUT: attrs unknown conflict bag; optional meshId string
  OUTPUT: Conflict | DomainValidationError

PROCEDURE IMPL-MESH_CONFLICT_create(attrs, meshId)
  DATA conflict = CALL validateConflict(attrs)
  IF isDomainValidationError(conflict) THEN RETURN conflict
  STORE conflict by conflict.id
  IF meshId THEN MAP conflict.id → meshId
  RETURN conflict

## list

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return pending conflicts; filter by meshId when provided.

CONTRACT list
  INPUT: optional meshId string
  OUTPUT: Conflict[] with status pending

PROCEDURE IMPL-MESH_CONFLICT_list(meshId)
  DATA all = conflicts WHERE status pending
  IF meshId is undefined THEN RETURN all
  RETURN all WHERE meshIdByConflict[conflict.id] equals meshId

## resolve

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Mark conflict resolved; return conflict_not_found when id missing; resolution strategy recorded but not applied to changeSet in this release.

CONTRACT resolve
  INPUT: conflictId string; resolution prefer_source | prefer_target | keep_both
  OUTPUT: Conflict with status resolved | { code conflict_not_found, message }

PROCEDURE IMPL-MESH_CONFLICT_resolve(conflictId, resolution)
  DATA conflict = LOOKUP conflictId
  IF conflict is undefined THEN RETURN conflict_not_found
  SET conflict.status = resolved
  STORE updated conflict
  RETURN updated conflict

## detectModifyModify

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Factory for modify_modify pending conflict on a single path pair.

PROCEDURE IMPL-MESH_CONFLICT_detectModifyModify(path)
  RETURN CALL create({ type modify_modify, participants [path, path], status pending })

## hasUnresolvedBlocking

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: True when any supplied conflict remains pending.

PROCEDURE IMPL-MESH_CONFLICT_hasUnresolvedBlocking(conflicts)
  RETURN ANY conflict IN conflicts WHERE status pending

## unresolvedConflictBlocksExecution

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Block destructive execution when pending conflicts coexist with high-risk delete operations

CONTRACT unresolvedConflictBlocksExecution
  INPUT: conflicts Conflict[]; operations SyncOperation[]
  OUTPUT: boolean

PROCEDURE IMPL-MESH_CONFLICT_unresolvedConflictBlocksExecution(conflicts, operations)
  DATA hasHighRiskDelete = ANY op IN operations WHERE kind delete AND riskLevel high
  DATA pending = conflicts WHERE status pending
  RETURN pending.length > 0 AND hasHighRiskDelete
