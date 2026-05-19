// [IMPL-MESH_MONITORING] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Operational dashboard — phase 26

import type { MeshRecord } from "../mesh-record";
import type { SyncEvent } from "../domain";
import type { SyncSession } from "../domain";

export type MonitoringSummary = {
  activeSessionCount: number;
  failedSessionCount: number;
  pendingConflictCount: number;
  meshHealth: { meshId: string; name: string; status: string; depotCount: number }[];
};

export class MonitoringService {
  buildSummary(
    meshes: MeshRecord[],
    sessions: SyncSession[],
    events: SyncEvent[],
    pendingConflicts: number,
  ): MonitoringSummary {
    const activeSessionCount = sessions.filter((s) =>
      ["running", "scanning", "paused"].includes(s.state),
    ).length;
    const failedSessionCount = sessions.filter((s) => s.state === "failed").length;
    const failedEvents = events.filter((e) => e.type === "operation_failed").length;

    return {
      activeSessionCount,
      failedSessionCount: failedSessionCount + (failedEvents > 0 ? 0 : 0),
      pendingConflictCount: pendingConflicts,
      meshHealth: meshes.map((r) => ({
        meshId: r.mesh.id,
        name: r.mesh.name,
        status: r.status,
        depotCount: r.mesh.depots.length,
      })),
    };
  }

  sessionHistory(sessions: SyncSession[]): SyncSession[] {
    return [...sessions].sort(
      (a, b) =>
        new Date(b.meshSnapshot.capturedAt).getTime() -
        new Date(a.meshSnapshot.capturedAt).getTime(),
    );
  }
}
