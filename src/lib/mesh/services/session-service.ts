// [IMPL-MESH_SESSION] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Sync session lifecycle — phase 12; optional JSON persistence when MESH_DATA_DIR is set

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  createMeshSnapshot,
  validateChangeSet,
  validateSyncSession,
  isDomainValidationError,
  type ChangeSet,
  type DomainValidationError,
  type Mesh,
  type SessionState,
  type SyncSession,
} from "../domain";

const SESSIONS_FILE = "sync-sessions.json";

export type SessionServiceOptions = {
  /** When set, sessions and approved plans persist under this directory (also defaults from `process.env.MESH_DATA_DIR`). */
  dataDir?: string;
};

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
  private readonly dataDir?: string;

  constructor(options?: SessionServiceOptions) {
    this.dataDir = options?.dataDir ?? process.env.MESH_DATA_DIR;
    if (this.dataDir) {
      mkdirSync(this.dataDir, { recursive: true });
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    if (!this.dataDir) {
      return;
    }
    const path = join(this.dataDir, SESSIONS_FILE);
    if (!existsSync(path)) {
      return;
    }
    try {
      const raw = JSON.parse(readFileSync(path, "utf-8")) as {
        sessions?: Record<string, unknown>;
        approvedPlans?: Record<string, unknown>;
      };
      this.sessions.clear();
      this.approvedPlans.clear();
      for (const [id, row] of Object.entries(raw.sessions ?? {})) {
        const v = validateSyncSession(row);
        if (!isDomainValidationError(v)) {
          this.sessions.set(id, v);
        } else {
          console.warn(`DIAGNOSTIC: skip invalid persisted session ${id}: ${v.message}`);
        }
      }
      for (const [sid, row] of Object.entries(raw.approvedPlans ?? {})) {
        const v = validateChangeSet(row);
        if (!isDomainValidationError(v)) {
          this.approvedPlans.set(sid, v);
        }
      }
      this.rebuildActiveMeshIds();
    } catch (e) {
      console.warn(`DIAGNOSTIC: failed to load ${path}, starting empty sessions`, e);
    }
  }

  private rebuildActiveMeshIds(): void {
    this.activeMeshIds.clear();
    for (const s of this.sessions.values()) {
      if (!["completed", "failed", "cancelled"].includes(s.state)) {
        this.activeMeshIds.add(s.meshSnapshot.mesh.id);
      }
    }
  }

  private persistToDisk(): void {
    if (!this.dataDir) {
      return;
    }
    const path = join(this.dataDir, SESSIONS_FILE);
    const payload = {
      version: 1 as const,
      sessions: Object.fromEntries(this.sessions),
      approvedPlans: Object.fromEntries(this.approvedPlans),
    };
    writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8");
  }

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
    this.persistToDisk();
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
    this.persistToDisk();
    return updated;
  }

  approvePlan(sessionId: string, changeSet: ChangeSet): void {
    this.approvedPlans.set(sessionId, changeSet);
    this.persistToDisk();
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
