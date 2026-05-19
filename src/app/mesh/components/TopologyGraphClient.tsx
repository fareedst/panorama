"use client";

// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Topology graph — phase 19

import { useEffect, useState } from "react";
import { MeshDetailNav } from "../layout";

type Topo = {
  graph: {
    nodes: { id: string; name: string; status: string }[];
    edges: { id: string; sourceDepotId: string; targetDepotId: string; status: string }[];
    warnings: string[];
  };
};

export function TopologyGraphClient({ meshId }: { meshId: string }) {
  const [topo, setTopo] = useState<Topo | null>(null);

  useEffect(() => {
    void fetch(`/api/mesh/${meshId}/topology`)
      .then((r) => r.json())
      .then(setTopo);
  }, [meshId]);

  if (!topo) {
    return <p className="text-zinc-500">Loading topology…</p>;
  }

  return (
    <div data-testid="topology-view">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Topology</h1>
      {topo.graph.warnings.length > 0 && (
        <div
          className="mb-4 rounded border border-amber-800 bg-amber-950/50 p-3 text-sm text-amber-200"
          data-testid="topology-warnings"
        >
          {topo.graph.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}
      <svg
        viewBox="0 0 600 300"
        className="w-full rounded border border-zinc-800 bg-zinc-900"
        data-testid="topology-graph"
      >
        {topo.graph.nodes.map((node, i) => {
          const x = 80 + (i % 3) * 180;
          const y = 80 + Math.floor(i / 3) * 100;
          return (
            <g key={node.id} data-testid="topology-node">
              <circle
                cx={x}
                cy={y}
                r={28}
                fill={node.status === "ok" ? "#166534" : "#7f1d1d"}
              />
              <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize={10}>
                {node.name.slice(0, 8)}
              </text>
            </g>
          );
        })}
        {topo.graph.edges.map((edge, i) => (
          <line
            key={edge.id}
            x1={80 + (i % 3) * 180}
            y1={80}
            x2={260}
            y2={180}
            stroke={edge.status === "ok" ? "#3b82f6" : "#ef4444"}
            strokeWidth={2}
            data-testid="topology-edge"
          />
        ))}
      </svg>
    </div>
  );
}
