// [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: Mesh list component tests
// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: note and save-time columns from bridge helpers

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshListClient } from "./MeshListClient";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";

describe("MeshListClient [IMPL-MESH_GUI]", () => {
  const snapshot = captureWorkspaceSnapshot({
    layout: "Tile",
    focusIndex: 0,
    linkedMode: false,
    comparisonMode: "off",
    panes: [
      {
        path: "/tmp/a",
        sortBy: "name",
        sortDirection: "asc",
        sortDirsFirst: true,
        cursor: 0,
      },
    ],
  });
  const notedPayload = buildMeshCreatePayload({
    name: "Noted",
    note: "project alpha",
    snapshot,
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("includeArchived=true")) {
          return new Response(JSON.stringify({ meshes: [] }));
        }
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              mesh: { id: "m1", name: "New", depots: [] },
              status: "active",
            }),
            { status: 201 },
          );
        }
        return new Response(
          JSON.stringify({
            meshes: [
              {
                id: "m1",
                name: "Alpha",
                status: "active",
                depots: [{ id: "d1" }],
                description: notedPayload.description,
                updatedAt: "2026-05-22T10:00:00.000Z",
              },
              {
                id: "m2",
                name: "Zulu",
                status: "active",
                depots: [],
                updatedAt: "2026-05-23T10:00:00.000Z",
              },
            ],
          }),
        );
      }),
    );
  });

  it("mesh_list_displays_mesh_name_state_and_depot_count", async () => {
    // [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: mesh_list_displays_mesh_name_state_and_depot_count
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });
    const alphaRow = screen.getAllByTestId("mesh-row").find((r) => within(r).queryByText("Alpha"));
    expect(alphaRow).toBeDefined();
    expect(within(alphaRow!).getByTestId("mesh-status-badge")).toHaveTextContent("active");
    expect(within(alphaRow!).getByText("1")).toBeInTheDocument();
  });

  it("mesh_list_displays_note_and_most_recent_save_time", async () => {
    // [REQ-MESH_GUI] [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-MESH_GUI] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE]: mesh_list_displays_note_and_most_recent_save_time
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });
    const rows = screen.getAllByTestId("mesh-row");
    const alphaRow = rows.find((r) => within(r).queryByText("Alpha"));
    expect(alphaRow).toBeDefined();
    expect(within(alphaRow!).getByTestId("mesh-list-note")).toHaveTextContent("project alpha");
    expect(within(alphaRow!).getByTestId("mesh-list-updated-at")).toHaveTextContent("2026-05-22");
  });

  it("mesh_list_sort_by_name_toggles_order", async () => {
    // [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: mesh_list_sortable_column_headers_toggle_order — name column
    const user = userEvent.setup();
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Zulu")).toBeInTheDocument();
    });
    const getRowNames = () =>
      screen.getAllByTestId("mesh-row").map((r) => within(r).getByRole("link").textContent);
    expect(getRowNames()).toEqual(["Alpha", "Zulu"]);
    await user.click(screen.getByTestId("mesh-list-sort-name"));
    await waitFor(() => {
      expect(getRowNames()).toEqual(["Zulu", "Alpha"]);
    });
    await user.click(screen.getByTestId("mesh-list-sort-name"));
    await waitFor(() => {
      expect(getRowNames()).toEqual(["Alpha", "Zulu"]);
    });
  });

  it("mesh_list_sort_by_updated_at_orders_by_save_time", async () => {
    // [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: mesh_list_sortable_column_headers_toggle_order — updatedAt column
    const user = userEvent.setup();
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Zulu")).toBeInTheDocument();
    });
    const getRowNames = () =>
      screen.getAllByTestId("mesh-row").map((r) => within(r).getByRole("link").textContent);
    await user.click(screen.getByTestId("mesh-list-sort-updated-at"));
    await waitFor(() => {
      expect(getRowNames()).toEqual(["Alpha", "Zulu"]);
    });
    await user.click(screen.getByTestId("mesh-list-sort-updated-at"));
    await waitFor(() => {
      expect(getRowNames()).toEqual(["Zulu", "Alpha"]);
    });
  });

  it("mesh_list_sort_by_note_orders_alphabetically", async () => {
    // [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: mesh_list_sortable_column_headers_toggle_order — note column
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("includeArchived=true")) {
          return new Response(JSON.stringify({ meshes: [] }));
        }
        if (init?.method === "POST") {
          return new Response(JSON.stringify({ mesh: { id: "m1", name: "New", depots: [] } }), {
            status: 201,
          });
        }
        const betaPayload = buildMeshCreatePayload({
          name: "Beta",
          note: "zebra note",
          snapshot,
        });
        return new Response(
          JSON.stringify({
            meshes: [
              {
                id: "m1",
                name: "Alpha",
                status: "active",
                depots: [],
                description: notedPayload.description,
                updatedAt: "2026-05-22T10:00:00.000Z",
              },
              {
                id: "m2",
                name: "Beta",
                status: "active",
                depots: [],
                description: betaPayload.description,
                updatedAt: "2026-05-22T10:00:00.000Z",
              },
            ],
          }),
        );
      }),
    );
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });
    const getRowNames = () =>
      screen.getAllByTestId("mesh-row").map((r) => within(r).getByRole("link").textContent);
    await user.click(screen.getByTestId("mesh-list-sort-note"));
    await waitFor(() => {
      expect(getRowNames()).toEqual(["Alpha", "Beta"]);
    });
  });

  it("mesh_list_can_filter_archived_meshes", async () => {
    const user = userEvent.setup();
    render(<MeshListClient />);
    await user.click(screen.getByTestId("show-archived"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("includeArchived=true"));
    });
  });
});
