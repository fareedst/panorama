// [REQ-FILE_SORTING_ADVANCED] [IMPL-SORT_FILTER]: SortDialog Shared/Share behavior

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SortDialog from "./SortDialog";
import { DEFAULT_PANE_SORT } from "@/lib/files.utils";

const paneSort = { sortBy: "size" as const, sortDirection: "desc" as const, sortDirsFirst: false };
const sharedSort = DEFAULT_PANE_SORT;

describe("SortDialog [REQ-FILE_SORTING_ADVANCED]", () => {
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] SharedSortWorkspace — disable Share/Shared when pane matches shared
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

  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] SharedSortWorkspace — enable when pane differs from shared
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

  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES] SharedSortWorkspace — Shared invokes onApplyShared (singlePaneOnly at WorkspaceView)
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

  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] SharedSortWorkspace — Share copies draft sort to workspace sharedSort
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
});
