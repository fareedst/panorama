// [REQ-MESH_GUI] [IMPL-MESH_GUI]: Mesh detail component tests — phase 18

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshDetailClient } from "./MeshDetailClient";

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
});
