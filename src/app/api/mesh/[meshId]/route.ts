// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Mesh read/update/delete API

import { getRuntime, handleServiceResult, jsonError } from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  const rt = getRuntime();
  const record = rt.meshService.getMesh(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  return Response.json({
    mesh: toDtoMesh(record.mesh),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { meshId } = await params;
  const body = (await request.json()) as { name?: string; description?: string; tags?: string[] };
  const rt = getRuntime();
  const result = rt.meshService.updateMeshMetadata(meshId, body);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  if (result && typeof result === "object" && "mesh" in result) {
    rt.events.recordMeshUpdated(meshId, "updated");
    return Response.json({ mesh: toDtoMesh(result.mesh), status: result.status });
  }
  return jsonError(500, "internal_error", "Unexpected result");
}

export async function DELETE(request: Request, { params }: Params) {
  const { meshId } = await params;
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";
  const rt = getRuntime();
  if (hard) {
    const result = rt.meshService.hardDeleteMesh(meshId);
    const err = handleServiceResult(result);
    if (err) {
      return err;
    }
    return new Response(null, { status: 204 });
  }
  const result = rt.meshService.archiveMesh(meshId);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  return Response.json({ status: "archived" });
}
