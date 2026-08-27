# IMPL-MESH_DOMAIN_TYPES essence pseudocode

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Top-level Mesh Domain Types — pure domain entities, validators, and JSON-safe DTO serialization for phase 1 (no I/O)

## Summary contract

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Declare module-wide synchronous pure-function contract; no I/O imports per ARCH-MESH_DOMAIN L1 boundary.

```
IMPL-MESH_DOMAIN_TYPES_Summary():
  INPUT: raw attribute bags or DTO objects from callers (services, tests)
  OUTPUT: validated domain entities, validation errors, or JSON-safe DTOs
  DATA: Mesh, Depot, SyncLink, Policy, Filter, CredentialReference, SyncSession, MeshSnapshot, ChangeSet, SyncOperation, SyncEvent, Conflict; DomainValidationError
  PRE: caller provides attribute bag or DTO for validation or serialization
  POST: validated entity, validation error, or JSON-safe DTO returned without I/O
  EFFECTS: pure
  CONTROL: validation runs before entity is considered constructed; serialization strips secrets
  TERMINATION: total
```

## InternalHelpers

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Private helpers in internal.ts (not exported from index.ts); shared by validators and snapshot procedures.

```
IMPL-MESH_DOMAIN_TYPES_generateStableId():
  INPUT: (none)
  OUTPUT: non-empty string id (UUID in TypeScript via crypto.randomUUID)
  PRE: none
  POST: new unique string id allocated
  EFFECTS: pure
  TERMINATION: total
  RETURN new unique string id

IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs):
  INPUT: attrs with optional id field
  OUTPUT: attrs.id when non-empty string, else CALL generateStableId()
  PRE: attrs object available
  POST: caller-supplied id returned when non-empty else new id generated
  EFFECTS: pure
  TERMINATION: total
  IF attrs.id is present AND non-empty string THEN RETURN attrs.id
  RETURN CALL IMPL-MESH_DOMAIN_TYPES_generateStableId()

IMPL-MESH_DOMAIN_TYPES_deepCloneMesh(mesh):
  INPUT: Mesh (validated)
  OUTPUT: deep copy of Mesh with no shared nested references (TypeScript: structuredClone)
  PRE: validated mesh available
  POST: deep copy returned without aliasing nested depots/links/policy
  EFFECTS: pure
  TERMINATION: total
  RETURN deep copy of mesh graph without aliasing nested depots/links/policy

IMPL-MESH_DOMAIN_TYPES_nowIso():
  INPUT: (none)
  OUTPUT: ISO-8601 timestamp string (TypeScript: new Date().toISOString())
  PRE: none
  POST: current time captured as ISO-8601 string
  EFFECTS: pure
  TERMINATION: total
  RETURN current time as ISO-8601 string
```

## DomainValidationError

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Build structured validation errors with path, code, and message for all VALIDATE_* reject paths.

```
IMPL-MESH_DOMAIN_TYPES_MakeValidationError(fieldPath, code, message):
  INPUT: field path, machine code, human message
  OUTPUT: DomainValidationError instance
  DATA: code (string), path (string), message (string)
  PRE: fieldPath and message provided
  POST: DomainValidationError returned OR validation_code_required when code empty
  EFFECTS: pure
  FAILURE_MODES: VALIDATION_CODE_REQUIRED
  TERMINATION: total
  RETURN { code, path: fieldPath, message }
  ON empty code THEN RETURN validation error "validation_code_required"
```

## DEFAULT_POLICY

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Supply non-destructive policy defaults for policy_has_default_safe_values and mesh policy omission.

```
IMPL-MESH_DOMAIN_TYPES_DEFAULT_POLICY():
  INPUT: (none)
  OUTPUT: Policy with safe defaults
  DATA: deletePolicy=never, conflictPolicy=prefer_authoritative, retryMaxAttempts=3, verificationMode=size_mtime
  PRE: none
  POST: Policy with delete never, prefer_authoritative conflict, bounded retries, size_mtime verification
  EFFECTS: pure
  TERMINATION: total
  RETURN Policy {
    deletePolicy: never
    conflictPolicy: prefer_authoritative
    retryMaxAttempts: 3
    verificationMode: size_mtime
  }
```

