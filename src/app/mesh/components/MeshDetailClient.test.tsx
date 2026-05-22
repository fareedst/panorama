// [REQ-MESH_GUI] [IMPL-MESH_GUI]: Mesh detail component tests — phase 18
// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: MESH_DETAIL_RESTORE_LINK, WORKSPACE_SNAPSHOT_SUMMARY

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshDetailClient } from "./MeshDetailClient";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  WORKSPACE_SNAPSHOT_TAG,
} from "@/lib/workspace-mesh-bridge";

describe("MeshDetailClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/depots") && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              depot: { id: "d-new", name: "NewDepot", kind: "local", root: "/new" },
              mesh: {
                id: "m1",
                name: "Test",
                depots: [
                  { id: "d1", name: "A", kind: "local", root: "/a" },
                  { id: "d-new", name: "NewDepot", kind: "local", root: "/new" },
                ],
                links: [],
              },
            }),
            { status: 201 },
          );
        }
        return new Response(
          JSON.stringify({
            mesh: {
              id: "m1",
              name: "Test",
              depots: [{ id: "d1", name: "A", kind: "local", root: "/a" }],
              links: [],
            },
            status: "active",
          }),
        );
      }),
    );
  });

  it("mesh_detail_displays_depot_summary", async () => {
    render(<MeshDetailClient meshId="m1" />);
    await waitFor(() => {
      expect(screen.getByTestId("depot-summary")).toHaveTextContent("Depots (1)");
    });
    expect(screen.getByText(/A \(local\)/)).toBeInTheDocument();
  });

  it("add_depot_form_submits_to_api", async () => {
    const user = userEvent.setup();
    render(<MeshDetailClient meshId="m1" />);
    await waitFor(() => screen.getByTestId("add-depot-form"));
    await user.type(screen.getByTestId("add-depot-name"), "NewDepot");
    await user.type(screen.getByTestId("add-depot-root"), "/new");
    await user.click(screen.getByTestId("add-depot-btn"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/mesh/m1/depots",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("MESH_DETAIL_RESTORE_LINK_shows_workspace_snapshot_summary_and_open_link", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "name",
      panes: [
        {
          path: "/tmp/ws-pane",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "WS", snapshot });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            mesh: {
              id: "mesh-ws-1",
              name: "WS",
              description: payload.description,
              tags: [WORKSPACE_SNAPSHOT_TAG],
              depots: [
                { id: "d1", name: "Pane 1", kind: "local", root: "/tmp/ws-pane" },
              ],
              links: [],
            },
            status: "active",
          }),
        ),
      ),
    );

    render(<MeshDetailClient meshId="mesh-ws-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("workspace-snapshot-summary")).toBeInTheDocument();
    });
    expect(screen.getByTestId("workspace-snapshot-summary")).toHaveTextContent("/tmp/ws-pane");
    expect(screen.getByTestId("workspace-snapshot-summary")).toHaveTextContent("Linked: on");
    const link = screen.getByTestId("open-workspace-from-mesh");
    expect(link).toHaveAttribute("href", "/files?meshId=mesh-ws-1");
  });
});
