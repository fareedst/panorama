# IMPL-MESH_IMPORT_EXPORT essence pseudocode

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: Serialize mesh configuration for export without secrets; parse and validate import documents into domain Mesh (API layer creates persisted mesh).

## Summary contract

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: bound export/import document envelope without secrets

```
IMPL-MESH_IMPORT_EXPORT_Summary():
  INPUT: mesh Mesh; import document unknown
  OUTPUT: MeshExportDocument; Mesh OR structured error code
  DATA: MESH_EXPORT_VERSION = "1.0.0"
  CONTROL: exported JSON must contain no secret or password substrings; import does not persist
  PRE: toDtoMesh and fromDtoMesh available
  POST: export redacts credentialReferenceId; import validates version and mesh payload
  EFFECTS: pure
  FAILURE_MODES: INVALID_DOCUMENT; INVALID_VERSION; MISSING_MESH; DOMAIN_VALIDATION
  TERMINATION: total
```

## ExportMesh

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — convert mesh to DTO, strip depot credentialReferenceId, wrap with export version and timestamp.

```
IMPL-MESH_IMPORT_EXPORT_exportMesh(mesh):
  INPUT: mesh Mesh
  OUTPUT: MeshExportDocument { version, exportedAt, mesh }
  PRE: mesh available for DTO conversion
  POST: export document returned without credentialReferenceId or secrets
  EFFECTS: pure
  TERMINATION: total
  DATA dto = CALL toDtoMesh(mesh)
  FOR EACH depot IN dto.depots
    REMOVE credentialReferenceId from depot object
  RETURN {
    version: MESH_EXPORT_VERSION,
    exportedAt: now ISO-8601,
    mesh: redacted dto
  }
```

## ImportMesh

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — validate export envelope version and mesh payload; map DTO to domain Mesh or return structured error code.

```
IMPL-MESH_IMPORT_EXPORT_importMesh(doc):
  INPUT: doc unknown
  OUTPUT: Mesh OR { code, message }
  PRE: doc parsed from import payload
  POST: domain Mesh returned on success; structured error on validation failure
  EFFECTS: pure
  FAILURE_MODES: INVALID_DOCUMENT; INVALID_VERSION; MISSING_MESH; DOMAIN_VALIDATION
  TERMINATION: total
  IF doc is not object THEN RETURN { code: "invalid_document", message: "Import document must be an object" }
  IF doc.version ≠ MESH_EXPORT_VERSION THEN RETURN { code: "invalid_version", message: "Unsupported export version: {version}" }
  IF doc.mesh absent THEN RETURN { code: "missing_mesh", message: "Import document missing mesh" }
  DATA mesh = CALL fromDtoMesh(doc.mesh)
  IF domain validation error THEN RETURN { code: mesh.code, message: mesh.message }
  RETURN mesh
```
