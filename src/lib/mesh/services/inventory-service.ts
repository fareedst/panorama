// [IMPL-MESH_INVENTORY] [REQ-MESH_PLATFORM]: Depot inventory scan — phase 9

import type { Connector, ConnectorError } from "../connector/types";
import type { Depot } from "../domain";

export type InventoryEntry = {
  path: string;
  isDirectory: boolean;
  size?: number;
  mtimeMs?: number;
  checksum?: string;
};

export type InventorySnapshot = {
  depotId: string;
  scannedAt: string;
  entries: InventoryEntry[];
};

function isConnectorError(r: unknown): r is ConnectorError {
  return typeof r === "object" && r !== null && "code" in r && "message" in r;
}

export class InventoryService {
  scanDepot(depot: Depot, connector: Connector): InventorySnapshot | ConnectorError {
    const health = connector.healthCheck();
    if (!health.ok) {
      return { code: "depot_unreachable", message: health.message };
    }
    const listRoot = depot.kind === "local" ? "/" : depot.root;
    const listed = connector.listEntries(listRoot);
    if (isConnectorError(listed)) {
      return listed;
    }
    const entries: InventoryEntry[] = [];
    for (const entry of listed) {
      if (entry.isDirectory) {
        entries.push({ path: entry.path, isDirectory: true });
        continue;
      }
      const stat = connector.statEntry(entry.path);
      if (isConnectorError(stat)) {
        continue;
      }
      entries.push({
        path: entry.path,
        isDirectory: false,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
    return {
      depotId: depot.id,
      scannedAt: new Date().toISOString(),
      entries,
    };
  }
}
