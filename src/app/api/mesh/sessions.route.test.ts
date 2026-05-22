// [IMPL-MESH_API] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session API composition tests

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { GET as sessionGet, POST as sessionPost } from "./[meshId]/sessions/route";
import { resetMeshRuntime, getMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";
import { isDomainValidationError } from "@/lib/mesh/domain";
import { FakeConnector } from "@/lib/mesh/connector/fake-connector";

const adminHeaders = { "Content-Type": "application/json", "x-mesh-role": "admin" };

async function createTestMesh(name: string) {
  const createRes = await createMesh(
    new Request("http://localhost/api/mesh", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ name }),
    }),
  );
  const { mesh } = await createRes.json();
  return mesh as { id: string };
}

describe("mesh sessions API [IMPL-MESH_API]", () => {
  beforeEach(() => {
    resetMeshRuntime();
  });

  it("post_session_create_returns_session", async () => {
    const mesh = await createTestMesh("Session Mesh");
    const res = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ action: "create" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.session.id).toBeTruthy();
  });

  // [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [REQ-MESH_API]: GET sessions list and single session with progress
  it("get_sessions_list_and_session_with_progress", async () => {
    const mesh = await createTestMesh("List Mesh");
    const createRes = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ action: "create" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    const { session } = await createRes.json();

    const listRes = await sessionGet(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.sessions.length).toBeGreaterThanOrEqual(1);

    const rt = getMeshRuntime();
    rt.getSessionProgress(session.id);

    const oneRes = await sessionGet(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions?sessionId=${session.id}`),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(oneRes.status).toBe(200);
    const oneData = await oneRes.json();
    expect(oneData.session.id).toBe(session.id);
    expect(oneData.progress).toEqual({ completed: 0, failed: 0, total: 0 });
  });

  // [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [REQ-MESH_API]: POST start uses approved plan when no changeSet
  it("post_start_with_approved_plan_returns_progress", async () => {
    const rt = getMeshRuntime();
    const mesh = await createTestMesh("Start Mesh");
    const d1 = rt.depotService.addDepot(mesh.id, {
      name: "Src",
      kind: "virtual",
      root: "/",
    });
    const d2 = rt.depotService.addDepot(mesh.id, {
      name: "Dst",
      kind: "virtual",
      root: "/",
    });
    if (isDomainValidationError(d1) || isDomainValidationError(d2) || "code" in d1 || "code" in d2) {
      throw new Error("depot setup");
    }
    const srcConn = new FakeConnector();
    const dstConn = new FakeConnector();
    srcConn.seedFile("/a.txt", new TextEncoder().encode("x"));
    rt.registerConnector(d1.id, srcConn);
    rt.registerConnector(d2.id, dstConn);
    const record = rt.meshRepository.get(mesh.id)!;
    record.mesh.links = [
      {
        id: "l1",
        sourceDepotId: d1.id,
        targetDepotId: d2.id,
        direction: "one_way",
      },
    ];
    rt.meshRepository.save(record);
    const plan = rt.generatePlan(mesh.id, d1.id, d2.id);
    if (!plan || "allowed" in plan) {
      throw new Error("plan failed");
    }
    rt.safety.recordDryRun(mesh.id);
    const session = rt.sessions.createSession(record.mesh);
    if (isDomainValidationError(session)) {
      throw new Error("session");
    }
    rt.sessions.approvePlan(session.id, plan);

    const startRes = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          action: "start",
          sessionId: session.id,
          confirmedDestructive: true,
        }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.executed).toBe(true);
    expect(startData.progress).toBeDefined();
    expect(startData.progress.total).toBeGreaterThanOrEqual(0);
  });

  // [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [REQ-MESH_API]: POST cancel signals runtime cancel flag
  it("post_cancel_invokes_cancelSessionExecution", async () => {
    const mesh = await createTestMesh("Cancel Mesh");
    const createRes = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ action: "create" }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    const { session } = await createRes.json();

    const cancelRes = await sessionPost(
      new Request(`http://localhost/api/mesh/${mesh.id}/sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ action: "cancel", sessionId: session.id }),
      }),
      { params: Promise.resolve({ meshId: mesh.id }) },
    );
    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.session.state).toBe("cancelled");
  });
});
