// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Remote connector stub — contract-compliant, no network I/O

import type {
  Connector,
  ConnectorCapabilities,
  ConnectorEntry,
  ConnectorError,
  ConnectorHealth,
} from "./types";

const unsupported = (op: string): ConnectorError => ({
  code: "unsupported",
  message: `Remote connector does not support ${op} in this release`,
});

export class RemoteConnector implements Connector {
  readonly capabilities: ConnectorCapabilities = {
    canList: true,
    canRead: false,
    canWrite: false,
    canDelete: false,
  };

  constructor(private readonly root: string) {}

  healthCheck(): ConnectorHealth {
    return {
      ok: false,
      message: `Remote depot ${this.root} is not configured for live sync`,
    };
  }

  listEntries(rootPath: string): ConnectorEntry[] | ConnectorError {
    void rootPath;
    return unsupported("listEntries");
  }

  statEntry(path: string): ConnectorEntry | ConnectorError {
    void path;
    return unsupported("statEntry");
  }

  readFile(path: string): Uint8Array | ConnectorError {
    void path;
    return unsupported("readFile");
  }

  writeFile(path: string, data: Uint8Array): void | ConnectorError {
    void path;
    void data;
    return unsupported("writeFile");
  }

  deleteFile(path: string): void | ConnectorError {
    void path;
    return unsupported("deleteFile");
  }
}
