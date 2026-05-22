// [IMPL-MESH_SESSION] [IMPL-MESH_PERSISTENCE] [REQ-MESH_PLATFORM]: Session lifecycle tests — phase 12

import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { validateMesh, isDomainValidationError, validateChangeSet } from "../domain";
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

describe("SessionService JSON persistence [IMPL-MESH_PERSISTENCE]", () => {
  it("save_and_load_session_and_approved_plan", () => {
    const dir = mkdtempSync(join(tmpdir(), "mesh-sess-persist-"));
    try {
      const m = mesh("Persist session mesh");
      const a = new SessionService({ dataDir: dir });
      const session = a.createSession(m);
      if (isDomainValidationError(session)) {
        throw new Error("session");
      }
      a.transition(session.id, "scanning");
      const plan = validateChangeSet({
        id: "cs-1",
        operations: [
          {
            id: "op-1",
            kind: "copy",
            sourcePath: "/a.txt",
            targetPath: "/b.txt",
            riskLevel: "low",
          },
        ],
      });
      if (isDomainValidationError(plan)) {
        throw new Error("plan");
      }
      a.approvePlan(session.id, plan);

      expect(existsSync(join(dir, "sync-sessions.json"))).toBe(true);

      const b = new SessionService({ dataDir: dir });
      const loaded = b.getSession(session.id);
      expect(loaded?.state).toBe("scanning");
      expect(b.getApprovedPlan(session.id)?.id).toBe("cs-1");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
