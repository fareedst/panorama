# IMPL-MESH_IMPORT_EXPORT essence pseudocode

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: Serialize mesh configuration for export without secrets; parse and validate import documents into domain Mesh (API layer creates persisted mesh).

## exportMesh

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — convert mesh to DTO, strip depot credentialReferenceId, wrap with export version and timestamp.

CONTRACT ExportMesh
  INPUT: mesh Mesh
  OUTPUT: MeshExportDocument { version, exportedAt, mesh }
  DATA: MESH_EXPORT_VERSION = "1.0.0"
  CONTROL: exported JSON must contain no secret or password substrings

PROCEDURE IMPL-MESH_IMPORT_EXPORT_exportMesh(mesh)
  DATA dto = CALL toDtoMesh(mesh)
  FOR EACH depot IN dto.depots
    REMOVE credentialReferenceId from depot object
  RETURN {
    version: MESH_EXPORT_VERSION,
    exportedAt: now ISO-8601,
    mesh: redacted dto
  }

## importMesh

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — validate export envelope version and mesh payload; map DTO to domain Mesh or return structured error code.

CONTRACT ImportMesh
  INPUT: doc unknown
  OUTPUT: Mesh OR { code, message }
  CONTROL: does not persist — caller (API/runtime) invokes meshService.createMesh on success

PROCEDURE IMPL-MESH_IMPORT_EXPORT_importMesh(doc)
  IF doc is not object THEN RETURN { code: "invalid_document", message: "Import document must be an object" }
  IF doc.version ≠ MESH_EXPORT_VERSION THEN RETURN { code: "invalid_version", message: "Unsupported export version: {version}" }
  IF doc.mesh absent THEN RETURN { code: "missing_mesh", message: "Import document missing mesh" }
  DATA mesh = CALL fromDtoMesh(doc.mesh)
  IF domain validation error THEN RETURN { code: mesh.code, message: mesh.message }
  RETURN mesh
