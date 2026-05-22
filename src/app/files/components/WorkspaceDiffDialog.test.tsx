// [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Workspace diff dialog tests — DIFF_SAVED_VS_CURRENT

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceDiffDialog } from "./WorkspaceDiffDialog";

describe("WorkspaceDiffDialog DIFF_SAVED_VS_CURRENT [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  it("shows_no_changes_when_list_empty", () => {
    render(
      <WorkspaceDiffDialog isOpen changes={[]} onClose={() => {}} />,
    );
    expect(screen.getByTestId("workspace-diff-no-changes")).toBeInTheDocument();
  });

  it("lists_field_saved_current_rows", () => {
    render(
      <WorkspaceDiffDialog
        isOpen
        changes={[{ field: "layout", saved: "Tile", current: "OneRow" }]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId("workspace-diff-table")).toBeInTheDocument();
    expect(screen.getByText("Tile")).toBeInTheDocument();
    expect(screen.getByText("OneRow")).toBeInTheDocument();
  });

  it("calls_onClose_when_close_clicked", () => {
    const onClose = vi.fn();
    render(
      <WorkspaceDiffDialog
        isOpen
        changes={[{ field: "layout", saved: "Tile", current: "OneRow" }]}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("workspace-diff-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
