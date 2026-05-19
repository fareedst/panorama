// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: TO_DTO / FROM_DTO — JSON-safe serialization per essence_pseudocode

import type {
  CredentialReference,
  Depot,
  DomainValidationError,
  Mesh,
  Policy,
  SyncLink,
} from "./types";
import { validateCredentialReference, validateMesh } from "./validators";

// how: Emit id and label only on DTO (no secret field).

export function toDtoCredentialReference(ref: CredentialReference): Record<string, unknown> {
  return { id: ref.id, label: ref.label };
}

// how: Deserialize DTO by delegating to VALIDATE_CREDENTIAL_REFERENCE (intra-IMPL call).

export function fromDtoCredentialReference(
  dto: unknown,
): CredentialReference | DomainValidationError {
  return validateCredentialReference(dto);
}

// how: Map validated Depot entity to JSON-safe DTO for mesh serialization.

export function toDtoDepot(depot: Depot): Record<string, unknown> {
  return {
    id: depot.id,
    name: depot.name,
    kind: depot.kind,
    root: depot.root,
    credentialReferenceId: depot.credentialReferenceId,
    accessMode: depot.accessMode,
  };
}

// how: Map validated SyncLink entity to JSON-safe DTO for mesh serialization.

export function toDtoSyncLink(link: SyncLink): Record<string, unknown> {
  return {
    id: link.id,
    sourceDepotId: link.sourceDepotId,
    targetDepotId: link.targetDepotId,
    direction: link.direction,
  };
}

// how: Map validated Policy entity to JSON-safe DTO embedded in mesh DTO.

export function toDtoPolicy(policy: Policy): Record<string, unknown> {
  const { deletePolicy, conflictPolicy, retryMaxAttempts, verificationMode } = policy;
  return { deletePolicy, conflictPolicy, retryMaxAttempts, verificationMode };
}

// how: Serialize mesh by mapping depots, links, and policy to DTO parts.

export function toDtoMesh(mesh: Mesh): Record<string, unknown> {
  return {
    id: mesh.id,
    name: mesh.name,
    description: mesh.description,
    tags: mesh.tags,
    depots: mesh.depots.map((depot) => toDtoDepot(depot)),
    links: mesh.links.map((link) => toDtoSyncLink(link)),
    policy: toDtoPolicy(mesh.policy),
  };
}

// how: Deserialize mesh DTO by CALL VALIDATE_MESH so invalid_core_objects_are_rejected on FROM_DTO.

export function fromDtoMesh(dto: unknown): Mesh | DomainValidationError {
  return validateMesh(dto);
}
