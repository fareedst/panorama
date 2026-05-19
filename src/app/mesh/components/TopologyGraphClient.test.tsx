// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: TopologyGraphClient component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TopologyGraphClient } from "./TopologyGraphClient";

describe("TopologyGraphClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            graph: {
              nodes: [{ id: "d1", name: "A", status: "ok" }],
              edges: [],
              warnings: [],
            },
          }),
        ),
      ),
    );
  });

  it("renders_topology_view_with_nodes", async () => {
    render(<TopologyGraphClient meshId="m1" />);
    await waitFor(() => {
      expect(screen.getByTestId("topology-view")).toBeInTheDocument();
    });
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
