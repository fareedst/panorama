// [IMPL-MESH_TOPOLOGY] [REQ-MESH_PLATFORM]: Topology graph and validation — phase 6

import { isDomainValidationError, validateMesh, type Mesh, type SyncLink } from "../domain";

export type GraphNode = {
  id: string;
  depotId: string;
  name: string;
  status: "ok" | "unreachable" | "invalid";
};

export type GraphEdge = {
  id: string;
  linkId: string;
  sourceDepotId: string;
  targetDepotId: string;
  direction: SyncLink["direction"];
  status: "ok" | "invalid";
};

export type TopologyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
};

export type TopologyValidation = {
  valid: boolean;
  warnings: string[];
  hasCycle: boolean;
  disconnectedDepotIds: string[];
};

function detectCycle(mesh: Mesh): boolean {
  const adj = new Map<string, string[]>();
  for (const link of mesh.links) {
    const targets = adj.get(link.sourceDepotId) ?? [];
    targets.push(link.targetDepotId);
    adj.set(link.sourceDepotId, targets);
    if (link.direction === "bidirectional") {
      const rev = adj.get(link.targetDepotId) ?? [];
      rev.push(link.sourceDepotId);
      adj.set(link.targetDepotId, rev);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (visiting.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }
    visiting.add(node);
    for (const next of adj.get(node) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const depot of mesh.depots) {
    if (dfs(depot.id)) {
      return true;
    }
  }
  return false;
}

function findDisconnectedDepots(mesh: Mesh): string[] {
  if (mesh.depots.length === 0 || mesh.links.length === 0) {
    return mesh.depots.map((d) => d.id);
  }
  const connected = new Set<string>();
  for (const link of mesh.links) {
    connected.add(link.sourceDepotId);
    connected.add(link.targetDepotId);
  }
  return mesh.depots.filter((d) => !connected.has(d.id)).map((d) => d.id);
}

export function validateTopology(mesh: Mesh): TopologyValidation {
  const warnings: string[] = [];
  const hasCycle = detectCycle(mesh);
  if (hasCycle) {
    warnings.push("Mesh topology contains a cycle");
  }
  const disconnectedDepotIds = findDisconnectedDepots(mesh);
  if (disconnectedDepotIds.length > 0 && mesh.links.length > 0) {
    warnings.push("Some depots are not connected by any link");
  }
  return {
    valid: !hasCycle,
    warnings,
    hasCycle,
    disconnectedDepotIds,
  };
}

export function projectTopologyGraph(mesh: Mesh): TopologyGraph {
  const validation = validateTopology(mesh);
  const disconnected = new Set(validation.disconnectedDepotIds);
  const nodes: GraphNode[] = mesh.depots.map((depot) => ({
    id: depot.id,
    depotId: depot.id,
    name: depot.name,
    status: disconnected.has(depot.id) ? "unreachable" : "ok",
  }));
  const depotIds = new Set(mesh.depots.map((d) => d.id));
  const edges: GraphEdge[] = mesh.links.map((link) => {
    const invalid =
      !depotIds.has(link.sourceDepotId) || !depotIds.has(link.targetDepotId);
    return {
      id: link.id,
      linkId: link.id,
      sourceDepotId: link.sourceDepotId,
      targetDepotId: link.targetDepotId,
      direction: link.direction,
      status: invalid ? "invalid" : "ok",
    };
  });
  return { nodes, edges, warnings: validation.warnings };
}

export function addLinkToMesh(
  mesh: Mesh,
  linkAttrs: unknown,
): Mesh | { code: string; message: string } {
  const next = validateMesh({
    ...mesh,
    links: [...mesh.links, linkAttrs],
  });
  if (isDomainValidationError(next)) {
    return { code: next.code, message: next.message };
  }
  return next;
}

export function removeLinkFromMesh(mesh: Mesh, linkId: string): Mesh {
  return { ...mesh, links: mesh.links.filter((l) => l.id !== linkId) };
}
