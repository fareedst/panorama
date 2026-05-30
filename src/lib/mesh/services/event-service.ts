// [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Append-only in-memory event log with optional JSON persistence under MESH_DATA_DIR; all entries validated via validateSyncEvent.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { validateSyncEvent, isDomainValidationError, type SyncEvent } from "../domain";

const EVENTS_FILE = "sync-events.json";

export type EventServiceOptions = {
  /** When set, events persist under this directory (also defaults from `process.env.MESH_DATA_DIR`). */
  dataDir?: string;
};

export class EventService {
  private readonly events: SyncEvent[] = [];
  private readonly dataDir?: string;

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — construct with optional dataDir; when set, mkdir and load persisted sync-events.json on startup.
  constructor(options?: EventServiceOptions) {
    this.dataDir = options?.dataDir ?? process.env.MESH_DATA_DIR;
    if (this.dataDir) {
      mkdirSync(this.dataDir, { recursive: true });
      this.loadFromDisk();
    }
  }

  // [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — read sync-events.json; validate each row; skip invalid with DIAGNOSTIC warn; start empty on missing or corrupt file.
  private loadFromDisk(): void {
    if (!this.dataDir) {
      return;
    }
    const path = join(this.dataDir, EVENTS_FILE);
    if (!existsSync(path)) {
      return;
    }
    try {
      const raw = JSON.parse(readFileSync(path, "utf-8")) as { events?: unknown[] };
      const list = raw.events ?? [];
      this.events.length = 0;
      for (const row of list) {
        const v = validateSyncEvent(row);
        if (!isDomainValidationError(v)) {
          this.events.push(v);
        } else {
          console.warn(`DIAGNOSTIC: skip invalid persisted event: ${v.message}`);
        }
      }
    } catch (e) {
      console.warn(`DIAGNOSTIC: failed to load ${path}, starting empty events`, e);
    }
  }

  // [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: how — write version 1 envelope with full events array after each append when dataDir set.
  private persistToDisk(): void {
    if (!this.dataDir) {
      return;
    }
    const path = join(this.dataDir, EVENTS_FILE);
    const payload = { version: 1 as const, events: this.events };
    writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8");
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [IMPL-MESH_DOMAIN_TYPES] [REQ-MESH_PLATFORM]: how — private helper builds SyncEvent with ISO timestamp, validates, pushes append-only, persists.
  private append(type: string, subject: string, payload: Record<string, unknown>): SyncEvent {
    const event = validateSyncEvent({
      timestamp: new Date().toISOString(),
      type,
      subject,
      payload,
    });
    if (isDomainValidationError(event)) {
      throw new Error(event.message);
    }
    this.events.push(event);
    this.persistToDisk();
    return event;
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_started before executor performs connector I/O.
  recordOperationStarted(operationId: string): SyncEvent {
    return this.append("operation_started", operationId, {});
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_completed after successful executor result.
  recordOperationCompleted(operationId: string): SyncEvent {
    return this.append("operation_completed", operationId, {});
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — emit operation_failed with error string in payload.
  recordOperationFailed(operationId: string, error: string): SyncEvent {
    return this.append("operation_failed", operationId, { error });
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit mesh configuration mutations with action in payload.
  recordMeshUpdated(meshId: string, action: string): SyncEvent {
    return this.append("mesh_updated", meshId, { action });
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — audit conflict resolution by conflict id subject.
  recordConflictResolved(conflictId: string): SyncEvent {
    return this.append("conflict_resolved", conflictId, {});
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — record session state transitions with optional meshId in payload.
  recordSessionLifecycle(sessionId: string, state: string, meshId?: string): SyncEvent {
    return this.append("session_lifecycle", sessionId, { state, meshId });
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — generic audit events for auth denials and permission checks.
  recordAudit(subject: string, payload: Record<string, unknown>): SyncEvent {
    return this.append("audit", subject, payload);
  }

  // [IMPL-MESH_EVENTS] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — read-only filters over append-only log; list returns defensive copy.
  queryBySession(sessionId: string): SyncEvent[] {
    return this.events.filter(
      (e) => e.subject === sessionId || e.payload.sessionId === sessionId,
    );
  }

  queryByMesh(meshId: string): SyncEvent[] {
    return this.events.filter(
      (e) => e.subject === meshId || e.payload.meshId === meshId,
    );
  }

  list(): SyncEvent[] {
    return [...this.events];
  }
}