## VALIDATE_POLICY

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Validate optional inline policy fields on mesh DTOs before accepting a Mesh.policy value.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_POLICY(attrs):
  INPUT: attrs { deletePolicy?, conflictPolicy?, retryMaxAttempts?, verificationMode? }
  OUTPUT: Policy OR DomainValidationError
  DATA: DeletePolicy (never | prompt | allow); ConflictPolicy (prefer_authoritative | prefer_newer | manual); VerificationMode (none | size_mtime | checksum)
  PRE: policy attribute bag available
  POST: validated Policy returned OR policy enum/bounds validation error
  EFFECTS: pure
  FAILURE_MODES: POLICY_DELETE_INVALID; POLICY_CONFLICT_INVALID; POLICY_RETRY_MAX_INVALID; POLICY_VERIFICATION_INVALID
  TERMINATION: total
  IF attrs.deletePolicy is present AND attrs.deletePolicy not in (never, prompt, allow) THEN RETURN validation error "policy_delete_invalid"
  IF attrs.conflictPolicy is present AND attrs.conflictPolicy not in (prefer_authoritative, prefer_newer, manual) THEN RETURN validation error "policy_conflict_invalid"
  IF attrs.retryMaxAttempts is present AND (not number OR attrs.retryMaxAttempts < 1) THEN RETURN validation error "policy_retry_max_invalid"
  IF attrs.verificationMode is present AND attrs.verificationMode not in (none, size_mtime, checksum) THEN RETURN validation error "policy_verification_invalid"
  RETURN Policy {
    deletePolicy: attrs.deletePolicy OR never
    conflictPolicy: attrs.conflictPolicy OR prefer_authoritative
    retryMaxAttempts: attrs.retryMaxAttempts OR 3
    verificationMode: attrs.verificationMode OR size_mtime
  }
```

## VALIDATE_CREDENTIAL_REFERENCE

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Enforce credential_reference_does_not_expose_secret_material; allocate fresh id when omitted (same pattern as depots via resolveEntityId).

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_CREDENTIAL_REFERENCE(attrs):
  INPUT: attrs { id?, label, secret? }
  OUTPUT: CredentialReference OR DomainValidationError
  DATA: CredentialReference { id, label }
  PRE: credential attribute bag available
  POST: validated CredentialReference without secret field OR validation error
  EFFECTS: pure
  FAILURE_MODES: CREDENTIAL_LABEL_REQUIRED; CREDENTIAL_SECRET_NOT_ALLOWED_IN_DOMAIN
  TERMINATION: total
  IF attrs.label is missing OR empty THEN RETURN validation error "credential_label_required"
  IF attrs.secret is present THEN RETURN validation error "credential_secret_not_allowed_in_domain"
  ASSIGN credId = CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
  RETURN CredentialReference { id: credId, label: attrs.label }
```

## SERIALIZE_CREDENTIAL_REFERENCE

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: JSON-safe credential DTO mapping; round-trip reuses VALIDATE_CREDENTIAL_REFERENCE on deserialize.

```
IMPL-MESH_DOMAIN_TYPES_TO_DTO_CREDENTIAL_REFERENCE(ref):
  INPUT: CredentialReference
  OUTPUT: DTO { id, label }
  DATA: (no secret field on DTO)
  PRE: validated CredentialReference available
  POST: id and label only emitted on DTO
  EFFECTS: pure
  TERMINATION: total
  RETURN { id: ref.id, label: ref.label }

IMPL-MESH_DOMAIN_TYPES_FROM_DTO_CREDENTIAL_REFERENCE(dto):
  INPUT: credential DTO { id?, label }
  OUTPUT: CredentialReference OR DomainValidationError
  PRE: DTO available for deserialization
  POST: validated CredentialReference returned via VALIDATE_CREDENTIAL_REFERENCE
  EFFECTS: pure
  FAILURE_MODES: CREDENTIAL_LABEL_REQUIRED; CREDENTIAL_SECRET_NOT_ALLOWED_IN_DOMAIN
  TERMINATION: total
  CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_CREDENTIAL_REFERENCE(dto)
  ON error THEN RETURN error
  RETURN validated CredentialReference
```

