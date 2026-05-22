// [IMPL-MESH_GUI] [IMPL-MESH_CRUD] [REQ-MESH_CRUD]: Archive mesh UI component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshArchiveClient } from "./MeshArchiveClient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("MeshArchiveClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ archived: true }), { status: 200 })),
    );
  });

  it("archive_mesh_btn_archives_and_navigates", async () => {
    const user = userEvent.setup();
    render(<MeshArchiveClient meshId="m1" />);
    await user.click(screen.getByTestId("archive-mesh-btn"));
    await waitFor(() => {
      expect(screen.getByText(/Mesh archived/i)).toBeInTheDocument();
      expect(push).toHaveBeenCalledWith("/mesh");
    });
  });
});
