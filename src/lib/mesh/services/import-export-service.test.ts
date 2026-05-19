// [REQ-MESH_IMPORT_EXPORT]: Import/export tests — phase 27

import { describe, it, expect } from "vitest";
import { ImportExportService, MESH_EXPORT_VERSION } from "./import-export-service";
import { minimalMesh } from "../domain/domain.test-helpers";

describe("ImportExportService [IMPL-MESH_IMPORT_EXPORT]", () => {
  it("export_contains_mesh_metadata_and_version", () => {
    const svc = new ImportExportService();
    const mesh = minimalMesh({ name: "Export Me" });
    const doc = svc.exportMesh(mesh);
    expect(doc.version).toBe(MESH_EXPORT_VERSION);
    expect(doc.mesh.name).toBe("Export Me");
    expect(JSON.stringify(doc)).not.toMatch(/secret|password/i);
  });

  it("import_rejects_invalid_version", () => {
    const svc = new ImportExportService();
    const result = svc.importMesh({ version: "0.0.1", mesh: {} });
    expect("code" in result && result.code).toBe("invalid_version");
  });
});
