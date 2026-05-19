// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: SyncSessionClient component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncSessionClient } from "./SyncSessionClient";

describe("SyncSessionClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/events")) {
          return new Response(JSON.stringify({ events: [] }));
        }
        if (init?.method === "POST" && JSON.stringify(init.body).includes("create")) {
          return new Response(
            JSON.stringify({ session: { id: "sess-1", state: "idle" } }),
            { status: 201 },
          );
        }
        return new Response(JSON.stringify({ session: { id: "sess-1", state: "running" } }));
      }),
    );
  });

  it("shows_active_session_view_after_create", async () => {
    const user = userEvent.setup();
    render(<SyncSessionClient meshId="m1" />);
    await user.click(screen.getByRole("button", { name: /new session/i }));
    await waitFor(() => {
      expect(screen.getByTestId("session-state")).toHaveTextContent("idle");
    });
  });
});
