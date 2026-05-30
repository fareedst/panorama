// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Declarative connector surface for inventory scans and executor mutations; shared by local, remote stub, virtual, and test doubles.

export type ConnectorEntry = {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  mtimeMs?: number;
};

export type ConnectorHealth = {
  ok: boolean;
  message: string;
};

export type ConnectorError = {
  code: string;
  message: string;
};

export type ConnectorCapabilities = {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canList: boolean;
};

export interface Connector {
  readonly capabilities: ConnectorCapabilities;
  healthCheck(): ConnectorHealth;
  listEntries(rootPath: string): ConnectorEntry[] | ConnectorError;
  statEntry(path: string): ConnectorEntry | ConnectorError;
  readFile(path: string): Uint8Array | ConnectorError;
  writeFile(path: string, data: Uint8Array): void | ConnectorError;
  deleteFile(path: string): void | ConnectorError;
}
