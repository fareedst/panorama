// [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: JSON file persistence — phase 16

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { MeshRecord } from "../mesh-record";
import type { ListMeshesOptions, MeshRepository } from "./mesh-repository";

export class JsonMeshRepository implements MeshRepository {
  private readonly filePath: string;
  private cache: Map<string, MeshRecord> = new Map();

  constructor(dataDir: string) {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = join(dataDir, "meshes.json");
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) {
      this.cache = new Map();
      return;
    }
    const raw = readFileSync(this.filePath, "utf-8");
    const parsed = JSON.parse(raw) as MeshRecord[];
    this.cache = new Map(parsed.map((r) => [r.mesh.id, r]));
  }

  private persist(): void {
    writeFileSync(this.filePath, JSON.stringify([...this.cache.values()], null, 2));
  }

  save(record: MeshRecord): void {
    this.cache.set(record.mesh.id, structuredClone(record));
    this.persist();
  }

  get(meshId: string): MeshRecord | undefined {
    const record = this.cache.get(meshId);
    return record ? structuredClone(record) : undefined;
  }

  delete(meshId: string): void {
    this.cache.delete(meshId);
    this.persist();
  }

  list(options?: ListMeshesOptions): MeshRecord[] {
    const includeArchived = options?.includeArchived ?? false;
    return [...this.cache.values()]
      .filter((r) => includeArchived || r.status === "active")
      .map((r) => structuredClone(r));
  }
}
