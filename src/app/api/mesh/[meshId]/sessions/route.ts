// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session lifecycle and progress over HTTP.

import {
  getRuntime,
  handleServiceResult,
  jsonError,
  requirePermission,
} from "@/lib/mesh/api/mesh-api-helpers";
import { isDomainValidationError, type ChangeSet } from "@/lib/mesh/domain";

type Params = { params: Promise<{ meshId: string }> };

// [IMPL-MESH_API] [IMPL-MESH_RUNTIME] [IMPL-MESH_SESSION] [ARCH-MESH_LAYERED] [REQ-MESH_API] [REQ-MESH_PLATFORM]: Session lifecycle and progress over HTTP.
export async function GET(request: Request, { params }: Params) {
  const { meshId } = await params;
  const rt = getRuntime();
  if (!rt.meshService.getMesh(meshId)) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (sessionId) {
    const session = rt.sessions.getSession(sessionId);
    if (!session) {
      return jsonError(404, "session_not_found", "Session not found");
    }
    return Response.json({
      session,
      progress: rt.getSessionProgress(sessionId),
    });
  }
  return Response.json({ sessions: rt.sessions.listForMesh(meshId) });
}

export async function POST(request: Request, { params }: Params) {
  const { meshId } = await params;
  const body = (await request.json()) as {
    action?: string;
    sessionId?: string;
    changeSet?: ChangeSet;
    confirmedDestructive?: boolean;
  };

  const rt = getRuntime();
  const record = rt.meshService.getMesh(meshId);
  if (!record) {
    return jsonError(404, "mesh_not_found", "Mesh not found");
  }

  // how: POST sessions create — require run_sync, createSession, record lifecycle event, return 201
  if (body.action === "create") {
    const denied = requirePermission(request, "run_sync");
    if (denied) {
      return denied;
    }
    const session = rt.sessions.createSession(record.mesh);
    if (isDomainValidationError(session)) {
      return jsonError(400, session.code, session.message);
    }
    rt.events.recordSessionLifecycle(session.id, session.state, meshId);
    return Response.json({ session }, { status: 201 });
  }

  if (!body.sessionId) {
    return jsonError(400, "session_id_required", "sessionId is required");
  }

  // how: POST sessions approve — require run_sync, approvePlan with changeSet
  if (body.action === "approve" && body.changeSet) {
    const denied = requirePermission(request, "run_sync");
    if (denied) {
      return denied;
    }
    rt.sessions.approvePlan(body.sessionId, body.changeSet);
    return Response.json({ approved: true });
  }

  // how: POST sessions start — checkExecution on changeSet or approved plan; runApprovedSession returns progress
  if (body.action === "start") {
    const denied = requirePermission(request, "run_sync");
    if (denied) {
      return denied;
    }
    const plan = rt.sessions.getApprovedPlan(body.sessionId);
    if (body.changeSet) {
      const safety = rt.checkExecution(meshId, body.changeSet, body.confirmedDestructive);
      if (!safety.allowed) {
        return Response.json(
          {
            error: {
              code: safety.code ?? "safety_blocked",
              message: safety.message ?? "Blocked",
            },
            requiresConfirmation: safety.requiresConfirmation,
          },
          { status: 400 },
        );
      }
      rt.sessions.approvePlan(body.sessionId, body.changeSet);
    } else if (plan) {
      const safety = rt.checkExecution(meshId, plan, body.confirmedDestructive);
      if (!safety.allowed) {
        return Response.json(
          {
            error: {
              code: safety.code ?? "safety_blocked",
              message: safety.message ?? "Blocked",
            },
            requiresConfirmation: safety.requiresConfirmation,
          },
          { status: 400 },
        );
      }
    }
    const runResult = await rt.runApprovedSession(body.sessionId, {
      confirmedDestructive: body.confirmedDestructive,
    });
    if (runResult && typeof runResult === "object" && "allowed" in runResult && !runResult.allowed) {
      return Response.json(
        { error: runResult, requiresConfirmation: runResult.requiresConfirmation },
        { status: 400 },
      );
    }
    const result = rt.sessions.getSession(body.sessionId);
    return Response.json({
      session: result,
      executed: runResult === true,
      progress: rt.getSessionProgress(body.sessionId),
    });
  }

  // how: POST sessions pause or resume — require pause_cancel_sync, delegate to SessionService
  if (body.action === "pause") {
    const denied = requirePermission(request, "pause_cancel_sync");
    if (denied) {
      return denied;
    }
    const result = rt.sessions.pause(body.sessionId);
    const err = handleServiceResult(result);
    return err ?? Response.json({ session: result });
  }

  if (body.action === "resume") {
    const denied = requirePermission(request, "pause_cancel_sync");
    if (denied) {
      return denied;
    }
    const result = rt.sessions.resume(body.sessionId);
    const err = handleServiceResult(result);
    return err ?? Response.json({ session: result });
  }

  // how: POST sessions cancel — cancelSessionExecution then sessions.cancel
  if (body.action === "cancel") {
    const denied = requirePermission(request, "pause_cancel_sync");
    if (denied) {
      return denied;
    }
    rt.cancelSessionExecution(body.sessionId);
    const result = rt.sessions.cancel(body.sessionId);
    const err = handleServiceResult(result);
    return err ?? Response.json({ session: result });
  }

  return jsonError(400, "unknown_action", "Unknown session action");
}
