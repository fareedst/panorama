# IMPL-MESH_CONFLICT essence pseudocode

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Track pending sync conflicts, resolve lifecycle, and gate destructive execution

## Summary contract

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound conflict store inputs, lifecycle outputs, and execution gate

```
IMPL-MESH_CONFLICT_Summary():
  INPUT: conflict attrs; optional meshId; conflictId; resolution strategy; operations[]
  OUTPUT: Conflict records; pending lists; execution block boolean
  DATA: in-memory conflict store; meshIdByConflict index
  PRE: L1 validateConflict available
  POST: conflicts created, listed, resolved; blocking gate evaluated for high-risk deletes
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION; CONFLICT_NOT_FOUND
  TERMINATION: total
```

## Create

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: L1 validateConflict; store by id; optionally index meshId for scoped list.

```
IMPL-MESH_CONFLICT_create(attrs, meshId):
  INPUT: attrs unknown conflict bag; optional meshId string
  OUTPUT: Conflict | DomainValidationError
  PRE: attrs pass validateConflict at L1
  POST: conflict stored by id; optional meshId index updated
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA conflict = CALL validateConflict(attrs)
  IF isDomainValidationError(conflict) THEN RETURN conflict
  STORE conflict by conflict.id
  IF meshId THEN MAP conflict.id → meshId
  RETURN conflict
```

## List

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return pending conflicts; filter by meshId when provided.

```
IMPL-MESH_CONFLICT_list(meshId):
  INPUT: optional meshId string
  OUTPUT: Conflict[] with status pending
  PRE: conflict store available
  POST: pending conflicts returned; filtered by meshId when provided
  EFFECTS: pure
  TERMINATION: total
  DATA all = conflicts WHERE status pending
  IF meshId is undefined THEN RETURN all
  RETURN all WHERE meshIdByConflict[conflict.id] equals meshId
```

## Resolve

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Mark conflict resolved; return conflict_not_found when id missing; resolution strategy recorded but not applied to changeSet in this release.

```
IMPL-MESH_CONFLICT_resolve(conflictId, resolution):
  INPUT: conflictId string; resolution prefer_source | prefer_target | keep_both
  OUTPUT: Conflict with status resolved | { code conflict_not_found, message }
  PRE: conflictId may exist in store
  POST: conflict status set resolved when found
  EFFECTS: State
  FAILURE_MODES: CONFLICT_NOT_FOUND
  TERMINATION: total
  DATA conflict = LOOKUP conflictId
  IF conflict is undefined THEN RETURN conflict_not_found
  SET conflict.status = resolved
  STORE updated conflict
  RETURN updated conflict
```

## DetectModifyModify

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Factory for modify_modify pending conflict on a single path pair.

```
IMPL-MESH_CONFLICT_detectModifyModify(path):
  INPUT: path string
  OUTPUT: Conflict pending modify_modify record
  PRE: path non-empty
  POST: pending conflict created via create factory
  EFFECTS: State
  TERMINATION: total
  RETURN CALL create({ type modify_modify, participants [path, path], status pending })
```

## HasUnresolvedBlocking

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: True when any supplied conflict remains pending.

```
IMPL-MESH_CONFLICT_hasUnresolvedBlocking(conflicts):
  INPUT: conflicts Conflict[]
  OUTPUT: boolean
  PRE: conflicts array available
  POST: true when any conflict status pending
  EFFECTS: pure
  TERMINATION: total
  RETURN ANY conflict IN conflicts WHERE status pending
```

## UnresolvedConflictBlocksExecution

// [IMPL-MESH_CONFLICT] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Block destructive execution when pending conflicts coexist with high-risk delete operations

```
IMPL-MESH_CONFLICT_unresolvedConflictBlocksExecution(conflicts, operations):
  INPUT: conflicts Conflict[]; operations SyncOperation[]
  OUTPUT: boolean
  PRE: conflicts and operations arrays available
  POST: true when pending conflicts and high-risk delete operations coexist
  EFFECTS: pure
  TERMINATION: total
  DATA hasHighRiskDelete = ANY op IN operations WHERE kind delete AND riskLevel high
  DATA pending = conflicts WHERE status pending
  RETURN pending.length > 0 AND hasHighRiskDelete
```
