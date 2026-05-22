// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: VALIDATE_* procedures — pure domain validation per essence_pseudocode

import {
  asStringArray,
  asUnknownArray,
  generateStableId,
  isDomainValidationError,
  isOneOf,
  isPresent,
  isPresentAndNotOneOf,
  isRecord,
  nonEmptyString,
  optionalString,
  resolveEntityId,
  validateEach,
} from "./internal";
import type {
  AccessMode,
  ChangeSet,
  Conflict,
  ConflictType,
  ConflictStatus,
  ConflictPolicy,
  CredentialReference,
  DeletePolicy,
  Depot,
  DepotKind,
  DomainValidationError,
  Filter,
  FilterMode,
  LinkDirection,
  Mesh,
  MeshSnapshot,
  OperationKind,
  Policy,
  RiskLevel,
  SessionState,
  SyncEvent,
  SyncLink,
  SyncOperation,
  SyncSession,
  VerificationMode,
} from "./types";

export { isDomainValidationError };

const DELETE_POLICIES: readonly DeletePolicy[] = ["never", "prompt", "allow"];
const CONFLICT_POLICIES: readonly ConflictPolicy[] = [
  "prefer_authoritative",
  "prefer_newer",
  "manual",
];
const VERIFICATION_MODES: readonly VerificationMode[] = ["none", "size_mtime", "checksum"];
const DEPOT_KINDS: readonly DepotKind[] = ["local", "remote", "virtual"];
const LINK_DIRECTIONS: readonly LinkDirection[] = ["one_way", "bidirectional"];
const SESSION_STATES: readonly SessionState[] = [
  "idle",
  "scanning",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
];
const OPERATION_KINDS: readonly OperationKind[] = [
  "copy",
  "update",
  "delete",
  "mkdir",
  "verify",
];
const CONFLICT_TYPES: readonly ConflictType[] = [
  "modify_modify",
  "delete_modify",
  "rename_modify",
  "file_directory",
];
const CONFLICT_STATUSES: readonly ConflictStatus[] = ["pending", "resolved", "dismissed"];
const FILTER_MODES: readonly FilterMode[] = ["include", "exclude"];

// how: Build structured validation errors with path, code, and message for all VALIDATE_* reject paths.

export function makeValidationError(
  fieldPath: string,
  code: string,
  message: string,
): DomainValidationError {
  if (!nonEmptyString(code)) {
    return {
      code: "validation_code_required",
      path: fieldPath,
      message: "Validation code is required",
    };
  }
  return { code, path: fieldPath, message };
}

// how: Supply non-destructive policy defaults for policy_has_default_safe_values and mesh policy omission.

export function defaultPolicy(): Policy {
  return {
    deletePolicy: "never",
    conflictPolicy: "prefer_authoritative",
    retryMaxAttempts: 3,
    verificationMode: "size_mtime",
  };
}

// how: Validate optional inline policy fields on mesh DTOs before accepting a Mesh.policy value.

export function validatePolicy(attrs: unknown): Policy | DomainValidationError {
  if (!isRecord(attrs)) {
    return defaultPolicy();
  }
  if (isPresentAndNotOneOf(attrs.deletePolicy, DELETE_POLICIES)) {
    return makeValidationError(
      "policy.deletePolicy",
      "policy_delete_invalid",
      "Policy deletePolicy is invalid",
    );
  }
  if (isPresentAndNotOneOf(attrs.conflictPolicy, CONFLICT_POLICIES)) {
    return makeValidationError(
      "policy.conflictPolicy",
      "policy_conflict_invalid",
      "Policy conflictPolicy is invalid",
    );
  }
  if (
    isPresent(attrs.retryMaxAttempts) &&
    (typeof attrs.retryMaxAttempts !== "number" || attrs.retryMaxAttempts < 1)
  ) {
    return makeValidationError(
      "policy.retryMaxAttempts",
      "policy_retry_max_invalid",
      "Policy retryMaxAttempts must be at least 1",
    );
  }
  if (isPresentAndNotOneOf(attrs.verificationMode, VERIFICATION_MODES)) {
    return makeValidationError(
      "policy.verificationMode",
      "policy_verification_invalid",
      "Policy verificationMode is invalid",
    );
  }
  const defaults = defaultPolicy();
  return {
    deletePolicy: (attrs.deletePolicy as DeletePolicy | undefined) ?? defaults.deletePolicy,
    conflictPolicy:
      (attrs.conflictPolicy as ConflictPolicy | undefined) ?? defaults.conflictPolicy,
    retryMaxAttempts:
      (attrs.retryMaxAttempts as number | undefined) ?? defaults.retryMaxAttempts,
    verificationMode:
      (attrs.verificationMode as VerificationMode | undefined) ?? defaults.verificationMode,
  };
}

function resolveMeshPolicy(policy: unknown): Policy | DomainValidationError {
  return isPresent(policy) ? validatePolicy(policy) : defaultPolicy();
}

// how: Validate record shape; assign id via resolveEntityId when omitted; forbid secret payloads on domain references.

