// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_UI]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TriStateToolbarButton } from "./TriStateToolbarButton";

describe("TriStateToolbarButton", () => {
  it("cycles via onClick and exposes data-tri-state", () => {
    const onClick = vi.fn();
    render(
      <TriStateToolbarButton
        action="view.compareFilter.sharedAll"
        icon="files"
        label="Shared all"
        description="Shared in all panes"
        triState="include"
        onClick={onClick}
      />,
    );
    const btn = screen.getByTestId("toolbar-view.compareFilter.sharedAll");
    expect(btn).toHaveAttribute("data-tri-state", "include");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });
});
