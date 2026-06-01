// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE]: Files startup mesh preference in localStorage

import { describe, it, expect, beforeEach } from "vitest";
import {
  FILES_STARTUP_MESH_STORAGE_KEY,
  clearFilesStartupMeshId,
  getFilesStartupMeshId,
  setFilesStartupMeshId,
} from "./files-startup-mesh";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("RESOLVE_FILES_STARTUP_MESH [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("getFilesStartupMeshId_returns_null_when_unset", () => {
    expect(getFilesStartupMeshId()).toBeNull();
  });

  it("setFilesStartupMeshId_persists_mesh_id", () => {
    setFilesStartupMeshId("mesh-alpha");
    expect(getFilesStartupMeshId()).toBe("mesh-alpha");
    expect(localStorageMock.getItem(FILES_STARTUP_MESH_STORAGE_KEY)).toBe("mesh-alpha");
  });

  it("setFilesStartupMeshId_null_clears_preference", () => {
    setFilesStartupMeshId("mesh-alpha");
    setFilesStartupMeshId(null);
    expect(getFilesStartupMeshId()).toBeNull();
  });

  it("clearFilesStartupMeshId_removes_stored_id", () => {
    setFilesStartupMeshId("mesh-beta");
    clearFilesStartupMeshId();
    expect(getFilesStartupMeshId()).toBeNull();
  });
});
