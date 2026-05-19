// [IMPL-MESH_SESSION] [REQ-MESH_PLATFORM]: Sync session lifecycle — phase 12

import {
  createMeshSnapshot,
  validateSyncSession,
  isDomainValidationError,
  type ChangeSet,
  type DomainValidationError,
  type Mesh,
  type SessionState,
  type SyncSession,
} from "../domain";

const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  idle: ["scanning", "running", "cancelled"],
  scanning: ["running", "paused", "cancelled", "failed"],
  running: ["paused", "completed", "failed", "cancelled"],
  paused: ["running", "cancelled", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

export type SessionServiceError = { code: string; message: string };

export class SessionService {
  private readonly sessions = new Map<string, SyncSession>();
  private readonly approvedPlans = new Map<string, ChangeSet>();
  private readonly activeMeshIds = new Set<string>();

  getActiveMeshIds(): ReadonlySet<string> {
    return this.activeMeshIds;
  }

  createSession(mesh: Mesh): SyncSession | DomainValidationError {
    const snapshot = createMeshSnapshot(mesh);
    const session = validateSyncSession({
      meshSnapshot: snapshot,
      state: "idle",
    });
    if (isDomainValidationError(session)) {
      return session;
    }
    this.sessions.set(session.id, session);
    this.activeMeshIds.add(mesh.id);
    return session;
  }

  getSession(sessionId: string): SyncSession | undefined {
    return this.sessions.get(sessionId);
  }

  transition(
    sessionId: string,
    nextState: SessionState,
    error?: string,
  ): SyncSession | SessionServiceError {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { code: "session_not_found", message: "Session not found" };
    }
    const allowed = VALID_TRANSITIONS[session.state];
    if (!allowed.includes(nextState)) {
      return {
        code: "invalid_state_transition",
        message: `Cannot transition from ${session.state} to ${nextState}`,
      };
    }
    const updated: SyncSession = { ...session, state: nextState };
    this.sessions.set(sessionId, updated);
    if (["completed", "failed", "cancelled"].includes(nextState)) {
      this.activeMeshIds.delete(session.meshSnapshot.mesh.id);
    }
    void error;
    return updated;
  }

  approvePlan(sessionId: string, changeSet: ChangeSet): void {
    this.approvedPlans.set(sessionId, changeSet);
  }

  getApprovedPlan(sessionId: string): ChangeSet | undefined {
    return this.approvedPlans.get(sessionId);
  }

  start(sessionId: string): SyncSession | SessionServiceError {
    return this.transition(sessionId, "running");
  }

  pause(sessionId: string): SyncSession | SessionServiceError {
    return this.transition(sessionId, "paused");
  }

  resume(sessionId: string): SyncSession | SessionServiceError {
    return this.transition(sessionId, "running");
  }

  cancel(sessionId: string): SyncSession | SessionServiceError {
    return this.transition(sessionId, "cancelled");
  }

  complete(sessionId: string): SyncSession | SessionServiceError {
    return this.transition(sessionId, "completed");
  }

  listAll(): SyncSession[] {
    return [...this.sessions.values()];
  }

  listForMesh(meshId: string): SyncSession[] {
    return this.listAll().filter((s) => s.meshSnapshot.mesh.id === meshId);
  }
}
