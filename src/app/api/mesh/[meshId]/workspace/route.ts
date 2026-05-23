// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_API]: UPDATE_EXISTING_WORKSPACE — PUT workspace snapshot on existing mesh

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";
import {
  buildMeshPatchPayload,
  planDepotSync,
  validateWorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";

type Params = { params: Promise<{ meshId: string }> };

type PutBody = {
  name?: string;
  note?: string;
  snapshot?: unknown;
};

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
// how: buildMeshPatchPayload + planDepotSync depot ops after metadata patch
export async function PUT(request: Request, { params }: Params) {
  const denied = requirePermission(request, "edit_mesh");
  if (denied) {
    return denied;
  }
  const { meshId } = await params;
  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON");
  }
  const snapshot = validateWorkspaceSnapshot(body.snapshot);
  if (!snapshot) {
    return jsonError(400, "invalid_snapshot", "snapshot must be a valid workspace snapshot");
  }

  const rt = getRuntime();
  const record = rt.meshService.getMesh(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }

  const patch = buildMeshPatchPayload({
    name: body.name,
    note: body.note,
    snapshot,
    existingDescription: record.mesh.description,
  });

  const metaResult = rt.meshService.updateMeshMetadata(meshId, patch);
  const metaErr = handleServiceResult(metaResult);
  if (metaErr) {
    return metaErr;
  }

  const existingDepots = record.mesh.depots.map((d) => ({
    id: d.id,
    name: d.name,
    root: d.root,
  }));
  const ops = planDepotSync(existingDepots, snapshot.panes);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
  // how: apply planDepotSync update|add|remove in order
  for (const op of ops) {
    if (op.op === "update") {
      const result = rt.depotService.updateDepot(meshId, op.depotId, {
        name: op.name,
        root: op.root,
      });
      const err = handleServiceResult(result);
      if (err) {
        return err;
      }
    } else if (op.op === "add") {
      const result = rt.depotService.addDepot(meshId, {
        name: op.name,
        kind: "local",
        root: op.root,
        accessMode: "read_write",
      });
      const err = handleServiceResult(result);
      if (err) {
        return err;
      }
    } else if (op.op === "remove") {
      const result = rt.depotService.removeDepot(meshId, op.depotId);
      const err = handleServiceResult(result);
      if (err) {
        return err;
      }
    }
  }

  rt.events.recordMeshUpdated(meshId, "workspace_updated");
  const updated = rt.meshService.getMesh(meshId);
  if (!updated) {
    return jsonError(500, "internal_error", "Mesh missing after update");
  }
  return Response.json({ mesh: toDtoMesh(updated.mesh) });
}
