// [IMPL-MESH_TOPOLOGY] [REQ-MESH_PLATFORM]: Topology unit tests — phase 6

import { describe, it, expect } from "vitest";
import { validateMesh, isDomainValidationError } from "../domain";
import {
  validateTopology,
  projectTopologyGraph,
  addLinkToMesh,
} from "./topology-service";

function meshWithDepots() {
  const mesh = validateMesh({
    name: "Topo",
    depots: [
      { name: "A", kind: "local", root: "/a" },
      { name: "B", kind: "local", root: "/b" },
      { name: "C", kind: "local", root: "/c" },
    ],
  });
  if (isDomainValidationError(mesh)) {
    throw new Error("mesh setup");
  }
  return mesh;
}

describe("TopologyService [IMPL-MESH_TOPOLOGY]", () => {
  it("create_one_way_link", () => {
    const mesh = meshWithDepots();
    const updated = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    expect(isDomainValidationError(updated)).toBe(false);
    if (!isDomainValidationError(updated) && !("code" in updated)) {
      expect(updated.links).toHaveLength(1);
      expect(updated.links[0].direction).toBe("one_way");
    }
  });

  it("create_bidirectional_link", () => {
    const mesh = meshWithDepots();
    const updated = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "bidirectional",
    });
    if (!isDomainValidationError(updated) && !("code" in updated)) {
      expect(updated.links[0].direction).toBe("bidirectional");
    }
  });

  it("reject_link_to_missing_depot", () => {
    const mesh = meshWithDepots();
    const result = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: "missing-id",
      direction: "one_way",
    });
    expect(result).toHaveProperty("code");
  });

  it("reject_self_link", () => {
    const mesh = meshWithDepots();
    const result = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[0].id,
      direction: "one_way",
    });
    expect(result).toHaveProperty("code");
  });

  it("detect_simple_cycle", () => {
    const mesh = meshWithDepots();
    let m = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    if (isDomainValidationError(m) || "code" in m) {
      throw new Error("link1");
    }
    m = addLinkToMesh(m, {
      sourceDepotId: mesh.depots[1].id,
      targetDepotId: mesh.depots[2].id,
      direction: "one_way",
    });
    if (isDomainValidationError(m) || "code" in m) {
      throw new Error("link2");
    }
    m = addLinkToMesh(m, {
      sourceDepotId: mesh.depots[2].id,
      targetDepotId: mesh.depots[0].id,
      direction: "one_way",
    });
    if (isDomainValidationError(m) || "code" in m) {
      throw new Error("link3");
    }
    const validation = validateTopology(m);
    expect(validation.hasCycle).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("detect_disconnected_depots", () => {
    const mesh = meshWithDepots();
    const withLink = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    if (isDomainValidationError(withLink) || "code" in withLink) {
      throw new Error("link");
    }
    const validation = validateTopology(withLink);
    expect(validation.disconnectedDepotIds).toContain(mesh.depots[2].id);
  });

  it("allow_partial_connectivity", () => {
    const mesh = meshWithDepots();
    const withLink = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    if (isDomainValidationError(withLink) || "code" in withLink) {
      throw new Error("link");
    }
    expect(withLink.links).toHaveLength(1);
    expect(withLink.depots).toHaveLength(3);
  });

  it("describe_topology_as_graph", () => {
    const mesh = meshWithDepots();
    const withLink = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    if (isDomainValidationError(withLink) || "code" in withLink) {
      throw new Error("link");
    }
    const graph = projectTopologyGraph(withLink);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].status).toBe("ok");
  });

  it("graph_projection_marks_unreachable_depots", () => {
    const mesh = meshWithDepots();
    const withLink = addLinkToMesh(mesh, {
      sourceDepotId: mesh.depots[0].id,
      targetDepotId: mesh.depots[1].id,
      direction: "one_way",
    });
    if (isDomainValidationError(withLink) || "code" in withLink) {
      throw new Error("link");
    }
    const graph = projectTopologyGraph(withLink);
    const unreachable = graph.nodes.find((n) => n.depotId === mesh.depots[2].id);
    expect(unreachable?.status).toBe("unreachable");
  });
});