export function validateCredentialReference(
  attrs: unknown,
): CredentialReference | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("credential", "credential_id_required", "Credential id is required");
  }
  if (!nonEmptyString(attrs.label)) {
    return makeValidationError(
      "credential.label",
      "credential_label_required",
      "Credential label is required",
    );
  }
  if ("secret" in attrs && attrs.secret !== undefined) {
    return makeValidationError(
      "credential.secret",
      "credential_secret_not_allowed_in_domain",
      "Secret material is not allowed on domain credential references",
    );
  }
  return { id: resolveEntityId(attrs), label: attrs.label };
}

// how: Enforce depot_requires_name_kind_and_root and DepotKind enum for each depot in a mesh.

export function validateDepot(attrs: unknown): Depot | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("depot.name", "depot_name_required", "Depot name is required");
  }
  if (!nonEmptyString(attrs.name)) {
    return makeValidationError("depot.name", "depot_name_required", "Depot name is required");
  }
  if (!isOneOf(attrs.kind, DEPOT_KINDS)) {
    return makeValidationError("depot.kind", "depot_kind_invalid", "Depot kind is invalid");
  }
  if (!nonEmptyString(attrs.root)) {
    return makeValidationError("depot.root", "depot_root_required", "Depot root is required");
  }
  return {
    id: resolveEntityId(attrs),
    name: attrs.name.trim(),
    kind: attrs.kind,
    root: attrs.root,
    credentialReferenceId: optionalString(attrs.credentialReferenceId),
    accessMode: (attrs.accessMode as AccessMode | undefined) ?? "read_write",
  };
}

// how: Enforce sync_link_requires_valid_source_and_target_depots against mesh depot id set; reject self-loops.

export function validateSyncLink(
  attrs: unknown,
  meshDepots: ReadonlySet<string>,
): SyncLink | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("link.sourceDepotId", "link_source_required", "Link source is required");
  }
  if (!nonEmptyString(attrs.sourceDepotId)) {
    return makeValidationError("link.sourceDepotId", "link_source_required", "Link source is required");
  }
  if (!nonEmptyString(attrs.targetDepotId)) {
    return makeValidationError("link.targetDepotId", "link_target_required", "Link target is required");
  }
  if (!meshDepots.has(attrs.sourceDepotId)) {
    return makeValidationError(
      "link.sourceDepotId",
      "link_source_unknown_depot",
      "Link source depot is unknown",
    );
  }
  if (!meshDepots.has(attrs.targetDepotId)) {
    return makeValidationError(
      "link.targetDepotId",
      "link_target_unknown_depot",
      "Link target depot is unknown",
    );
  }
  if (attrs.sourceDepotId === attrs.targetDepotId) {
    return makeValidationError(
      "link",
      "link_self_loop_not_supported",
      "Self-loop links are not supported",
    );
  }
  if (!isOneOf(attrs.direction, LINK_DIRECTIONS)) {
    return makeValidationError("link.direction", "link_direction_invalid", "Link direction is invalid");
  }
  return {
    id: resolveEntityId(attrs),
    sourceDepotId: attrs.sourceDepotId,
    targetDepotId: attrs.targetDepotId,
    direction: attrs.direction,
  };
}

// how: Orchestrate mesh_requires_name, zero-or-more depots, ordered depot-then-link validation, and policy default or VALIDATE_POLICY.

export function validateMesh(attrs: unknown): Mesh | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("mesh.name", "mesh_name_required", "Mesh name is required");
  }
  if (!nonEmptyString(attrs.name)) {
    return makeValidationError("mesh.name", "mesh_name_required", "Mesh name is required");
  }

  const depotResults = validateEach(asUnknownArray(attrs.depots), validateDepot);
  if (isDomainValidationError(depotResults)) {
    return depotResults;
  }

  const depotIds = new Set(depotResults.map((depot) => depot.id));
  const linkResults = validateEach(asUnknownArray(attrs.links), (linkAttrs) =>
    validateSyncLink(linkAttrs, depotIds),
  );
  if (isDomainValidationError(linkResults)) {
    return linkResults;
  }

  const validatedPolicy = resolveMeshPolicy(attrs.policy);
  if (isDomainValidationError(validatedPolicy)) {
    return validatedPolicy;
  }

  return {
    id: resolveEntityId(attrs),
    name: attrs.name.trim(),
    description: optionalString(attrs.description),
    tags: asStringArray(attrs.tags),
    depots: depotResults,
    links: linkResults,
    policy: validatedPolicy,
  };
}

// how: Implement sync_session_requires_mesh_snapshot with deep clone and immutable snapshot metadata.

export function createMeshSnapshot(mesh: Mesh): MeshSnapshot {
  return {
    snapshotId: generateStableId(),
    capturedAt: new Date().toISOString(),
    mesh: structuredClone(mesh),
  };
}

// how: Enforce sync_session_requires_mesh_snapshot and valid SessionState when state is provided.

