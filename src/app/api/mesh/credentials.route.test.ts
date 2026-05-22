// [IMPL-MESH_API] [IMPL-MESH_AUTH] [ARCH-MESH_LAYERED] [REQ-MESH_AUTH] [REQ-MESH_PLATFORM]: Credential reference API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./credentials/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

describe("mesh credentials API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  // [IMPL-MESH_API] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: manage_credentials permission gate
  it("post_credentials_forbidden_for_viewer", async () => {
    const res = await POST(
      new Request("http://localhost/api/mesh/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mesh-role": "viewer",
        },
        body: JSON.stringify({ label: "x" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  // [IMPL-MESH_API] [IMPL-MESH_AUTH] [REQ-MESH_AUTH]: admin creates masked credential reference
  it("post_credentials_created_for_admin", async () => {
    const res = await POST(
      new Request("http://localhost/api/mesh/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mesh-role": "admin",
        },
        body: JSON.stringify({ label: "ci-cred" }),
      }),
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as { credential: { id: string; label: string } };
    expect(data.credential.id).toBeTruthy();
    expect(data.credential.label).toBe("ci-cred");
  });
});
