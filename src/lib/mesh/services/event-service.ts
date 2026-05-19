// [IMPL-MESH_EVENTS] [REQ-MESH_PLATFORM]: Event log and audit — phase 14

import { validateSyncEvent, isDomainValidationError, type SyncEvent } from "../domain";

export class EventService {
  private readonly events: SyncEvent[] = [];

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

  recordSessionLifecycle(sessionId: string, state: string): SyncEvent {
    return this.append("session_lifecycle", sessionId, { state });
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
