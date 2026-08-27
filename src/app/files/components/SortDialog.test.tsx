// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-LINKED_PANES]: workspace sharedSort; SortDialog Share copies draft; Shared applies sharedSort to focused pane only; new panes inherit sharedSort

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SortDialog from "./SortDialog";
import { DEFAULT_PANE_SORT } from "@/lib/files.utils";

const paneSort = { sortBy: "size" as const, sortDirection: "desc" as const, sortDirsFirst: false };
const sharedSort = DEFAULT_PANE_SORT;

describe("SortDialog [REQ-FILE_SORTING_ADVANCED]", () => {
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: paneSortSettingsEqual returns true when sortBy sortDirection sortDirsFirst all match for Share/Shared disable logic
  it("disables Share and Shared when pane sort equals shared sort", () => {
    render(
      <SortDialog
        isOpen
        currentCriterion="name"
        currentDirection="asc"
        currentDirsFirst
        paneSort={DEFAULT_PANE_SORT}
        sharedSort={DEFAULT_PANE_SORT}
        onApply={vi.fn()}
        onApplyShared={vi.fn()}
        onShareToWorkspace={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-dialog-share")).toBeDisabled();
    expect(screen.getByTestId("sort-dialog-shared")).toBeDisabled();
  });

  // how: pane sort differs from sharedSort so Share and Shared buttons are enabled
  it("enables Share and Shared when pane sort differs from shared", () => {
    render(
      <SortDialog
        isOpen
        currentCriterion="size"
        currentDirection="desc"
        currentDirsFirst={false}
        paneSort={paneSort}
        sharedSort={sharedSort}
        onApply={vi.fn()}
        onApplyShared={vi.fn()}
        onShareToWorkspace={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-dialog-share")).not.toBeDisabled();
    expect(screen.getByTestId("sort-dialog-shared")).not.toBeDisabled();
  });

  // how: Shared clicked invokes onApplyShared and closes dialog (WorkspaceView wires singlePaneOnly)
  it("calls onApplyShared when Shared is clicked", () => {
    const onApplyShared = vi.fn();
    const onClose = vi.fn();
    render(
      <SortDialog
        isOpen
        currentCriterion="size"
        currentDirection="desc"
        currentDirsFirst={false}
        paneSort={paneSort}
        sharedSort={sharedSort}
        onApply={vi.fn()}
        onApplyShared={onApplyShared}
        onShareToWorkspace={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("sort-dialog-shared"));
    expect(onApplyShared).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  // how: Share clicked passes draft sort triple to onShareToWorkspace without immediate resort
  it("calls onShareToWorkspace with draft settings when Share is clicked", () => {
    const onShare = vi.fn();
    render(
      <SortDialog
        isOpen
        currentCriterion="size"
        currentDirection="desc"
        currentDirsFirst={false}
        paneSort={paneSort}
        sharedSort={sharedSort}
        onApply={vi.fn()}
        onApplyShared={vi.fn()}
        onShareToWorkspace={onShare}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("sort-dialog-share"));
    expect(onShare).toHaveBeenCalledWith({
      sortBy: "size",
      sortDirection: "desc",
      sortDirsFirst: false,
    });
  });

  // [IMPL-RESPONSIVE_CLASSES]: dialog panel caps width with max-w-[90vw] for narrow viewports
  it("sort_dialog_panel_uses_viewport_max_width_guard [IMPL-RESPONSIVE_CLASSES]", () => {
    render(
      <SortDialog
        isOpen
        currentCriterion="name"
        currentDirection="asc"
        currentDirsFirst
        paneSort={DEFAULT_PANE_SORT}
        sharedSort={DEFAULT_PANE_SORT}
        onApply={vi.fn()}
        onApplyShared={vi.fn()}
        onShareToWorkspace={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const panel = screen.getByTestId("sort-dialog");
    expect(panel.className).toMatch(/w-96/);
    expect(panel.className).toMatch(/max-w-\[90vw\]/);
  });
});
