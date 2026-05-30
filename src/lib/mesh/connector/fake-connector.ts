// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: In-memory path → content map for unit tests; base class for VirtualConnector seeding.

import type {
  Connector,
  ConnectorCapabilities,
  ConnectorEntry,
  ConnectorError,
  ConnectorHealth,
} from "./types";

function err(code: string, message: string): ConnectorError {
  return { code, message };
}

export class FakeConnector implements Connector {
  readonly capabilities: ConnectorCapabilities = {
    canList: true,
    canRead: true,
    canWrite: true,
    canDelete: true,
  };

  private readonly files = new Map<string, { data: Uint8Array; mtimeMs: number }>();
  private readonly dirs = new Set<string>(["/"]);

  healthCheck(): ConnectorHealth {
    return { ok: true, message: "fake connector healthy" };
  }

  seedFile(path: string, data: Uint8Array, mtimeMs = Date.now()): void {
    const normalized = normalizePath(path);
    this.files.set(normalized, { data, mtimeMs });
    this.ensureParentDirs(normalized);
  }

  listEntries(rootPath: string): ConnectorEntry[] | ConnectorError {
    const root = normalizePath(rootPath);
    if (!this.dirs.has(root) && !this.files.has(root)) {
      return err("not_found", "Root not found");
    }
    const prefix = root === "/" ? "/" : `${root}/`;
    const entries = new Map<string, ConnectorEntry>();
    for (const dir of this.dirs) {
      if (dir === root || dir.startsWith(prefix)) {
        const rel = dir.slice(root.length).replace(/^\//, "");
        if (rel && !rel.includes("/")) {
          entries.set(dir, { path: dir, name: rel, isDirectory: true });
        }
      }
    }
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix) || (root === "/" && filePath.startsWith("/"))) {
        const rel = filePath.slice(root === "/" ? 1 : root.length + 1);
        const first = rel.split("/")[0];
        if (first && !rel.includes("/", first.length)) {
          const full = root === "/" ? `/${first}` : `${root}/${first}`;
          if (!entries.has(full)) {
            const file = this.files.get(filePath);
            entries.set(full, {
              path: full,
              name: first,
              isDirectory: false,
              size: file?.data.length,
              mtimeMs: file?.mtimeMs,
            });
          }
        }
      }
    }
    return [...entries.values()];
  }

  statEntry(path: string): ConnectorEntry | ConnectorError {
    const normalized = normalizePath(path);
    if (this.dirs.has(normalized)) {
      return { path: normalized, name: baseName(normalized), isDirectory: true };
    }
    const file = this.files.get(normalized);
    if (!file) {
      return err("not_found", "Entry not found");
    }
    return {
      path: normalized,
      name: baseName(normalized),
      isDirectory: false,
      size: file.data.length,
      mtimeMs: file.mtimeMs,
    };
  }

  readFile(path: string): Uint8Array | ConnectorError {
    if (!this.capabilities.canRead) {
      return err("unsupported", "Read not supported");
    }
    const file = this.files.get(normalizePath(path));
    if (!file) {
      return err("not_found", "File not found");
    }
    return file.data;
  }

  writeFile(path: string, data: Uint8Array): void | ConnectorError {
    if (!this.capabilities.canWrite) {
      return err("unsupported", "Write not supported");
    }
    const normalized = normalizePath(path);
    this.ensureParentDirs(normalized);
    this.files.set(normalized, { data, mtimeMs: Date.now() });
  }

  deleteFile(path: string): void | ConnectorError {
    if (!this.capabilities.canDelete) {
      return err("unsupported", "Delete not supported");
    }
    const normalized = normalizePath(path);
    if (!this.files.delete(normalized)) {
      return err("not_found", "File not found");
    }
  }

  private ensureParentDirs(filePath: string): void {
    const parts = filePath.split("/").filter(Boolean);
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current += `/${parts[i]}`;
      this.dirs.add(current || "/");
    }
  }
}

function normalizePath(p: string): string {
  if (!p.startsWith("/")) {
    return `/${p}`;
  }
  return p.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function baseName(p: string): string {
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "/";
}
