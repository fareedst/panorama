# IMPL-MESH_IMPORT_EXPORT essence pseudocode

// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: Mesh configuration import/export without secrets

## exportMesh

// how: Serialize mesh via toDtoMesh; strip credential secret fields.

PROCEDURE IMPL-MESH_IMPORT_EXPORT_exportMesh(meshRecord)
  RETURN JSON document with mesh DTO and metadata
  ASSERT no secret values in output

## importMesh

// how: Parse document; validateMesh; create or replace via meshService.

PROCEDURE IMPL-MESH_IMPORT_EXPORT_importMesh(document, meshService)
  PARSE document
  DATA validated = CALL validateMesh from DTO
  IF new THEN createMesh ELSE update existing by id
  RETURN result mesh record
