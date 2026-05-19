// [IMPL-MESH_GUI] [ARCH-MESH_LAYERED] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: ConflictsClient component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ConflictsClient } from "./ConflictsClient";

describe("ConflictsClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            conflicts: [
              {
                id: "c1",
                type: "modify_modify",
                participants: ["a", "b"],
                status: "pending",
              },
            ],
          }),
        ),
      ),
    );
  });

  it("renders_conflict_view_with_pending_count", async () => {
    render(<ConflictsClient meshId="m1" />);
    await waitFor(() => {
      expect(screen.getByTestId("conflict-view")).toBeInTheDocument();
    });
    expect(screen.getByTestId("conflict-list")).toBeInTheDocument();
    expect(screen.getByText(/modify_modify/)).toBeInTheDocument();
  });
});