## VALIDATE_DEPOT

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Enforce depot_requires_name_kind_and_root and DepotKind enum for each depot in a mesh.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT(attrs):
  INPUT: attrs { id?, name, kind, root, credentialReferenceId?, accessMode? }
  OUTPUT: Depot OR DomainValidationError
  DATA: DepotKind enum (local | remote | virtual)
  PRE: depot attribute bag available
  POST: validated Depot with assigned id and default accessMode OR validation error
  EFFECTS: pure
  FAILURE_MODES: DEPOT_NAME_REQUIRED; DEPOT_KIND_INVALID; DEPOT_ROOT_REQUIRED
  TERMINATION: total
  IF attrs.name is missing OR trim(attrs.name) is empty THEN RETURN validation error "depot_name_required"
  IF attrs.kind not in (local, remote, virtual) THEN RETURN validation error "depot_kind_invalid"
  IF attrs.root is missing OR trim(attrs.root) is empty THEN RETURN validation error "depot_root_required"
  ASSIGN depotId = CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
  RETURN Depot { id: depotId, name: trim(attrs.name), kind: attrs.kind, root: attrs.root, credentialReferenceId: attrs.credentialReferenceId, accessMode: attrs.accessMode OR read_write }
```

## TO_DTO_DEPOT

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated Depot entity to JSON-safe DTO for mesh serialization.

```
IMPL-MESH_DOMAIN_TYPES_TO_DTO_DEPOT(depot):
  INPUT: Depot
  OUTPUT: depot DTO
  PRE: validated Depot available
  POST: depot fields copied to plain object DTO
  EFFECTS: pure
  TERMINATION: total
  RETURN { id, name, kind, root, credentialReferenceId, accessMode } from depot
```

## TO_DTO_SYNC_LINK

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated SyncLink entity to JSON-safe DTO for mesh serialization.

```
IMPL-MESH_DOMAIN_TYPES_TO_DTO_SYNC_LINK(link):
  INPUT: SyncLink
  OUTPUT: link DTO
  PRE: validated SyncLink available
  POST: link id and depot endpoints copied to plain object DTO
  EFFECTS: pure
  TERMINATION: total
  RETURN { id, sourceDepotId, targetDepotId, direction } from link
```

## TO_DTO_POLICY

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated Policy entity to JSON-safe DTO embedded in mesh DTO.

```
IMPL-MESH_DOMAIN_TYPES_TO_DTO_POLICY(policy):
  INPUT: Policy
  OUTPUT: policy DTO
  PRE: validated Policy available
  POST: policy fields exposed as plain object with same names
  EFFECTS: pure
  TERMINATION: total
  RETURN policy fields as plain object
```

## VALIDATE_SYNC_LINK

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Enforce sync_link_requires_valid_source_and_target_depots against mesh depot id set; reject self-loops.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK(attrs, meshDepots):
  INPUT: attrs { id?, sourceDepotId, targetDepotId, direction }, meshDepots (set of depot ids)
  OUTPUT: SyncLink OR DomainValidationError
  DATA: LinkDirection (one_way | bidirectional)
  PRE: link attrs and meshDepots set available
  POST: validated SyncLink OR link validation error
  EFFECTS: pure
  FAILURE_MODES: LINK_SOURCE_REQUIRED; LINK_TARGET_REQUIRED; LINK_SOURCE_UNKNOWN_DEPOT; LINK_TARGET_UNKNOWN_DEPOT; LINK_SELF_LOOP_NOT_SUPPORTED; LINK_DIRECTION_INVALID
  TERMINATION: total
  IF attrs.sourceDepotId is missing THEN RETURN validation error "link_source_required"
  IF attrs.targetDepotId is missing THEN RETURN validation error "link_target_required"
  IF attrs.sourceDepotId not in meshDepots THEN RETURN validation error "link_source_unknown_depot"
  IF attrs.targetDepotId not in meshDepots THEN RETURN validation error "link_target_unknown_depot"
  IF attrs.sourceDepotId = attrs.targetDepotId THEN RETURN validation error "link_self_loop_not_supported"
  IF attrs.direction not in (one_way, bidirectional) THEN RETURN validation error "link_direction_invalid"
  RETURN SyncLink { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), sourceDepotId, targetDepotId, direction: attrs.direction }
```

