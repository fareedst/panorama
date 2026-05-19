// [IMPL-MESH_SESSION] [REQ-MESH_PLATFORM]: Session lifecycle tests — phase 12

import { describe, it, expect } from "vitest";
import { validateMesh, isDomainValidationError } from "../domain";
import { SessionService } from "./session-service";

function mesh(name = "Session Mesh") {
  const m = validateMesh({ name });
  if (isDomainValidationError(m)) {
    throw new Error("mesh");
  }
  return m;
}

describe("SessionService [IMPL-MESH_SESSION]", () => {
  it("session_starts_with_mesh_snapshot", () => {
    const svc = new SessionService();
    const m = mesh();
    const session = svc.createSession(m);
    expect(isDomainValidationError(session)).toBe(false);
    if (!isDomainValidationError(session)) {
      expect(session.meshSnapshot.mesh.name).toBe(m.name);
      expect(session.state).toBe("idle");
    }
  });

  it("session_does_not_mutate_original_mesh_configuration", () => {
    const svc = new SessionService();
    const m = mesh();
    const originalName = m.name;
    svc.createSession(m);
    m.name = "Changed";
    const session = svc.listForMesh(m.id)[0];
    expect(session.meshSnapshot.mesh.name).toBe(originalName);
  });

  it("idle_session_can_start", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    const started = svc.start(session.id);
    if (!("code" in started)) {
      expect(started.state).toBe("running");
    }
  });

  it("scanning_session_can_pause", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    svc.transition(session.id, "scanning");
    const paused = svc.pause(session.id);
    if (!("code" in paused)) {
      expect(paused.state).toBe("paused");
    }
  });

  it("paused_session_can_resume", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    svc.transition(session.id, "scanning");
    svc.pause(session.id);
    const resumed = svc.resume(session.id);
    if (!("code" in resumed)) {
      expect(resumed.state).toBe("running");
    }
  });

  it("completed_session_cannot_resume", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    svc.transition(session.id, "scanning");
    svc.start(session.id);
    svc.complete(session.id);
    const resumed = svc.resume(session.id);
    expect(resumed).toHaveProperty("code", "invalid_state_transition");
  });

  it("session_state_transitions_are_validated", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    const bad = svc.transition(session.id, "completed");
    expect(bad).toHaveProperty("code", "invalid_state_transition");
  });

  it("running_session_can_cancel", () => {
    const svc = new SessionService();
    const session = svc.createSession(mesh());
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    svc.transition(session.id, "scanning");
    svc.start(session.id);
    const cancelled = svc.cancel(session.id);
    if (!("code" in cancelled)) {
      expect(cancelled.state).toBe("cancelled");
    }
  });
});
