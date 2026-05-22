// [IMPL-MESH_API] [REQ-MESH_PLATFORM]: Mesh read/update/delete API

import { getRuntime, handleServiceResult, jsonError } from "@/lib/mesh/api/mesh-api-helpers";
import { toDtoMesh } from "@/lib/mesh/domain";
import { normalizeMeshRecordVersion } from "@/lib/mesh/mesh-record";

type Params = { params: Promise<{ meshId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { meshId } = await params;
  const rt = getRuntime();
  const record = rt.meshService.getMesh(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  const normalized = normalizeMeshRecordVersion(record);
  return Response.json({
    mesh: toDtoMesh(normalized.mesh),
    status: normalized.status,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    configurationVersion: normalized.configurationVersion,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { meshId } = await params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    tags?: string[];
    policy?: Record<string, unknown>;
    expectedConfigurationVersion?: number;
  };
  const rt = getRuntime();
  const result = rt.meshService.updateMeshMetadata(meshId, body);
  const err = handleServiceResult(result);
  if (err) {
    return err;
  }
  if (result && typeof result === "object" && "mesh" in result) {
    rt.events.recordMeshUpdated(meshId, "updated");
    const normalized = normalizeMeshRecordVersion(result);
    return Response.json({
      mesh: toDtoMesh(result.mesh),
      status: result.status,
      configurationVersion: normalized.configurationVersion,
    });
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
