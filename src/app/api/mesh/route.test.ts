// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Mesh API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { GET as getMesh } from "./[meshId]/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

describe("mesh API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  it("post_mesh_creates_mesh", async () => {
    const res = await POST(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "API Mesh" }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.mesh.name).toBe("API Mesh");
  });

  it("get_mesh_returns_mesh", async () => {
    const createRes = await POST(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Read Me" }),
      }),
    );
    const { mesh } = await createRes.json();
    const res = await getMesh(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: mesh.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mesh.name).toBe("Read Me");
  });

  it("request_validation_rejects_invalid_mesh_payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("get_meshes_list", async () => {
    await POST(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Listed" }),
      }),
    );
    const res = await GET(new Request("http://localhost/api/mesh"));
    const data = await res.json();
    expect(data.meshes.length).toBeGreaterThanOrEqual(1);
  });
});
