// [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: Mesh CRUD service

import {
  isDomainValidationError,
  validateMesh,
  type DomainValidationError,
  type Mesh,
} from "../domain";
import {
  nextMeshRecordAfterLifecycleMutation,
  nextMeshRecordAfterMeshMutation,
  INITIAL_MESH_CONFIGURATION_VERSION,
  normalizeMeshRecordVersion,
  type MeshRecord,
  type MeshLifecycleStatus,
} from "../mesh-record";
import type { MeshRepository } from "../repositories/mesh-repository";

export type MeshServiceError = {
  code: string;
  message: string;
};

export type MeshServiceResult<T> = T | MeshServiceError | DomainValidationError;

function serviceError(code: string, message: string): MeshServiceError {
  return { code, message };
}

function nowIso(): string {
  return new Date().toISOString();
}

function wrapMesh(mesh: Mesh, status: MeshLifecycleStatus = "active"): MeshRecord {
  const ts = nowIso();
  return {
    mesh,
    status,
    createdAt: ts,
    updatedAt: ts,
    configurationVersion: INITIAL_MESH_CONFIGURATION_VERSION,
  };
}

export class MeshService {
  constructor(
    private readonly repository: MeshRepository,
    private readonly activeSessionMeshIds: () => ReadonlySet<string> = () => new Set(),
  ) {}

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [ARCH-MESH_LAYERED] [REQ-MESH_CRUD] [REQ-MESH_DOMAIN_MODEL]: createMesh — L1 validateMesh then persist MeshRecord
  createMesh(attrs: unknown): MeshServiceResult<MeshRecord> {
    const validated = validateMesh(attrs);
    if (isDomainValidationError(validated)) {
      return validated;
    }
    const record = wrapMesh(validated);
    this.repository.save(record);
    return record;
  }

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: getMesh — read-through to repository
  getMesh(meshId: string): MeshRecord | undefined {
    return this.repository.get(meshId);
  }

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: updateMeshMetadata — merge patch, optimistic configurationVersion lock, re-validate mesh, save
  updateMeshMetadata(
    meshId: string,
    patch: {
      name?: string;
      description?: string;
      tags?: string[];
      policy?: Record<string, unknown>;
      /** When set, must match stored configurationVersion ([REQ-MESH_HARDENING], prompts phase 29 optimistic_locking). */
      expectedConfigurationVersion?: number;
    },
  ): MeshServiceResult<MeshRecord> {
    const existing = this.repository.get(meshId);
    if (!existing) {
      return serviceError("mesh_not_found", "Mesh not found");
    }
    const normalized = normalizeMeshRecordVersion(existing);
    if (
      patch.expectedConfigurationVersion !== undefined &&
      patch.expectedConfigurationVersion !== normalized.configurationVersion
    ) {
      return serviceError("stale_configuration", "Stale mesh configurationVersion; reload and retry");
    }
    const validated = validateMesh({
      ...existing.mesh,
      name: patch.name ?? existing.mesh.name,
      description: patch.description ?? existing.mesh.description,
      tags: patch.tags ?? existing.mesh.tags,
      policy: patch.policy
        ? { ...existing.mesh.policy, ...patch.policy }
        : existing.mesh.policy,
    });
    if (isDomainValidationError(validated)) {
      return validated;
    }
    const record = nextMeshRecordAfterMeshMutation(existing, validated);
    this.repository.save(record);
    return record;
  }

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: archiveMesh — set status archived without delete
  archiveMesh(meshId: string): MeshServiceResult<MeshRecord> {
    const existing = this.repository.get(meshId);
    if (!existing) {
      return serviceError("mesh_not_found", "Mesh not found");
    }
    const record = nextMeshRecordAfterLifecycleMutation(existing, { status: "archived" });
    this.repository.save(record);
    return record;
  }

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: hardDeleteMesh — block when active session; else repository delete
  hardDeleteMesh(meshId: string): MeshServiceResult<void> {
    if (this.activeSessionMeshIds().has(meshId)) {
      return serviceError(
        "mesh_has_active_session",
        "Cannot hard delete mesh with an active sync session",
      );
    }
    if (!this.repository.get(meshId)) {
      return serviceError("mesh_not_found", "Mesh not found");
    }
    this.repository.delete(meshId);
    return undefined;
  }

  // [IMPL-MESH_CRUD] [ARCH-MESH_CRUD] [REQ-MESH_CRUD]: listMeshes — repository list with archived filter
  listMeshes(includeArchived = false): MeshRecord[] {
    return this.repository.list({ includeArchived });
  }
}
