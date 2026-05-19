// [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Repository factory tests

import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createMeshRepository } from "./create-mesh-repository";
import { InMemoryMeshRepository } from "./memory-mesh-repository";
import { JsonMeshRepository } from "./json-mesh-repository";

describe("createMeshRepository [IMPL-MESH_PERSISTENCE]", () => {
  const prev = process.env.MESH_DATA_DIR;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.MESH_DATA_DIR;
    } else {
      process.env.MESH_DATA_DIR = prev;
    }
  });

  it("uses_in_memory_when_env_unset", () => {
    delete process.env.MESH_DATA_DIR;
    const repo = createMeshRepository();
    expect(repo).toBeInstanceOf(InMemoryMeshRepository);
  });

  it("uses_json_when_mesh_data_dir_set", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-env-"));
    try {
      process.env.MESH_DATA_DIR = dir;
      const repo = createMeshRepository();
      expect(repo).toBeInstanceOf(JsonMeshRepository);
      expect(existsSync(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
