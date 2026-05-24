// [REQ-MESH_GUI] [IMPL-MESH_GUI] [ARCH-MESH_LAYERED]: Mesh detail component tests
// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE]: MESH_DETAIL_RESTORE_LINK, WORKSPACE_SNAPSHOT_SUMMARY

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshDetailClient } from "./MeshDetailClient";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  WORKSPACE_SNAPSHOT_TAG,
} from "@/lib/workspace-mesh-bridge";

vi.mock("@/lib/display-spec-store", () => ({
  getDisplaySpecStore: vi.fn(() => ({
    get: (id: string) => (id === "spec-abc" ? { id, name: "Hide dotfiles" } : undefined),
  })),
}));

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
    // [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-MESH_GUI] [ARCH-WORKSPACE_MESH_BRIDGE]: mesh_detail_snapshot_summary_shows_note_save_time_shared_and_per_pane_sort_and_display_filters
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "name",
      sharedSort: { sortBy: "mtime", sortDirection: "desc", sortDirsFirst: false },
      panes: [
        {
          path: "/tmp/ws-pane",
          sortBy: "size",
          sortDirection: "desc",
          sortDirsFirst: false,
          cursor: 0,
          displaySpecId: "spec-abc",
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "WS", note: "evening backup", snapshot });
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
            updatedAt: "2026-05-22T18:45:00.000Z",
          }),
        ),
      ),
    );

    render(<MeshDetailClient meshId="mesh-ws-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("workspace-snapshot-summary")).toBeInTheDocument();
    });
    const summary = screen.getByTestId("workspace-snapshot-summary");
    expect(summary).toHaveTextContent("evening backup");
    expect(summary).toHaveTextContent("Most recent save time:");
    expect(summary).toHaveTextContent("2026-05-22");
    expect(summary).toHaveTextContent("/tmp/ws-pane");
    expect(summary).toHaveTextContent("Linked: on");
    expect(summary).toHaveTextContent("Shared sort: mtime desc");
    expect(summary).toHaveTextContent("Sort: size desc");
    expect(summary).toHaveTextContent("Display filter: Hide dotfiles");
    const link = screen.getByTestId("open-workspace-from-mesh");
    expect(link).toHaveAttribute("href", "/files?meshId=mesh-ws-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute(
      "aria-label",
      "Open in File Manager (opens in new tab)",
    );
  });

  it("MESH_DETAIL_RESTORE_LINK_shows_per_pane_compare_filters", async () => {
    // [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY]: mesh_detail_snapshot_summary_shows_per_pane_compare_filters via WORKSPACE_SNAPSHOT_SUMMARY_LIST
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "name",
      sharedSort: { sortBy: "mtime", sortDirection: "asc", sortDirsFirst: true },
      panes: [
        {
          path: "/tmp/pane-a",
          sortBy: "mtime",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
          displaySpecId: "spec-abc",
          crossPaneVisibilityId: null,
          crossPaneVisibility: {
            toggles: { sharedAll: "inactive", missingSome: "exclude", sizeLargestSome: "inactive" },
            sizeThreshold: null,
            timeThreshold: null,
          },
        },
        {
          path: "/tmp/pane-b",
          sortBy: "size",
          sortDirection: "desc",
          sortDirsFirst: true,
          cursor: 0,
          displaySpecId: "spec-abc",
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "TwoPane", note: "dual pane", snapshot });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            mesh: {
              id: "mesh-two-pane",
              name: "TwoPane",
              description: payload.description,
              tags: [WORKSPACE_SNAPSHOT_TAG],
              depots: [
                { id: "d1", name: "Pane 1", kind: "local", root: "/tmp/pane-a" },
                { id: "d2", name: "Pane 2", kind: "local", root: "/tmp/pane-b" },
              ],
              links: [],
            },
            status: "active",
            updatedAt: "2026-05-24T16:45:54.799Z",
          }),
        ),
      ),
    );

    render(<MeshDetailClient meshId="mesh-two-pane" />);
    await waitFor(() => {
      expect(screen.getByTestId("workspace-snapshot-summary")).toBeInTheDocument();
    });
    const summary = screen.getByTestId("workspace-snapshot-summary");
    expect(summary).toHaveTextContent("dual pane");
    expect(summary).toHaveTextContent("/tmp/pane-a");
    expect(summary).toHaveTextContent("/tmp/pane-b");
    expect(summary).toHaveTextContent("Display filter: Hide dotfiles");
    expect(summary).toHaveTextContent("Compare filter: (none) · missingSome:exclude");
    expect(summary).toHaveTextContent("Compare filter: (none)");
    expect(summary).not.toHaveTextContent("Compare filters:");
  });
});
