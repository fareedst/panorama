// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: Serialize mesh configuration for export without secrets; parse and validate import documents into domain Mesh (API layer creates persisted mesh).

import { fromDtoMesh, toDtoMesh, isDomainValidationError, type Mesh } from "../domain";

export const MESH_EXPORT_VERSION = "1.0.0";

export type MeshExportDocument = {
  version: string;
  exportedAt: string;
  mesh: ReturnType<typeof toDtoMesh>;
};

export class ImportExportService {
  // [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — convert mesh to DTO, strip depot credentialReferenceId, wrap with export version and timestamp.
  exportMesh(mesh: Mesh): MeshExportDocument {
    const dto = toDtoMesh(mesh);
    const depots = dto.depots as Array<Record<string, unknown>>;
    const redacted = {
      ...dto,
      depots: depots.map((d) => {
        const { credentialReferenceId, ...rest } = d;
        void credentialReferenceId;
        return rest;
      }),
    };
    return {
      version: MESH_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      mesh: redacted,
    };
  }

  // [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — validate export envelope version and mesh payload; map DTO to domain Mesh or return structured error code.
  importMesh(doc: unknown): Mesh | { code: string; message: string } {
    if (!doc || typeof doc !== "object") {
      return { code: "invalid_document", message: "Import document must be an object" };
    }
    const record = doc as MeshExportDocument;
    if (record.version !== MESH_EXPORT_VERSION) {
      return {
        code: "invalid_version",
        message: `Unsupported export version: ${record.version}`,
      };
    }
    if (!record.mesh) {
      return { code: "missing_mesh", message: "Import document missing mesh" };
    }
    const mesh = fromDtoMesh(record.mesh);
    if (isDomainValidationError(mesh)) {
      return { code: mesh.code, message: mesh.message };
    }
    return mesh;
  }
}
