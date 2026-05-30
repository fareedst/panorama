// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Aggregate operational dashboard summary from mesh records, sync sessions, and pending conflict count.

import { describe, it, expect } from "vitest";
import { MonitoringService } from "./monitoring-service";
import { minimalMesh, minimalMeshSnapshot } from "../domain/domain.test-helpers";
import type { MeshRecord } from "../mesh-record";

describe("MonitoringService [IMPL-MESH_MONITORING]", () => {
  // [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — count active and failed sessions; pass through pending conflict count; map each mesh record to health row.
  it("monitoring_api_returns_summary", () => {
    const svc = new MonitoringService();
    const mesh = minimalMesh({
      name: "Monitored",
      depots: [
        { id: "d1", name: "D", kind: "local", root: "/tmp/d", accessMode: "read_write" },
      ],
    });
    const record: MeshRecord = {
      mesh,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      configurationVersion: 1,
    };
    const summary = svc.buildSummary([record], [], [], 2);
    expect(summary.pendingConflictCount).toBe(2);
    expect(summary.meshHealth[0]?.depotCount).toBe(1);
    expect(summary.meshHealth[0]?.name).toBe("Monitored");
  });

  // [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — return sessions sorted by meshSnapshot.capturedAt descending (newest first).
  it("session_history_sorts_by_snapshot_time", () => {
    const svc = new MonitoringService();
    const older = {
      id: "s1",
      meshId: "m1",
      state: "completed" as const,
      meshSnapshot: minimalMeshSnapshot({
        capturedAt: "2020-01-01T00:00:00.000Z",
      }),
    };
    const newer = {
      id: "s2",
      meshId: "m1",
      state: "completed" as const,
      meshSnapshot: minimalMeshSnapshot({
        capturedAt: "2025-01-01T00:00:00.000Z",
      }),
    };
    const sorted = svc.sessionHistory([older, newer]);
    expect(sorted[0]?.id).toBe("s2");
  });
});
