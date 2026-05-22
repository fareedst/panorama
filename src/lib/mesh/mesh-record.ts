// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: MeshRecord lifecycle wrapper

import type { Mesh } from "./domain";

export type MeshLifecycleStatus = "active" | "archived";

/** Initial optimistic-lock generation for new meshes ([REQ-MESH_HARDENING], prompts phase 29). */
export const INITIAL_MESH_CONFIGURATION_VERSION = 1;

export type MeshRecord = {
  mesh: Mesh;
  status: MeshLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  /**
   * Monotonic bump on authoritative mesh/metadata edits ([REQ-MESH_HARDENING]).
   * Coerced from legacy JSON blobs missing this field ([IMPL-MESH_PERSISTENCE], phase 16).
   */
  configurationVersion?: number;
};

/** Coerce persisted records that predate versioning. */
export function normalizeMeshRecordVersion(record: MeshRecord): MeshRecord {
  if (typeof record.configurationVersion === "number" && Number.isFinite(record.configurationVersion)) {
    return record;
  }
  return { ...record, configurationVersion: INITIAL_MESH_CONFIGURATION_VERSION };
}

/** Persist mesh edits and bump configurationVersion (+1 per mutation). */
export function nextMeshRecordAfterMeshMutation(record: MeshRecord, mesh: Mesh): MeshRecord {
  const base = normalizeMeshRecordVersion(record).configurationVersion!;
  const nextMesh = structuredClone(mesh);
  return normalizeMeshRecordVersion({
    ...record,
    mesh: nextMesh,
    updatedAt: new Date().toISOString(),
    configurationVersion: base + 1,
  });
}

/** Lifecycle-only bumps (archive) without altering mesh topology. */
export function nextMeshRecordAfterLifecycleMutation(record: MeshRecord, partial: Partial<MeshRecord>): MeshRecord {
  const base = normalizeMeshRecordVersion(record).configurationVersion!;
  return normalizeMeshRecordVersion({
    ...record,
    ...partial,
    updatedAt: new Date().toISOString(),
    configurationVersion: base + 1,
  });
}