## VALIDATE_MESH

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Orchestrate mesh_requires_name, zero-or-more depots, ordered depot-then-link validation, and policy default or VALIDATE_POLICY.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH(attrs):
  INPUT: attrs { id?, name, description?, tags?, depots[], links[], policy? }
  OUTPUT: Mesh OR DomainValidationError
  DATA: depots list may be empty; links validated against depot ids after depots built; policy validated or defaulted
  PRE: mesh attribute bag available
  POST: validated Mesh with depots, links, and policy OR first validation error
  EFFECTS: pure
  FAILURE_MODES: MESH_NAME_REQUIRED; DEPOT_VALIDATION; LINK_VALIDATION; POLICY_VALIDATION
  TERMINATION: total
  IF attrs.name is missing OR trim(attrs.name) is empty THEN RETURN validation error "mesh_name_required"
  DATA validatedDepots = empty list
  DATA depotIds = empty set
  FOR EACH depotAttrs IN (attrs.depots OR empty list)
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT(depotAttrs)
    ON error THEN RETURN error
    APPEND validated Depot to validatedDepots
    ADD depot.id to depotIds
  DATA validatedLinks = empty list
  FOR EACH linkAttrs IN (attrs.links OR empty list)
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK(linkAttrs, depotIds)
    ON error THEN RETURN error
    APPEND validated SyncLink to validatedLinks
  IF attrs.policy is missing OR null THEN
    DATA validatedPolicy = CALL IMPL-MESH_DOMAIN_TYPES_DEFAULT_POLICY()
  ELSE
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_POLICY(attrs.policy)
    ON error THEN RETURN error
    DATA validatedPolicy = validated Policy from VALIDATE_POLICY
  RETURN Mesh {
    id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
    name: trim(attrs.name)
    description: attrs.description
    tags: attrs.tags OR []
    depots: validatedDepots
    links: validatedLinks
    policy: validatedPolicy
  }
```

## CREATE_MESH_SNAPSHOT

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Implement sync_session_requires_mesh_snapshot with deep clone and immutable snapshot metadata.

```
IMPL-MESH_DOMAIN_TYPES_CREATE_MESH_SNAPSHOT(mesh):
  INPUT: Mesh (validated)
  OUTPUT: MeshSnapshot
  DATA: snapshot is frozen copy; live mesh edits must not mutate snapshot
  PRE: validated mesh available
  POST: MeshSnapshot with deep-cloned mesh, snapshotId, and capturedAt; no aliasing to live mesh
  EFFECTS: pure
  DATA_TRANSITION: validated Mesh → immutable MeshSnapshot
  TERMINATION: total
  DATA copy = CALL IMPL-MESH_DOMAIN_TYPES_deepCloneMesh(mesh)
  RETURN MeshSnapshot { snapshotId: CALL IMPL-MESH_DOMAIN_TYPES_generateStableId(), capturedAt: CALL IMPL-MESH_DOMAIN_TYPES_nowIso(), mesh: copy }
```

## VALIDATE_SYNC_SESSION

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Enforce sync_session_requires_mesh_snapshot and valid SessionState when state is provided.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_SESSION(attrs):
  INPUT: attrs { id?, meshSnapshot, state? }
  OUTPUT: SyncSession OR DomainValidationError
  DATA: SessionState (idle | scanning | running | paused | completed | failed | cancelled)
  PRE: session attribute bag with meshSnapshot available
  POST: validated SyncSession with default idle state OR validation error
  EFFECTS: pure
  FAILURE_MODES: SESSION_SNAPSHOT_REQUIRED; SESSION_SNAPSHOT_MESH_REQUIRED; SESSION_STATE_INVALID
  TERMINATION: total
  IF attrs.meshSnapshot is missing THEN RETURN validation error "session_snapshot_required"
  IF attrs.meshSnapshot.mesh is missing THEN RETURN validation error "session_snapshot_mesh_required"
  IF attrs.state is present AND attrs.state not in (idle, scanning, running, paused, completed, failed, cancelled) THEN RETURN validation error "session_state_invalid"
  DATA sessionState = attrs.state OR idle
  RETURN SyncSession {
    id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
    meshSnapshot: attrs.meshSnapshot
    state: sessionState
  }
```

## VALIDATE_SYNC_OPERATION

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Validate atomic SyncOperation kind and sourcePath for change-set membership.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_OPERATION(attrs):
  INPUT: attrs { id?, kind, sourcePath, targetPath?, riskLevel? }
  OUTPUT: SyncOperation OR DomainValidationError
  DATA: OperationKind (copy | update | delete | mkdir | verify)
  PRE: operation attribute bag available
  POST: validated SyncOperation with default riskLevel low OR validation error
  EFFECTS: pure
  FAILURE_MODES: OPERATION_KIND_INVALID; OPERATION_SOURCE_PATH_REQUIRED
  TERMINATION: total
  IF attrs.kind not in (copy, update, delete, mkdir, verify) THEN RETURN validation error "operation_kind_invalid"
  IF attrs.sourcePath is missing THEN RETURN validation error "operation_source_path_required"
  RETURN SyncOperation { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), kind, sourcePath, targetPath, riskLevel: attrs.riskLevel OR low }
