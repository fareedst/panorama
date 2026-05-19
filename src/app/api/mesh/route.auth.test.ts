// [REQ-MESH_AUTH]: API authorization — phase 24

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

describe("mesh API auth [IMPL-MESH_AUTH]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  it("api_rejects_unauthorized_mesh_create", async () => {
    const res = await POST(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mesh-role": "viewer",
        },
        body: JSON.stringify({ name: "No Create" }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
