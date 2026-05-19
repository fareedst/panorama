// [IMPL-MESH_CREDENTIAL] [REQ-MESH_PLATFORM]: Credential references without secrets — phase 8

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

  create(attrs: unknown): CredentialReference | DomainValidationError {
    const ref = validateCredentialReference(attrs);
    if (isDomainValidationError(ref)) {
      return ref;
    }
    this.refs.set(ref.id, ref);
    return ref;
  }

  get(id: string): CredentialReference | undefined {
    return this.refs.get(id);
  }

  detach(_meshId: string, _depotId: string): void {
    // references are shared; detach only clears depot association in depot service
  }

  mask(ref: CredentialReference): MaskedCredential {
    return {
      id: ref.id,
      label: ref.label,
      display: `${ref.label} (••••)`,
    };
  }

  list(): CredentialReference[] {
    return [...this.refs.values()];
  }
}
