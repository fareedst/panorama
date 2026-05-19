// [IMPL-MESH_DEPOT] [REQ-MESH_PLATFORM]: Depot CRUD on mesh — phase 3

import {
  isDomainValidationError,
  validateDepot,
  validateMesh,
  type Depot,
  type DomainValidationError,
  type Mesh,
} from "../domain";
import type { MeshRecord } from "../mesh-record";
import type { MeshRepository } from "../repositories/mesh-repository";

export type DepotServiceError = { code: string; message: string };

export type DepotCapabilities = {
  canList: boolean;
  canRead: boolean;
  canWrite: boolean;
  supportsArchiveMode: boolean;
};

export function discoverDepotCapabilities(kind: Depot["kind"]): DepotCapabilities {
  switch (kind) {
    case "virtual":
      return { canList: true, canRead: true, canWrite: false, supportsArchiveMode: true };
    case "remote":
      return { canList: true, canRead: true, canWrite: true, supportsArchiveMode: false };
    default:
      return { canList: true, canRead: true, canWrite: true, supportsArchiveMode: false };
  }
}

export class DepotService {
  constructor(private readonly meshRepository: MeshRepository) {}

  private loadMesh(meshId: string): MeshRecord | DepotServiceError {
    const record = this.meshRepository.get(meshId);
    if (!record) {
      return { code: "mesh_not_found", message: "Mesh not found" };
    }
    return record;
  }

  private saveMesh(record: MeshRecord, mesh: Mesh): DomainValidationError | void {
    const validated = validateMesh(mesh);
    if (isDomainValidationError(validated)) {
      return validated;
    }
    record.mesh = validated;
    record.updatedAt = new Date().toISOString();
    this.meshRepository.save(record);
  }

  addDepot(meshId: string, attrs: unknown): Depot | DepotServiceError | DomainValidationError {
    const record = this.loadMesh(meshId);
    if ("code" in record) {
      return record;
    }
    const depot = validateDepot(attrs);
    if (isDomainValidationError(depot)) {
      return depot;
    }
    if (record.mesh.depots.some((d) => d.name === depot.name)) {
      return { code: "duplicate_depot_name", message: "Depot name already exists in mesh" };
    }
    const mesh: Mesh = { ...record.mesh, depots: [...record.mesh.depots, depot] };
    const err = this.saveMesh(record, mesh);
    if (err) {
      return err;
    }
    return depot;
  }

  updateDepot(
    meshId: string,
    depotId: string,
    attrs: unknown,
  ): Depot | DepotServiceError | DomainValidationError {
    const record = this.loadMesh(meshId);
    if ("code" in record) {
      return record;
    }
    const existing = record.mesh.depots.find((d) => d.id === depotId);
    if (!existing) {
      return { code: "depot_not_found", message: "Depot not found" };
    }
    const merged = { ...existing, ...(attrs as object) };
    const depot = validateDepot(merged);
    if (isDomainValidationError(depot)) {
      return depot;
    }
    const depots = record.mesh.depots.map((d) => (d.id === depotId ? depot : d));
    const err = this.saveMesh(record, { ...record.mesh, depots });
    if (err) {
      return err;
    }
    return depot;
  }

  removeDepot(meshId: string, depotId: string): DepotServiceError | DomainValidationError | void {
    const record = this.loadMesh(meshId);
    if ("code" in record) {
      return record;
    }
    const depots = record.mesh.depots.filter((d) => d.id !== depotId);
    const links = record.mesh.links.filter(
      (l) => l.sourceDepotId !== depotId && l.targetDepotId !== depotId,
    );
    return this.saveMesh(record, { ...record.mesh, depots, links });
  }

  getDepot(meshId: string, depotId: string): Depot | undefined {
    const record = this.meshRepository.get(meshId);
    return record?.mesh.depots.find((d) => d.id === depotId);
  }
}
