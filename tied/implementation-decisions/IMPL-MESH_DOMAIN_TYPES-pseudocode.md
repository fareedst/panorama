# IMPL-MESH_DOMAIN_TYPES essence pseudocode

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Top-level Mesh Domain Types — pure domain entities, validators, and JSON-safe DTO serialization for phase 1 (no I/O)

## Summary contract

// how: Declare module-wide synchronous pure-function contract; no I/O imports per ARCH-MESH_DOMAIN L1 boundary.

CONTRACT Summary
  INPUT: raw attribute bags or DTO objects from callers (services, tests)
  OUTPUT: validated domain entities, validation errors, or JSON-safe DTOs
  DATA: Mesh, Depot, SyncLink, Policy, Filter, CredentialReference, SyncSession, MeshSnapshot, ChangeSet, SyncOperation, SyncEvent, Conflict; DomainValidationError
  CONTROL: validation runs before entity is considered constructed; serialization strips secrets

## InternalHelpers

// how: Private helpers in internal.ts (not exported from index.ts); shared by validators and snapshot procedures.

CONTRACT GenerateStableId
  INPUT: (none)
  OUTPUT: non-empty string id (UUID in TypeScript via crypto.randomUUID)

// how: Allocate a new stable string id for entities missing an explicit id.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_generateStableId()
  RETURN new unique string id

CONTRACT ResolveEntityId
  INPUT: attrs with optional id field
  OUTPUT: attrs.id when non-empty string, else CALL generateStableId()

// how: Prefer caller-supplied id when non-empty; otherwise generate a new id.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
  IF attrs.id is present AND non-empty string THEN RETURN attrs.id
  RETURN CALL IMPL-MESH_DOMAIN_TYPES_generateStableId()

CONTRACT DeepCloneMesh
  INPUT: Mesh (validated)
  OUTPUT: deep copy of Mesh with no shared nested references (TypeScript: structuredClone)

// how: Deep-clone validated mesh so session snapshots never alias live configuration.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_deepCloneMesh(mesh)
  RETURN deep copy of mesh graph without aliasing nested depots/links/policy

CONTRACT NowIso
  INPUT: (none)
  OUTPUT: ISO-8601 timestamp string (TypeScript: new Date().toISOString())

// how: Capture snapshot timestamp as ISO-8601 for MeshSnapshot.capturedAt.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_nowIso()
  RETURN current time as ISO-8601 string

## DomainValidationError

// how: Build structured validation errors with path, code, and message for all VALIDATE_* reject paths.

CONTRACT DomainValidationError
  INPUT: field path, machine code, human message
  OUTPUT: DomainValidationError instance
  DATA: code (string), path (string), message (string)

// how: Factory for DomainValidationError; reject empty machine codes at the factory itself.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_MakeValidationError(fieldPath, code, message)
  RETURN { code, path: fieldPath, message }
  ON empty code THEN RETURN validation error "validation_code_required"

## DEFAULT_POLICY

// how: Supply non-destructive policy defaults for policy_has_default_safe_values and mesh policy omission.

CONTRACT DefaultPolicy
  INPUT: (none)
  OUTPUT: Policy with safe defaults
  DATA: deletePolicy=never, conflictPolicy=prefer_authoritative, retryMaxAttempts=3, verificationMode=size_mtime

// how: Return Policy with delete never, prefer_authoritative conflict, bounded retries, size_mtime verification.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_DEFAULT_POLICY()
  RETURN Policy {
    deletePolicy: never
    conflictPolicy: prefer_authoritative
    retryMaxAttempts: 3
    verificationMode: size_mtime
  }

## VALIDATE_POLICY

// how: Validate optional inline policy fields on mesh DTOs before accepting a Mesh.policy value.

CONTRACT ValidatePolicy
  INPUT: attrs { deletePolicy?, conflictPolicy?, retryMaxAttempts?, verificationMode? }
  OUTPUT: Policy OR DomainValidationError
  DATA: DeletePolicy (never | prompt | allow); ConflictPolicy (prefer_authoritative | prefer_newer | manual); VerificationMode (none | size_mtime | checksum)

// how: Reject invalid policy enums and retry bounds; merge omitted fields with same safe defaults as DEFAULT_POLICY.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_POLICY(attrs)
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

## VALIDATE_CREDENTIAL_REFERENCE

// how: Enforce credential_reference_does_not_expose_secret_material at construction and deserialization.

