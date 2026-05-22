// [IMPL-MESH_GUI] [IMPL-MESH_IMPORT_EXPORT] [REQ-MESH_IMPORT_EXPORT]: Export UI component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshExportClient } from "./MeshExportClient";

describe("MeshExportClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ mesh: { id: "m1", name: "Test", depots: [], links: [] } })),
      ),
    );
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => "blob:test");
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }
  });

  it("export_mesh_btn_triggers_download_message", async () => {
    const user = userEvent.setup();
    render(<MeshExportClient meshId="m1" />);
    await user.click(screen.getByTestId("export-mesh-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("export-message")).toHaveTextContent(/redacted/i);
    });
  });
});
