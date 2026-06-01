// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: RESOLVE_FILES_STARTUP_MESH — localStorage preference for Files page startup mesh

/** localStorage key for the mesh id that bootstraps plain `/files` loads. */
export const FILES_STARTUP_MESH_STORAGE_KEY = "panorama.filesStartupMeshId";

type FilesStartupMeshListener = () => void;
const filesStartupMeshListeners = new Set<FilesStartupMeshListener>();

function notifyFilesStartupMeshListeners(): void {
  for (const listener of filesStartupMeshListeners) {
    listener();
  }
}

/** Subscribe to files startup mesh preference changes (same tab or storage events). */
export function subscribeFilesStartupMesh(onStoreChange: FilesStartupMeshListener): () => void {
  filesStartupMeshListeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStoreChange);
  }
  return () => {
    filesStartupMeshListeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStoreChange);
    }
  };
}

/** Client snapshot for useSyncExternalStore; SSR snapshot is always null. */
export function getFilesStartupMeshSnapshot(): string | null {
  return getFilesStartupMeshId();
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Read the stored files startup mesh id, or null when unset or on SSR. */
export function getFilesStartupMeshId(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(FILES_STARTUP_MESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist or clear the files startup mesh preference. */
export function setFilesStartupMeshId(meshId: string | null): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    if (meshId == null || meshId === "") {
      storage.removeItem(FILES_STARTUP_MESH_STORAGE_KEY);
    } else {
      storage.setItem(FILES_STARTUP_MESH_STORAGE_KEY, meshId);
    }
    notifyFilesStartupMeshListeners();
  } catch {
    // Silent fail in restricted environments (tests, private mode)
  }
}

/** Remove the files startup mesh preference. */
export function clearFilesStartupMeshId(): void {
  setFilesStartupMeshId(null);
}
