# IMPL-MESH_CREDENTIAL essence pseudocode

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Store credential references; mask for API/GUI

## create

// how: validateCredentialReference at L1; never persist secret value in store.

PROCEDURE IMPL-MESH_CREDENTIAL_create(attrs)
  DATA ref = CALL validateCredentialReference(attrs)
  IF domain error THEN RETURN error
  STORE ref by id
  RETURN ref

## mask

// how: Display label with redacted secret placeholder for DTO responses.

PROCEDURE IMPL-MESH_CREDENTIAL_mask(ref)
  RETURN { id, label, display: label + (••••) }
