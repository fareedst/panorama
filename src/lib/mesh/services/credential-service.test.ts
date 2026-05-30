// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory credential reference store; L1 validation; mask for display without secrets

import { describe, it, expect } from "vitest";
import { isDomainValidationError } from "../domain";
import { CredentialReferenceStore } from "./credential-service";

describe("CredentialReferenceStore [IMPL-MESH_CREDENTIAL]", () => {
  it("create_stores_validated_reference", () => {
    const store = new CredentialReferenceStore();
    const ref = store.create({ id: "cred-1", label: "SFTP" });
    expect(isDomainValidationError(ref)).toBe(false);
    if (!isDomainValidationError(ref)) {
      expect(store.get(ref.id)?.label).toBe("SFTP");
    }
  });

  it("mask_never_includes_secret_values", () => {
    const store = new CredentialReferenceStore();
    const ref = store.create({ id: "cred-2", label: "API Key" });
    if (isDomainValidationError(ref)) {
      throw new Error("setup");
    }
    const masked = store.mask(ref);
    expect(masked.display).toContain("••••");
    expect(JSON.stringify(masked)).not.toMatch(/secret|password|token_value/i);
  });
});
