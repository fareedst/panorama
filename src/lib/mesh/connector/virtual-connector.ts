// [IMPL-MESH_CONNECTOR] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM] [REQ-MESH_REAL_CONNECTORS]: Derivative FakeConnector seeded with deterministic /virtual/readme.txt or caller-provided stubs for labs.

import type { ConnectorHealth } from "./types";
import { FakeConnector } from "./fake-connector";

export type VirtualSeedFile = {
  /** Absolute-like path rooted at "/", e.g. "/docs/readme.txt" */
  path: string;
  content: string;
  mtimeMs?: number;
};

/** Virtual depot connector: deterministic in-memory layout for dry runs ([REQ-MESH_PLATFORM] phases 4, 28). */
export class VirtualConnector extends FakeConnector {
  constructor(seeds?: readonly VirtualSeedFile[]) {
    super();
    if (seeds && seeds.length > 0) {
      for (const s of seeds) {
        this.seedFile(s.path, new TextEncoder().encode(s.content), s.mtimeMs ?? Date.now());
      }
      return;
    }
    // TRACE: default seed satisfies virtual_connector_returns_synthetic_inventory acceptance without callers
    this.seedFile(
      "/virtual/readme.txt",
      new TextEncoder().encode("# virtual connector\nSynthetic inventory stub.\n"),
      1700000000000,
    );
  }

  override healthCheck(): ConnectorHealth {
    return { ok: true, message: "virtual connector (synthetic) healthy" };
  }
}
