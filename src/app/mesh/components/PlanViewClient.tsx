"use client";

// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: Dry-run plan — approve only; start on Sync page

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type ChangeSet = {
  operations: {
    id: string;
    kind: string;
    sourcePath: string;
    targetPath?: string;
    riskLevel: string;
  }[];
};

export function PlanViewClient({ meshId }: { meshId: string }) {
  const [mesh, setMesh] = useState<{
    depots: { id: string; name: string }[];
    links: { sourceDepotId: string; targetDepotId: string }[];
  } | null>(null);
  const [plan, setPlan] = useState<ChangeSet | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    void fetch(`/api/mesh/${meshId}`)
      .then((r) => r.json())
      .then((d) => setMesh(d.mesh));
  }, [meshId]);

  async function generatePlan() {
    if (!mesh?.links[0]) {
      return;
    }
    const link = mesh.links[0];
    const res = await fetch(`/api/mesh/${meshId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceDepotId: link.sourceDepotId,
        targetDepotId: link.targetDepotId,
      }),
    });
    const data = await res.json();
    setPlan(data.changeSet ?? null);
    setApproved(false);
  }

  const ops =
    plan?.operations.filter((op) => filter === "all" || op.kind === filter) ?? [];
  const hasDestructive = plan?.operations.some(
    (op) => op.kind === "delete" || op.riskLevel === "high",
  );

  // [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_SAFETY]: Approve plan only — create session, approve changeSet, persist for Sync page start
  async function approvePlan() {
    if (!plan || !mesh?.links[0]) {
      return;
    }
    const sessionRes = await fetch(`/api/mesh/${meshId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    if (!sessionRes.ok) {
      return;
    }
    const { session } = await sessionRes.json();
    const approveRes = await fetch(`/api/mesh/${meshId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", sessionId: session.id, changeSet: plan }),
    });
    if (approveRes.ok) {
      sessionStorage.setItem(
        `mesh-approved-session-${meshId}`,
        JSON.stringify({ sessionId: session.id, hasDestructive }),
      );
      setApproved(true);
    }
  }

  function discardPlan() {
    setPlan(null);
    setApproved(false);
  }

  return (
    <div data-testid="plan-view">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Dry-run plan</h1>
      {!mesh?.links.length && (
        <p className="mb-4 text-sm text-amber-300" data-testid="plan-no-links-hint">
          Add at least two depots and a sync link on the mesh overview before generating a
          plan.
        </p>
      )}
      <button
        type="button"
        onClick={() => void generatePlan()}
        disabled={!mesh?.links.length}
        className="mb-4 rounded bg-blue-600 px-3 py-2 text-sm disabled:opacity-40"
        data-testid="generate-plan-btn"
      >
        Generate plan
      </button>
      {hasDestructive && (
        <p
          className="mb-4 rounded border border-red-800 bg-red-950/40 p-2 text-sm text-red-200"
          data-testid="destructive-warning"
        >
          Destructive operations require explicit approval before sync.
        </p>
      )}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
        data-testid="operation-filter"
      >
        <option value="all">All</option>
        <option value="copy">Copy</option>
        <option value="update">Update</option>
        <option value="delete">Delete</option>
      </select>
      <table className="w-full text-sm" data-testid="change-set-table">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500">
            <th className="py-2 text-left">Kind</th>
            <th>Source</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {ops.map((op) => (
            <tr key={op.id} className="border-b border-zinc-900">
              <td className="py-1">{op.kind}</td>
              <td>{op.sourcePath}</td>
              <td>
                <span
                  className={`rounded px-1 text-xs ${
                    op.riskLevel === "high" ? "bg-red-900" : "bg-zinc-800"
                  }`}
                >
                  {op.riskLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {plan && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void approvePlan()}
            className="rounded bg-green-700 px-3 py-2 text-sm"
            data-testid="approve-plan-btn"
          >
            Approve plan
          </button>
          <button
            type="button"
            onClick={discardPlan}
            className="rounded bg-zinc-700 px-3 py-2 text-sm"
            data-testid="discard-plan-btn"
          >
            Discard
          </button>
          {approved && (
            <span className="text-sm text-green-400" data-testid="plan-approved">
              Approved
            </span>
          )}
        </div>
      )}
    </div>
  );
}