CONTRACT ValidateCredentialReference
  INPUT: attrs { id, label, secret? }
  OUTPUT: CredentialReference OR DomainValidationError
  DATA: CredentialReference { id, label }

// how: Require id and label; reject any secret field on domain credential references.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_CREDENTIAL_REFERENCE(attrs)
  IF attrs.id is missing OR empty THEN RETURN validation error "credential_id_required"
  IF attrs.label is missing OR empty THEN RETURN validation error "credential_label_required"
  IF attrs.secret is present THEN RETURN validation error "credential_secret_not_allowed_in_domain"
  RETURN CredentialReference { id: attrs.id, label: attrs.label }

## SERIALIZE_CREDENTIAL_REFERENCE

// how: JSON-safe credential DTO mapping; round-trip reuses VALIDATE_CREDENTIAL_REFERENCE on deserialize.

CONTRACT SerializeCredentialReference
  INPUT: CredentialReference
  OUTPUT: DTO { id, label }
  DATA: (no secret field on DTO)

// how: Emit id and label only on DTO (no secret field).

PROCEDURE IMPL-MESH_DOMAIN_TYPES_TO_DTO_CREDENTIAL_REFERENCE(ref)
  RETURN { id: ref.id, label: ref.label }

// how: Deserialize DTO by delegating to VALIDATE_CREDENTIAL_REFERENCE (intra-IMPL call).

PROCEDURE IMPL-MESH_DOMAIN_TYPES_FROM_DTO_CREDENTIAL_REFERENCE(dto)
  CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_CREDENTIAL_REFERENCE(dto)
  ON error THEN RETURN error
  RETURN validated CredentialReference

## VALIDATE_DEPOT

// how: Enforce depot_requires_name_kind_and_root and DepotKind enum for each depot in a mesh.

CONTRACT ValidateDepot
  INPUT: attrs { id?, name, kind, root, credentialReferenceId?, accessMode? }
  OUTPUT: Depot OR DomainValidationError
  DATA: DepotKind enum (local | remote | virtual)

// how: Validate name, kind, root; assign id; default accessMode to read_write; phase 1 skips relative-root policy engine branch.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT(attrs)
  IF attrs.name is missing OR trim(attrs.name) is empty THEN RETURN validation error "depot_name_required"
  IF attrs.kind not in (local, remote, virtual) THEN RETURN validation error "depot_kind_invalid"
  IF attrs.root is missing OR trim(attrs.root) is empty THEN RETURN validation error "depot_root_required"
  // Phase 1: relative local root vs policy engine is out of scope — no branch; absolute/relative roots accepted after name/kind/root checks.
  ASSIGN depotId = CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
  RETURN Depot { id: depotId, name: trim(attrs.name), kind: attrs.kind, root: attrs.root, credentialReferenceId: attrs.credentialReferenceId, accessMode: attrs.accessMode OR read_write }

## TO_DTO_DEPOT

// how: Map validated Depot entity to JSON-safe DTO for mesh serialization.

CONTRACT ToDtoDepot
  INPUT: Depot
  OUTPUT: depot DTO

// how: Copy depot fields to plain object (no secrets on depot DTO).

PROCEDURE IMPL-MESH_DOMAIN_TYPES_TO_DTO_DEPOT(depot)
  RETURN { id, name, kind, root, credentialReferenceId, accessMode } from depot

## TO_DTO_SYNC_LINK

// how: Map validated SyncLink entity to JSON-safe DTO for mesh serialization.

CONTRACT ToDtoSyncLink
  INPUT: SyncLink
  OUTPUT: link DTO

// how: Copy link id and depot endpoints to plain object.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_TO_DTO_SYNC_LINK(link)
  RETURN { id, sourceDepotId, targetDepotId, direction } from link

## TO_DTO_POLICY

// how: Map validated Policy entity to JSON-safe DTO embedded in mesh DTO.

CONTRACT ToDtoPolicy
  INPUT: Policy
  OUTPUT: policy DTO

// how: Expose policy fields as plain object with same names as domain Policy.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_TO_DTO_POLICY(policy)
  RETURN policy fields as plain object

## VALIDATE_SYNC_LINK

// how: Enforce sync_link_requires_valid_source_and_target_depots against mesh depot id set; reject self-loops.

CONTRACT ValidateSyncLink
  INPUT: attrs { id?, sourceDepotId, targetDepotId, direction }, meshDepots (set of depot ids)
  OUTPUT: SyncLink OR DomainValidationError
  DATA: LinkDirection (one_way | bidirectional)

