// [REQ-MESH_PLATFORM]: Mesh list component tests — phase 17–18

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshListClient } from "./MeshListClient";

describe("MeshListClient [IMPL-MESH_GUI]", () => {
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
              { id: "m1", name: "Alpha", status: "active", depots: [{ id: "d1" }] },
            ],
          }),
        );
      }),
    );
  });

  it("mesh_list_displays_mesh_name_state_and_depot_count", async () => {
    render(<MeshListClient />);
    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });
    expect(screen.getByTestId("mesh-status-badge")).toHaveTextContent("active");
    expect(screen.getByText("1")).toBeInTheDocument();
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
