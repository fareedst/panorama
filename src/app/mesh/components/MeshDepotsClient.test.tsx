// [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]
// how: Per-mesh depots sub-route — fetch mesh, add/remove depots via API, credential reference UI stub; testids mesh-depots, add-depot-*, depot-summary, manage-credentials-btn.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshDepotsClient } from "./MeshDepotsClient";

describe("MeshDepotsClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/api/mesh/credentials") && init?.method === "POST") {
          return new Response(JSON.stringify({ error: { message: "Forbidden" } }), {
            status: 403,
          });
        }
        if (url.includes("/depots/d1") && init?.method === "DELETE") {
          return new Response(
            JSON.stringify({
              mesh: {
                id: "m1",
                name: "Test",
                depots: [],
              },
            }),
          );
        }
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
            },
          }),
        );
      }),
    );
  });

  // [REQ-MESH_GUI] per_mesh_depots_page_supports_depot_crud — how: depot-summary shows count after GET mesh.
  it("mesh_depots_displays_depot_summary", async () => {
    render(<MeshDepotsClient meshId="m1" />);
    await waitFor(() => {
      expect(screen.getByTestId("depot-summary")).toHaveTextContent("Depots (1)");
    });
    expect(screen.getByTestId("mesh-depots")).toBeInTheDocument();
    expect(screen.getByText(/A \(local\)/)).toBeInTheDocument();
  });

  // [REQ-MESH_GUI] [IMPL-MESH_DEPOT] per_mesh_depots_page_supports_depot_crud — how: add-depot form POSTs name/kind/root.
  it("add_depot_form_submits_to_api", async () => {
    const user = userEvent.setup();
    render(<MeshDepotsClient meshId="m1" />);
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

  // [REQ-MESH_GUI] [IMPL-MESH_DEPOT] per_mesh_depots_page_supports_depot_crud — how: remove-depot DELETEs then reloads.
  it("remove_depot_calls_delete", async () => {
    const user = userEvent.setup();
    render(<MeshDepotsClient meshId="m1" />);
    await waitFor(() => screen.getByTestId("remove-depot-d1"));
    await user.click(screen.getByTestId("remove-depot-d1"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/mesh/m1/depots/d1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  // [REQ-MESH_GUI] [REQ-MESH_PLATFORM] per_mesh_depots_page_supports_depot_crud — how: operator credential POST shows credential-denied on 403.
  it("credential_denied_shown_for_operator_role", async () => {
    const user = userEvent.setup();
    render(<MeshDepotsClient meshId="m1" />);
    await waitFor(() => screen.getByTestId("manage-credentials-btn"));
    await user.click(screen.getByTestId("manage-credentials-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("credential-denied")).toHaveTextContent(
        "Credential management denied for operator role",
      );
    });
  });
});