// how: Require known source/target depots, valid direction, and no self-loop; assign link id when omitted.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK(attrs, meshDepots)
  IF attrs.sourceDepotId is missing THEN RETURN validation error "link_source_required"
  IF attrs.targetDepotId is missing THEN RETURN validation error "link_target_required"
  IF attrs.sourceDepotId not in meshDepots THEN RETURN validation error "link_source_unknown_depot"
  IF attrs.targetDepotId not in meshDepots THEN RETURN validation error "link_target_unknown_depot"
  IF attrs.sourceDepotId = attrs.targetDepotId THEN RETURN validation error "link_self_loop_not_supported"
  IF attrs.direction not in (one_way, bidirectional) THEN RETURN validation error "link_direction_invalid"
  RETURN SyncLink { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), sourceDepotId, targetDepotId, direction: attrs.direction }

## VALIDATE_MESH

// how: Orchestrate mesh_requires_name, zero-or-more depots, ordered depot-then-link validation, and policy default or VALIDATE_POLICY.

CONTRACT ValidateMesh
  INPUT: attrs { id?, name, description?, tags?, depots[], links[], policy? }
  OUTPUT: Mesh OR DomainValidationError
  DATA: depots list may be empty; links validated against depot ids after depots built; policy validated or defaulted

// how: Validate mesh name; foreach depot CALL VALIDATE_DEPOT; build depotIds; foreach link CALL VALIDATE_SYNC_LINK; resolve policy via DEFAULT_POLICY or VALIDATE_POLICY.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH(attrs)
  IF attrs.name is missing OR trim(attrs.name) is empty THEN RETURN validation error "mesh_name_required"
  DATA validatedDepots = empty list
  DATA depotIds = empty set
  FOR EACH depotAttrs IN (attrs.depots OR empty list)
    // intra-IMPL [IMPL-MESH_DOMAIN_TYPES]: CALL VALIDATE_DEPOT — implements depot_requires_name_kind_and_root within mesh graph build.
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT(depotAttrs)
    ON error THEN RETURN error
    APPEND validated Depot to validatedDepots
    ADD depot.id to depotIds
  DATA validatedLinks = empty list
  FOR EACH linkAttrs IN (attrs.links OR empty list)
    // intra-IMPL [IMPL-MESH_DOMAIN_TYPES]: CALL VALIDATE_SYNC_LINK — implements sync_link_requires_valid_source_and_target_depots using depotIds from prior loop.
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK(linkAttrs, depotIds)
    ON error THEN RETURN error
    APPEND validated SyncLink to validatedLinks
  IF attrs.policy is missing OR null THEN
    // intra-IMPL [IMPL-MESH_DOMAIN_TYPES]: CALL DEFAULT_POLICY — implements policy_has_default_safe_values when mesh omits policy.
    DATA validatedPolicy = CALL IMPL-MESH_DOMAIN_TYPES_DEFAULT_POLICY()
  ELSE
    // intra-IMPL [IMPL-MESH_DOMAIN_TYPES]: CALL VALIDATE_POLICY — validates supplied mesh policy before assignment.
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

## CREATE_MESH_SNAPSHOT

// how: Implement sync_session_requires_mesh_snapshot with deep clone and immutable snapshot metadata.

CONTRACT CreateMeshSnapshot
  INPUT: Mesh (validated)
  OUTPUT: MeshSnapshot
  DATA: snapshot is frozen copy; live mesh edits must not mutate snapshot

// how: Deep-clone mesh, assign snapshotId and capturedAt; post-condition: snapshot mesh does not alias live mesh.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_CREATE_MESH_SNAPSHOT(mesh)
  DATA copy = CALL IMPL-MESH_DOMAIN_TYPES_deepCloneMesh(mesh)
  RETURN MeshSnapshot { snapshotId: CALL IMPL-MESH_DOMAIN_TYPES_generateStableId(), capturedAt: CALL IMPL-MESH_DOMAIN_TYPES_nowIso(), mesh: copy }

## VALIDATE_SYNC_SESSION

// how: Enforce sync_session_requires_mesh_snapshot and valid SessionState when state is provided.

CONTRACT ValidateSyncSession
  INPUT: attrs { id?, meshSnapshot, state? }
  OUTPUT: SyncSession OR DomainValidationError
  DATA: SessionState (idle | scanning | running | paused | completed | failed | cancelled)

