// [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: Aggregate operational dashboard summary from mesh records, sync sessions, and pending conflict count.

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
  // [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — count active and failed sessions; pass through pending conflict count; map each mesh record to health row.
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

  // [IMPL-MESH_MONITORING] [ARCH-MESH_LAYERED] [REQ-MESH_MONITORING] [REQ-MESH_PLATFORM]: how — return sessions sorted by meshSnapshot.capturedAt descending (newest first).
  sessionHistory(sessions: SyncSession[]): SyncSession[] {
    return [...sessions].sort(
      (a, b) =>
        new Date(b.meshSnapshot.capturedAt).getTime() -
        new Date(a.meshSnapshot.capturedAt).getTime(),
    );
  }
}
