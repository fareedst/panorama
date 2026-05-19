// [IMPL-MESH_LOCAL_CONNECTOR] [REQ-MESH_REAL_CONNECTORS] [REQ-MESH_PLATFORM]: Local FS connector — phase 28

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
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

export class LocalFilesystemConnector implements Connector {
  readonly capabilities: ConnectorCapabilities = {
    canList: true,
    canRead: true,
    canWrite: true,
    canDelete: true,
  };

  constructor(private readonly basePath: string) {}

  healthCheck(): ConnectorHealth {
    if (!existsSync(this.basePath)) {
      return { ok: false, message: `Base path missing: ${this.basePath}` };
    }
    return { ok: true, message: "local filesystem healthy" };
  }

  private resolvePath(relativePath: string): string {
    const normalized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const full = resolve(this.basePath, normalized);
    if (!full.startsWith(resolve(this.basePath))) {
      throw new Error("Path escapes base directory");
    }
    return full;
  }

  listEntries(rootPath: string): ConnectorEntry[] | ConnectorError {
    try {
      const dir = this.resolvePath(rootPath === "/" ? "" : rootPath);
      if (!existsSync(dir)) {
        return err("not_found", "Directory not found");
      }
      const names = readdirSync(dir);
      return names.map((name) => {
        const full = join(dir, name);
        const st = statSync(full);
        return {
          path: join(rootPath === "/" ? "" : rootPath, name).replace(/\\/g, "/") || `/${name}`,
          name,
          isDirectory: st.isDirectory(),
          size: st.isFile() ? st.size : undefined,
          mtimeMs: st.mtimeMs,
        };
      });
    } catch (e) {
      return err("list_failed", (e as Error).message);
    }
  }

  statEntry(path: string): ConnectorEntry | ConnectorError {
    try {
      const full = this.resolvePath(path.startsWith("/") ? path.slice(1) : path);
      if (!existsSync(full)) {
        return err("not_found", "Entry not found");
      }
      const st = statSync(full);
      const name = path.split("/").filter(Boolean).pop() ?? path;
      return {
        path,
        name,
        isDirectory: st.isDirectory(),
        size: st.isFile() ? st.size : undefined,
        mtimeMs: st.mtimeMs,
      };
    } catch (e) {
      return err("stat_failed", (e as Error).message);
    }
  }

  readFile(path: string): Uint8Array | ConnectorError {
    try {
      const full = this.resolvePath(path.startsWith("/") ? path.slice(1) : path);
      return new Uint8Array(readFileSync(full));
    } catch (e) {
      return err("read_failed", (e as Error).message);
    }
  }

  writeFile(path: string, data: Uint8Array): void | ConnectorError {
    try {
      const rel = path.startsWith("/") ? path.slice(1) : path;
      const full = this.resolvePath(rel);
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, data);
    } catch (e) {
      return err("write_failed", (e as Error).message);
    }
  }

  deleteFile(path: string): void | ConnectorError {
    try {
      const full = this.resolvePath(path.startsWith("/") ? path.slice(1) : path);
      rmSync(full, { force: true });
    } catch (e) {
      return err("delete_failed", (e as Error).message);
    }
  }
}