// how: Require meshSnapshot.mesh; reject invalid state; default missing state to idle.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_SESSION(attrs)
  IF attrs.meshSnapshot is missing THEN RETURN validation error "session_snapshot_required"
  IF attrs.meshSnapshot.mesh is missing THEN RETURN validation error "session_snapshot_mesh_required"
  IF attrs.state is present AND attrs.state not in (idle, scanning, running, paused, completed, failed, cancelled) THEN RETURN validation error "session_state_invalid"
  DATA sessionState = attrs.state OR idle
  RETURN SyncSession {
    id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs)
    meshSnapshot: attrs.meshSnapshot
    state: sessionState
  }

## VALIDATE_SYNC_OPERATION

// how: Validate atomic SyncOperation kind and sourcePath for change-set membership.

CONTRACT ValidateSyncOperation
  INPUT: attrs { id?, kind, sourcePath, targetPath?, riskLevel? }
  OUTPUT: SyncOperation OR DomainValidationError
  DATA: OperationKind (copy | update | delete | mkdir | verify)

// how: Reject invalid operation kind or missing sourcePath; default riskLevel to low.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_OPERATION(attrs)
  IF attrs.kind not in (copy, update, delete, mkdir, verify) THEN RETURN validation error "operation_kind_invalid"
  IF attrs.sourcePath is missing THEN RETURN validation error "operation_source_path_required"
  RETURN SyncOperation { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), kind, sourcePath, targetPath, riskLevel: attrs.riskLevel OR low }

## VALIDATE_CHANGE_SET

// how: Preserve change_set_contains_ordered_operations by validating each operation in list order.

CONTRACT ValidateChangeSet
  INPUT: attrs { id?, operations[] (ordered) }
  OUTPUT: ChangeSet OR DomainValidationError

// how: Require operations array; foreach operation CALL VALIDATE_SYNC_OPERATION in order; abort on first error.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_CHANGE_SET(attrs)
  IF attrs.operations is missing THEN RETURN validation error "change_set_operations_required"
  DATA validatedOps = empty list
  FOR EACH opAttrs IN attrs.operations IN ORDER
    // intra-IMPL [IMPL-MESH_DOMAIN_TYPES]: CALL VALIDATE_SYNC_OPERATION — preserves ordered validation per change_set_contains_ordered_operations.
    CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_OPERATION(opAttrs)
    ON error THEN RETURN error
    APPEND to validatedOps
  RETURN ChangeSet { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), operations: validatedOps }

## VALIDATE_CONFLICT

// how: Enforce conflict_has_type_participants_and_status with enum checks on type and status.

CONTRACT ValidateConflict
  INPUT: attrs { id?, type, participants, status }
  OUTPUT: Conflict OR DomainValidationError
  DATA: ConflictType (modify_modify | delete_modify | rename_modify | file_directory); ConflictStatus (pending | resolved | dismissed)

// how: Require type in ConflictType enum, at least two participants, and valid ConflictStatus.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_CONFLICT(attrs)
  IF attrs.type is missing THEN RETURN validation error "conflict_type_required"
  IF attrs.type not in (modify_modify, delete_modify, rename_modify, file_directory) THEN RETURN validation error "conflict_type_invalid"
  IF attrs.participants is missing OR length(attrs.participants) < 2 THEN RETURN validation error "conflict_participants_required"
  IF attrs.status not in (pending, resolved, dismissed) THEN RETURN validation error "conflict_status_invalid"
  RETURN Conflict { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), type, participants, status }

## VALIDATE_FILTER

// how: Phase-1 Filter shape (pattern + include/exclude mode) for later policy engine integration.

CONTRACT ValidateFilter
  INPUT: attrs { pattern, mode }
  OUTPUT: Filter OR DomainValidationError
  DATA: FilterMode (include | exclude)

// how: Require non-empty pattern and valid FilterMode enum.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_FILTER(attrs)
  IF attrs.pattern is missing OR empty THEN RETURN validation error "filter_pattern_required"
  IF attrs.mode not in (include, exclude) THEN RETURN validation error "filter_mode_invalid"
  RETURN Filter { pattern: attrs.pattern, mode: attrs.mode }

## VALIDATE_SYNC_EVENT

// how: Validate SyncEvent audit fields (timestamp, type, subject) for future event-log IMPL.