```

## VALIDATE_CHANGE_SET

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Preserve change_set_contains_ordered_operations by validating each operation in list order.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_CHANGE_SET(attrs):
  INPUT: attrs { id?, operations[] (ordered) }
  OUTPUT: ChangeSet OR DomainValidationError
  PRE: change set attribute bag with operations array available
  POST: validated ChangeSet with ordered operations OR first operation validation error
  EFFECTS: pure
  FAILURE_MODES: CHANGE_SET_OPERATIONS_REQUIRED; OPERATION_VALIDATION
  TERMINATION: total
  IF attrs.operations is missing THEN RETURN validation error "change_set_operations_required"
  DATA validatedOps = empty list
  FOR EACH opAttrs IN attrs.operations IN ORDER
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_OPERATION(opAttrs)
    ON error THEN RETURN error
    APPEND to validatedOps
  RETURN ChangeSet { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), operations: validatedOps }
```

## VALIDATE_CONFLICT

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Enforce conflict_has_type_participants_and_status with enum checks on type and status.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_CONFLICT(attrs):
  INPUT: attrs { id?, type, participants, status }
  OUTPUT: Conflict OR DomainValidationError
  DATA: ConflictType (modify_modify | delete_modify | rename_modify | file_directory); ConflictStatus (pending | resolved | dismissed)
  PRE: conflict attribute bag available
  POST: validated Conflict OR conflict validation error
  EFFECTS: pure
  FAILURE_MODES: CONFLICT_TYPE_REQUIRED; CONFLICT_TYPE_INVALID; CONFLICT_PARTICIPANTS_REQUIRED; CONFLICT_STATUS_INVALID
  TERMINATION: total
  IF attrs.type is missing THEN RETURN validation error "conflict_type_required"
  IF attrs.type not in (modify_modify, delete_modify, rename_modify, file_directory) THEN RETURN validation error "conflict_type_invalid"
  IF attrs.participants is missing OR length(attrs.participants) < 2 THEN RETURN validation error "conflict_participants_required"
  IF attrs.status not in (pending, resolved, dismissed) THEN RETURN validation error "conflict_status_invalid"
  RETURN Conflict { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), type, participants, status }
```

## VALIDATE_FILTER

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Phase-1 Filter shape (pattern + include/exclude mode) for later policy engine integration.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_FILTER(attrs):
  INPUT: attrs { pattern, mode }
  OUTPUT: Filter OR DomainValidationError
  DATA: FilterMode (include | exclude)
  PRE: filter attribute bag available
  POST: validated Filter OR filter validation error
  EFFECTS: pure
  FAILURE_MODES: FILTER_PATTERN_REQUIRED; FILTER_MODE_INVALID
  TERMINATION: total
  IF attrs.pattern is missing OR empty THEN RETURN validation error "filter_pattern_required"
  IF attrs.mode not in (include, exclude) THEN RETURN validation error "filter_mode_invalid"
  RETURN Filter { pattern: attrs.pattern, mode: attrs.mode }
```

## VALIDATE_SYNC_EVENT

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Validate SyncEvent audit fields (timestamp, type, subject) for future event-log IMPL.

```
IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_EVENT(attrs):
  INPUT: attrs { id?, timestamp, type, subject, payload }
  OUTPUT: SyncEvent OR DomainValidationError
  PRE: sync event attribute bag available
  POST: validated SyncEvent with default empty payload OR validation error
  EFFECTS: pure
  FAILURE_MODES: EVENT_TIMESTAMP_REQUIRED; EVENT_TYPE_REQUIRED; EVENT_SUBJECT_REQUIRED
  TERMINATION: total
  IF attrs.timestamp is missing THEN RETURN validation error "event_timestamp_required"
  IF attrs.type is missing THEN RETURN validation error "event_type_required"
  IF attrs.subject is missing THEN RETURN validation error "event_subject_required"
  RETURN SyncEvent { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), timestamp, type, subject, payload: attrs.payload OR {} }
```

## MESH_ROUND_TRIP_SERIALIZATION

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Support all_core_objects_can_be_serialized and invalid_core_objects_are_rejected via mesh and credential round-trips.

