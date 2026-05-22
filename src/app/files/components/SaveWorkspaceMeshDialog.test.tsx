// [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Save workspace mesh dialog tests — STORE_FROM_WORKSPACE_UI

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SaveWorkspaceMeshDialog } from "./SaveWorkspaceMeshDialog";

describe("SaveWorkspaceMeshDialog STORE_FROM_WORKSPACE_UI [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  it("STORE_FROM_WORKSPACE_UI_requires_mesh_name_before_save", async () => {
    const onSave = vi.fn();
    render(
      <SaveWorkspaceMeshDialog isOpen onClose={() => {}} onSave={onSave} />,
    );
    fireEvent.click(screen.getByTestId("save-workspace-mesh-submit"));
    expect(await screen.findByTestId("save-workspace-mesh-error")).toHaveTextContent(
      "Mesh name is required",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("STORE_FROM_WORKSPACE_UI_calls_onSave_with_name_and_note", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveWorkspaceMeshDialog isOpen onClose={() => {}} onSave={onSave} />,
    );
    fireEvent.change(screen.getByTestId("save-workspace-mesh-name"), {
      target: { value: "Test Mesh" },
    });
    fireEvent.change(screen.getByTestId("save-workspace-mesh-note"), {
      target: { value: "my note" },
    });
    fireEvent.click(screen.getByTestId("save-workspace-mesh-submit"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("Test Mesh", "my note", "create");
    });
  });

  it("UPDATE_EXISTING_WORKSPACE_shows_mode_radios_when_meshId_set", () => {
    render(
      <SaveWorkspaceMeshDialog
        isOpen
        meshId="mesh-1"
        defaultName="My Workspace"
        onClose={() => {}}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId("save-workspace-mesh-mode-update")).toBeInTheDocument();
    expect(screen.getByTestId("save-workspace-mesh-mode-create")).toBeInTheDocument();
    expect(screen.getByTestId("save-workspace-mesh-name")).toHaveValue("My Workspace");
  });

  it("UPDATE_EXISTING_WORKSPACE_calls_onSave_with_update_mode", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveWorkspaceMeshDialog
        isOpen
        meshId="mesh-1"
        defaultName="My Workspace"
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByTestId("save-workspace-mesh-submit"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("My Workspace", undefined, "update");
    });
  });
});
