// [IMPL-MESH_EVENTS] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Event log and audit — phase 14; optional JSON persistence when MESH_DATA_DIR is set

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

  constructor(options?: EventServiceOptions) {
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

  private persistToDisk(): void {
    if (!this.dataDir) {
      return;
    }
    const path = join(this.dataDir, EVENTS_FILE);
    const payload = { version: 1 as const, events: this.events };
    writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8");
  }

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

  recordOperationStarted(operationId: string): SyncEvent {
    return this.append("operation_started", operationId, {});
  }

  recordOperationCompleted(operationId: string): SyncEvent {
    return this.append("operation_completed", operationId, {});
  }

  recordOperationFailed(operationId: string, error: string): SyncEvent {
    return this.append("operation_failed", operationId, { error });
  }

  recordMeshUpdated(meshId: string, action: string): SyncEvent {
    return this.append("mesh_updated", meshId, { action });
  }

  recordConflictResolved(conflictId: string): SyncEvent {
    return this.append("conflict_resolved", conflictId, {});
  }

  recordSessionLifecycle(sessionId: string, state: string, meshId?: string): SyncEvent {
    return this.append("session_lifecycle", sessionId, { state, meshId });
  }

  recordAudit(subject: string, payload: Record<string, unknown>): SyncEvent {
    return this.append("audit", subject, payload);
  }

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
