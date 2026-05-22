// [IMPL-MESH_CONNECTOR] [REQ-MESH_REAL_CONNECTORS]: Remote connector stub tests

import { describe, it, expect } from "vitest";
import { RemoteConnector } from "./remote-connector";

describe("RemoteConnector [REQ-MESH_REAL_CONNECTORS]", () => {
  it("remote_connector_reports_unsupported_write", () => {
    const conn = new RemoteConnector("sftp://example/data");
    const err = conn.writeFile("/f.txt", new Uint8Array());
    expect(err).toHaveProperty("code", "unsupported");
  });

  it("remote_connector_health_check_returns_degraded", () => {
    const conn = new RemoteConnector("sftp://example/data");
    expect(conn.healthCheck().ok).toBe(false);
  });
});