```
IMPL-MESH_DOMAIN_TYPES_TO_DTO_MESH(mesh):
  INPUT: Mesh entity
  OUTPUT: Mesh DTO
  DATA: JSON-safe plain objects only
  PRE: validated Mesh available
  POST: mesh serialized to DTO with nested depot/link/policy DTO parts
  EFFECTS: pure
  TERMINATION: total
  FOR EACH depot IN mesh.depots CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_DEPOT(depot)
  FOR EACH link IN mesh.links CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_SYNC_LINK(link)
  RETURN DTO { id, name, description, tags, depots, links, policy: CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_POLICY(mesh.policy) }

IMPL-MESH_DOMAIN_TYPES_FROM_DTO_MESH(dto):
  INPUT: Mesh DTO
  OUTPUT: Mesh OR DomainValidationError
  PRE: mesh DTO available
  POST: validated Mesh returned via VALIDATE_MESH OR validation error
  EFFECTS: pure
  FAILURE_MODES: MESH_VALIDATION
  TERMINATION: total
  CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH(dto)
  ON error THEN RETURN error
  RETURN validated Mesh
```

## IntraImplComposition

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Document phase-1 internal call graph only — no cross-IMPL runtime calls (depends_on and composed_with empty).

// INTRA_IMPL_CALL graph (all callee procedures are [IMPL-MESH_DOMAIN_TYPES]):
//   VALIDATE_MESH → VALIDATE_DEPOT (per depot, sequential)
//   VALIDATE_MESH → VALIDATE_SYNC_LINK (per link; pre: depotIds built)
//   VALIDATE_MESH → DEFAULT_POLICY | VALIDATE_POLICY (mutually exclusive for mesh.policy)
//   VALIDATE_CHANGE_SET → VALIDATE_SYNC_OPERATION (per op, strict list order)
//   FROM_DTO_MESH → VALIDATE_MESH
//   FROM_DTO_CREDENTIAL_REFERENCE → VALIDATE_CREDENTIAL_REFERENCE
//   TO_DTO_MESH → TO_DTO_DEPOT, TO_DTO_SYNC_LINK, TO_DTO_POLICY
//   CREATE_MESH_SNAPSHOT → deepCloneMesh; generateStableId; nowIso
//   resolveEntityId → generateStableId (when id omitted)
// SHARED_DATA: depotIds set from validated depots is pre-condition for VALIDATE_SYNC_LINK in same VALIDATE_MESH invocation.
// POST_CONDITION: CREATE_MESH_SNAPSHOT input mesh must already be validated; snapshot.mesh must not alias live mesh.

## E2eOnlyBoundary

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Phase H — no E2E-only blocks in phase 1.

// E2E-only: none. All blocks are synchronous pure functions with no DOM, Next.js routes, native OS dialogs, or visual rendering.
// Decision gate: every trigger is a direct function call observable in Vitest without a browser.
// testability remains unit; bindings covered by domain.composition.test.ts (Phase G). Playwright harness exists at repo e2e/ but is N/A for this IMPL.
// Phase H end-to-end-ui: skipped per citdp/test policy — zero UI-only behavior to justify e2e_only or Playwright tests.

## CodeLocations

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map pseudo-code procedures to src/lib/mesh/domain files for implementation and colocated Vitest tests.

// FILE: src/lib/mesh/domain/types.ts — domain entity and enum types
// FILE: src/lib/mesh/domain/internal.ts — generateStableId, resolveEntityId, validateEach, isRecord helpers
// FILE: src/lib/mesh/domain/validators.ts — VALIDATE_* procedures
// FILE: src/lib/mesh/domain/serialize.ts — TO_DTO / FROM_DTO procedures
// FILE: src/lib/mesh/domain/index.ts — public exports
// FILE: src/lib/mesh/domain/validators.test.ts — unit tests per REQ satisfaction criteria
// FILE: src/lib/mesh/domain/serialize.test.ts — round-trip and secret-leak tests
// FILE: src/lib/mesh/domain/domain.composition.test.ts — Phase G composition tests (public index.ts bindings per IntraImplComposition)

## ErrorHandling

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Propagate DomainValidationError on all fallible paths; defer exported on_error until logging IMPL exists.

```
IMPL-MESH_DOMAIN_TYPES_on_error(context, error):
  INPUT: context (string), error (DomainValidationError)
  OUTPUT: same DomainValidationError (unchanged)
  CONTROL: not exported from index.ts in phase 1
  PRE: validation error occurred during domain operation
  POST: diagnostic logged; error returned unchanged without mutating partial entities
  EFFECTS: pure
  TERMINATION: total
  LOG DIAGNOSTIC with [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [REQ-MESH_DOMAIN_MODEL]
  RETURN error to caller without mutation of partial entities
```
