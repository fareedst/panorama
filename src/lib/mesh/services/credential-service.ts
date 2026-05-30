// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory credential reference store; L1 validation; mask for display without secrets

import {
  isDomainValidationError,
  validateCredentialReference,
  type CredentialReference,
  type DomainValidationError,
} from "../domain";

export type MaskedCredential = {
  id: string;
  label: string;
  display: string;
};

export class CredentialReferenceStore {
  private readonly refs = new Map<string, CredentialReference>();

  // [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: validateCredentialReference at L1; persist by id; never store secret material.
  create(attrs: unknown): CredentialReference | DomainValidationError {
    const ref = validateCredentialReference(attrs);
    if (isDomainValidationError(ref)) {
      return ref;
    }
    this.refs.set(ref.id, ref);
    return ref;
  }

  // [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Read-through lookup by credential id.
  get(id: string): CredentialReference | undefined {
    return this.refs.get(id);
  }

  // [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: No-op in store; depot service clears depot association when detaching references from a mesh depot.
  detach(meshId: string, depotId: string): void {
    void meshId;
    void depotId;
    // references are shared; detach only clears depot association in depot service
  }

  // [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Build display DTO with redacted placeholder; omit secret fields entirely.
  mask(ref: CredentialReference): MaskedCredential {
    return {
      id: ref.id,
      label: ref.label,
      display: `${ref.label} (••••)`,
    };
  }

  // [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return all stored credential references.
  list(): CredentialReference[] {
    return [...this.refs.values()];
  }
}
