// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { POST as sessionPost } from "./[meshId]/sessions/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

const adminHeaders = { "Content-Type": "application/json", "x-mesh-role": "admin" };

describe("mesh sessions API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  it("post_session_create_returns_session", async () => {
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name: "Session Mesh" }),
      }),
    );
    const { mesh } = await createRes.json();
    const res = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ action: "create" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.session.id).toBeTruthy();
  });
});
