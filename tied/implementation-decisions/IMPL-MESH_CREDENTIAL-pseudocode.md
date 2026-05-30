# IMPL-MESH_CREDENTIAL essence pseudocode

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory credential reference store; L1 validation; mask for display without secrets

## create

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: validateCredentialReference at L1; persist by id; never store secret material.

CONTRACT create
  INPUT: attrs unknown credential reference bag
  OUTPUT: CredentialReference | DomainValidationError

PROCEDURE IMPL-MESH_CREDENTIAL_create(attrs)
  DATA ref = CALL validateCredentialReference(attrs)
  IF isDomainValidationError(ref) THEN RETURN ref
  STORE ref by ref.id
  RETURN ref

## get

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Read-through lookup by credential id.

CONTRACT get
  INPUT: id string
  OUTPUT: CredentialReference | undefined

PROCEDURE IMPL-MESH_CREDENTIAL_get(id)
  RETURN refs[id]

## list

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return all stored credential references.

PROCEDURE IMPL-MESH_CREDENTIAL_list()
  RETURN all values in refs map

## mask

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Build display DTO with redacted placeholder; omit secret fields entirely.

CONTRACT mask
  INPUT: ref CredentialReference
  OUTPUT: { id, label, display } where display is label + space + (••••)

PROCEDURE IMPL-MESH_CREDENTIAL_mask(ref)
  RETURN { id: ref.id, label: ref.label, display: ref.label + " (••••)" }

## detach

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: No-op in store; depot service clears depot association when detaching references from a mesh depot.

PROCEDURE IMPL-MESH_CREDENTIAL_detach(meshId, depotId)
  RETURN void