CONTRACT ValidateSyncEvent
  INPUT: attrs { id?, timestamp, type, subject, payload }
  OUTPUT: SyncEvent OR DomainValidationError

// how: Require timestamp, type, and subject; default payload to empty object.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_EVENT(attrs)
  IF attrs.timestamp is missing THEN RETURN validation error "event_timestamp_required"
  IF attrs.type is missing THEN RETURN validation error "event_type_required"
  IF attrs.subject is missing THEN RETURN validation error "event_subject_required"
  RETURN SyncEvent { id: CALL IMPL-MESH_DOMAIN_TYPES_resolveEntityId(attrs), timestamp, type, subject, payload: attrs.payload OR {} }

## MESH_ROUND_TRIP_SERIALIZATION

// how: Support all_core_objects_can_be_serialized and invalid_core_objects_are_rejected via mesh and credential round-trips.

// Phase 1 scope: standalone round-trip required for CredentialReference (TO/FROM_DTO) and Mesh aggregate (TO_DTO_MESH / FROM_DTO_MESH).
// Other core entities are validated via VALIDATE_* and serialized nested inside mesh DTOs (depots, links, policy) — no separate FROM_DTO per leaf type in phase 1.

CONTRACT MeshRoundTrip
  INPUT: Mesh entity OR Mesh DTO
  OUTPUT: Mesh DTO OR Mesh entity
  DATA: JSON-safe plain objects only

// how: Serialize mesh by mapping depots, links, and policy to DTO parts.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_TO_DTO_MESH(mesh)
  FOR EACH depot IN mesh.depots CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_DEPOT(depot)
  FOR EACH link IN mesh.links CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_SYNC_LINK(link)
  RETURN DTO { id, name, description, tags, depots, links, policy: CALL IMPL-MESH_DOMAIN_TYPES_TO_DTO_POLICY(mesh.policy) }

// how: Deserialize mesh DTO by CALL VALIDATE_MESH so invalid_core_objects_are_rejected on FROM_DTO.

PROCEDURE IMPL-MESH_DOMAIN_TYPES_FROM_DTO_MESH(dto)
  CALL IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH(dto)
  ON error THEN RETURN error
  RETURN validated Mesh

## IntraImplComposition

// how: Document phase-1 internal call graph only — no cross-IMPL runtime calls (depends_on and composed_with empty).

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

// E2E-only: none. All CONTRACT/PROCEDURE blocks are synchronous pure functions with no DOM, Next.js routes, native OS dialogs, or visual rendering.
// Decision gate: every trigger is a direct function call observable in Vitest without a browser.
// testability remains unit; bindings covered by domain.composition.test.ts (Phase G). Playwright harness exists at repo e2e/ but is N/A for this IMPL.
// Phase H end-to-end-ui: skipped per citdp/test policy — zero UI-only behavior to justify e2e_only or Playwright tests.

## CodeLocations

// how: Map pseudo-code procedures to src/lib/mesh/domain files for implementation and colocated Vitest tests.

// FILE: src/lib/mesh/domain/types.ts — domain entity and enum types
// FILE: src/lib/mesh/domain/internal.ts — generateStableId, resolveEntityId, validateEach, isRecord helpers
// FILE: src/lib/mesh/domain/validators.ts — VALIDATE_* procedures
// FILE: src/lib/mesh/domain/serialize.ts — TO_DTO / FROM_DTO procedures
// FILE: src/lib/mesh/domain/index.ts — public exports
// FILE: src/lib/mesh/domain/validators.test.ts — unit tests per REQ satisfaction criteria
// FILE: src/lib/mesh/domain/serialize.test.ts — round-trip and secret-leak tests
// FILE: src/lib/mesh/domain/domain.composition.test.ts — Phase G composition tests (public index.ts bindings per IntraImplComposition)

## ErrorHandling

// how: Propagate DomainValidationError on all fallible paths; defer exported on_error until logging IMPL exists.

CONTRACT OnError
  INPUT: context (string), error (DomainValidationError)
  OUTPUT: same DomainValidationError (unchanged)
  CONTROL: not exported from index.ts in phase 1

// how: Log diagnostic context then return error unchanged without mutating partial entities (not exported phase 1).

PROCEDURE IMPL-MESH_DOMAIN_TYPES_on_error(context, error)
  LOG DIAGNOSTIC with [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [REQ-MESH_DOMAIN_MODEL]
  RETURN error to caller without mutation of partial entities
