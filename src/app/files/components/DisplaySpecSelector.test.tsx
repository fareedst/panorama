// [REQ-PANE_DISPLAY_FILTER] [IMPL-PANE_DISPLAY_FILTER_UI]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisplaySpecSelector } from "./DisplaySpecSelector";

describe("DisplaySpecSelector [IMPL-PANE_DISPLAY_FILTER_UI]", () => {
  const specs = [
    {
      id: "spec-a",
      name: "Alpha",
      version: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      rules: [],
    },
  ];

  it("PANE_HEADER_SELECTOR calls onSelect when spec chosen [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]: how: FilePane shows DisplaySpecSelector dropdown; when active spec show Filter label and optional Hidden count from hiddenCount", () => {
    const onSelect = vi.fn();
    render(
      <DisplaySpecSelector
        specs={specs}
        activeSpecId={null}
        recentSpecIds={[]}
        onSelect={onSelect}
        onManage={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByTestId("pane-display-spec-selector"), {
      target: { value: "spec-a" },
    });
    expect(onSelect).toHaveBeenCalledWith("spec-a");
  });

  it("PANE_HEADER_SELECTOR opens manage flow on Manage specs option", () => {
    const onManage = vi.fn();
    render(
      <DisplaySpecSelector
        specs={specs}
        activeSpecId="spec-a"
        recentSpecIds={["spec-a"]}
        onSelect={vi.fn()}
        onManage={onManage}
      />,
    );
    fireEvent.change(screen.getByTestId("pane-display-spec-selector"), {
      target: { value: "__manage__" },
    });
    expect(onManage).toHaveBeenCalled();
  });
});
