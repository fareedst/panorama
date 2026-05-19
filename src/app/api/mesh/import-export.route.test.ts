// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_API]: Import/export API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { POST as importPost } from "./import/route";
import { GET as exportGet } from "./[meshId]/export/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";
import { MESH_EXPORT_VERSION } from "@/lib/mesh/services/import-export-service";
import { toDtoMesh } from "@/lib/mesh/domain";
import { minimalMesh } from "@/lib/mesh/domain/domain.test-helpers";

const adminHeaders = { "Content-Type": "application/json", "x-mesh-role": "admin" };

describe("mesh import/export API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  it("export_never_includes_secret_values", async () => {
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name: "Export API" }),
      }),
    );
    const { mesh } = await createRes.json();
    const res = await exportGet(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: mesh.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/secret|password/i);
  });

  it("import_creates_mesh_from_document", async () => {
    const doc = {
      version: MESH_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      mesh: toDtoMesh(minimalMesh({ name: "Imported" })),
    };
    const res = await importPost(
      new Request("http://localhost/api/mesh/import", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(doc),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.mesh.name).toBe("Imported");
  });
});
