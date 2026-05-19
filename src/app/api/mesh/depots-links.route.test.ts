// [REQ-MESH_API] [IMPL-MESH_API]: Depot and link API tests — phase 15

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { POST as addDepot } from "./[meshId]/depots/route";
import { POST as addLink } from "./[meshId]/links/route";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";

describe("mesh depot/link API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  async function createTestMesh() {
    const res = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "API Depot Mesh" }),
      }),
    );
    const data = await res.json();
    return data.mesh.id as string;
  }

  it("post_depot_adds_depot_to_mesh", async () => {
    const meshId = await createTestMesh();
    const res = await addDepot(
      new Request("http://localhost/api/mesh/x/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Source",
          kind: "local",
          root: "/tmp/src",
        }),
      }),
      { params: Promise.resolve({ meshId }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.depot.name).toBe("Source");
    expect(data.mesh.depots).toHaveLength(1);
  });

  it("post_link_adds_relationship_to_mesh", async () => {
    const meshId = await createTestMesh();
    const depotRes = await addDepot(
      new Request("http://localhost/api/mesh/x/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A", kind: "local", root: "/a" }),
      }),
      { params: Promise.resolve({ meshId }) },
    );
    const depotBRes = await addDepot(
      new Request("http://localhost/api/mesh/x/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "B", kind: "local", root: "/b" }),
      }),
      { params: Promise.resolve({ meshId }) },
    );
    const { depot: depotA } = await depotRes.json();
    const { depot: depotB } = await depotBRes.json();
    const linkRes = await addLink(
      new Request("http://localhost/api/mesh/x/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDepotId: depotA.id,
          targetDepotId: depotB.id,
          direction: "one_way",
        }),
      }),
      { params: Promise.resolve({ meshId }) },
    );
    expect(linkRes.status).toBe(201);
    const linkData = await linkRes.json();
    expect(linkData.mesh.links).toHaveLength(1);
    expect(linkData.link.direction).toBe("one_way");
  });
});
