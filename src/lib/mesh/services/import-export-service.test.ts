// [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: Serialize mesh configuration for export without secrets; parse and validate import documents into domain Mesh (API layer creates persisted mesh).

import { describe, it, expect } from "vitest";
import { ImportExportService, MESH_EXPORT_VERSION } from "./import-export-service";
import { minimalMesh } from "../domain/domain.test-helpers";

describe("ImportExportService [IMPL-MESH_IMPORT_EXPORT]", () => {
  // [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — convert mesh to DTO, strip depot credentialReferenceId, wrap with export version and timestamp.
  it("export_contains_mesh_metadata_and_version", () => {
    const svc = new ImportExportService();
    const mesh = minimalMesh({ name: "Export Me" });
    const doc = svc.exportMesh(mesh);
    expect(doc.version).toBe(MESH_EXPORT_VERSION);
    expect(doc.mesh.name).toBe("Export Me");
    expect(JSON.stringify(doc)).not.toMatch(/secret|password/i);
  });

  // [IMPL-MESH_IMPORT_EXPORT] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_PLATFORM]: how — validate export envelope version and mesh payload; map DTO to domain Mesh or return structured error code.
  it("import_rejects_invalid_version", () => {
    const svc = new ImportExportService();
    const result = svc.importMesh({ version: "0.0.1", mesh: {} });
    expect("code" in result && result.code).toBe("invalid_version");
  });
});
