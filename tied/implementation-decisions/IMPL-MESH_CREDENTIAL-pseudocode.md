# IMPL-MESH_CREDENTIAL essence pseudocode

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory credential reference store; L1 validation; mask for display without secrets

## Summary contract

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound credential reference store without secret material

```
IMPL-MESH_CREDENTIAL_Summary():
  INPUT: credential reference attrs; id; meshId and depotId for detach
  OUTPUT: CredentialReference records; masked display DTOs
  DATA: in-memory refs map keyed by id
  PRE: L1 validateCredentialReference available
  POST: references stored without secrets; mask omits secret fields
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
```

## Create

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: validateCredentialReference at L1; persist by id; never store secret material.

```
IMPL-MESH_CREDENTIAL_create(attrs):
  INPUT: attrs unknown credential reference bag
  OUTPUT: CredentialReference | DomainValidationError
  PRE: attrs pass L1 validation
  POST: reference stored by id without secret material
  EFFECTS: State
  FAILURE_MODES: DOMAIN_VALIDATION
  TERMINATION: total
  DATA ref = CALL validateCredentialReference(attrs)
  IF isDomainValidationError(ref) THEN RETURN ref
  STORE ref by ref.id
  RETURN ref
```

## Get

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Read-through lookup by credential id.

```
IMPL-MESH_CREDENTIAL_get(id):
  INPUT: id string
  OUTPUT: CredentialReference | undefined
  PRE: refs map available
  POST: stored reference returned when present
  EFFECTS: pure
  TERMINATION: total
  RETURN refs[id]
```

## List

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Return all stored credential references.

```
IMPL-MESH_CREDENTIAL_list():
  INPUT: none
  OUTPUT: CredentialReference[]
  PRE: refs map available
  POST: all stored references returned
  EFFECTS: pure
  TERMINATION: total
  RETURN all values in refs map
```

## Mask

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: Build display DTO with redacted placeholder; omit secret fields entirely.

```
IMPL-MESH_CREDENTIAL_mask(ref):
  INPUT: ref CredentialReference
  OUTPUT: { id, label, display } where display is label + space + (••••)
  PRE: ref includes id and label
  POST: display DTO returned with redacted placeholder; no secrets
  EFFECTS: pure
  TERMINATION: total
  RETURN { id: ref.id, label: ref.label, display: ref.label + " (••••)" }
```

## Detach

// [IMPL-MESH_CREDENTIAL] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how: No-op in store; depot service clears depot association when detaching references from a mesh depot.

```
IMPL-MESH_CREDENTIAL_detach(meshId, depotId):
  INPUT: meshId; depotId
  OUTPUT: void
  PRE: detach invoked from depot service layer
  POST: store unchanged; association cleared by depot service caller
  EFFECTS: none in store
  TERMINATION: total
  RETURN void
```