export function validateSyncSession(attrs: unknown): SyncSession | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError(
      "session.meshSnapshot",
      "session_snapshot_required",
      "Session mesh snapshot is required",
    );
  }
  if (attrs.meshSnapshot === undefined || attrs.meshSnapshot === null) {
    return makeValidationError(
      "session.meshSnapshot",
      "session_snapshot_required",
      "Session mesh snapshot is required",
    );
  }
  const meshSnapshot = attrs.meshSnapshot as MeshSnapshot;
  if (!meshSnapshot.mesh) {
    return makeValidationError(
      "session.meshSnapshot.mesh",
      "session_snapshot_mesh_required",
      "Session snapshot mesh is required",
    );
  }
  if (isPresentAndNotOneOf(attrs.state, SESSION_STATES)) {
    return makeValidationError(
      "session.state",
      "session_state_invalid",
      "Session state is invalid",
    );
  }
  const sessionState: SessionState = isPresent(attrs.state)
    ? (attrs.state as SessionState)
    : "idle";
  return {
    id: resolveEntityId(attrs),
    meshSnapshot,
    state: sessionState,
  };
}

// how: Validate atomic SyncOperation kind and sourcePath for change-set membership.

export function validateSyncOperation(
  attrs: unknown,
): SyncOperation | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError(
      "operation.kind",
      "operation_kind_invalid",
      "Operation kind is invalid",
    );
  }
  if (!isOneOf(attrs.kind, OPERATION_KINDS)) {
    return makeValidationError(
      "operation.kind",
      "operation_kind_invalid",
      "Operation kind is invalid",
    );
  }
  if (!nonEmptyString(attrs.sourcePath)) {
    return makeValidationError(
      "operation.sourcePath",
      "operation_source_path_required",
      "Operation source path is required",
    );
  }
  return {
    id: resolveEntityId(attrs),
    kind: attrs.kind,
    sourcePath: attrs.sourcePath,
    targetPath: optionalString(attrs.targetPath),
    riskLevel: (attrs.riskLevel as RiskLevel | undefined) ?? "low",
  };
}

// how: Preserve change_set_contains_ordered_operations by validating each operation in list order.

export function validateChangeSet(attrs: unknown): ChangeSet | DomainValidationError {
  if (!isRecord(attrs) || !Array.isArray(attrs.operations)) {
    return makeValidationError(
      "changeSet.operations",
      "change_set_operations_required",
      "Change set operations are required",
    );
  }
  const operations = validateEach(attrs.operations, validateSyncOperation);
  if (isDomainValidationError(operations)) {
    return operations;
  }
  return { id: resolveEntityId(attrs), operations };
}

// how: Enforce conflict_has_type_participants_and_status with enum checks on type and status.

export function validateConflict(attrs: unknown): Conflict | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("conflict.type", "conflict_type_required", "Conflict type is required");
  }
  if (attrs.type === undefined || attrs.type === null || attrs.type === "") {
    return makeValidationError("conflict.type", "conflict_type_required", "Conflict type is required");
  }
  if (!isOneOf(attrs.type, CONFLICT_TYPES)) {
    return makeValidationError("conflict.type", "conflict_type_invalid", "Conflict type is invalid");
  }
  if (!Array.isArray(attrs.participants) || attrs.participants.length < 2) {
    return makeValidationError(
      "conflict.participants",
      "conflict_participants_required",
      "Conflict requires at least two participants",
    );
  }
  if (!isOneOf(attrs.status, CONFLICT_STATUSES)) {
    return makeValidationError(
      "conflict.status",
      "conflict_status_invalid",
      "Conflict status is invalid",
    );
  }
  return {
    id: resolveEntityId(attrs),
    type: attrs.type as ConflictType,
    participants: attrs.participants as string[],
    status: attrs.status,
  };
}

// how: Phase-1 Filter shape (pattern + include/exclude mode) for later policy engine integration.

export function validateFilter(attrs: unknown): Filter | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError("filter.pattern", "filter_pattern_required", "Filter pattern is required");
  }
  if (!nonEmptyString(attrs.pattern)) {
    return makeValidationError("filter.pattern", "filter_pattern_required", "Filter pattern is required");
  }
  if (!isOneOf(attrs.mode, FILTER_MODES)) {
    return makeValidationError("filter.mode", "filter_mode_invalid", "Filter mode is invalid");
  }
  return { pattern: attrs.pattern, mode: attrs.mode };
}

// how: Validate SyncEvent audit fields (timestamp, type, subject) for future event-log IMPL.

export function validateSyncEvent(attrs: unknown): SyncEvent | DomainValidationError {
  if (!isRecord(attrs)) {
    return makeValidationError(
      "event.timestamp",
      "event_timestamp_required",
      "Event timestamp is required",
    );
  }
  if (attrs.timestamp === undefined || attrs.timestamp === null) {
    return makeValidationError(
      "event.timestamp",
      "event_timestamp_required",
      "Event timestamp is required",
    );
  }
  if (!nonEmptyString(attrs.type)) {
    return makeValidationError("event.type", "event_type_required", "Event type is required");
  }
  if (!nonEmptyString(attrs.subject)) {
    return makeValidationError("event.subject", "event_subject_required", "Event subject is required");
  }
  return {
    id: resolveEntityId(attrs),
    timestamp: String(attrs.timestamp),
    type: attrs.type,
    subject: attrs.subject,
    payload: isRecord(attrs.payload) ? attrs.payload : {},
  };
}
