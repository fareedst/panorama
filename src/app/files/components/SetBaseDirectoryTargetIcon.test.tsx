// [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION]

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  SetBaseDirectoryTargetIcon,
  SET_BASE_ICON_SIZE,
  SET_BASE_ICON_STROKE_WIDTH,
} from "./SetBaseDirectoryTargetIcon";

describe("SetBaseDirectoryTargetIcon [IMPL-WORKSPACE_VIEW]", () => {
  it("renders 36px SVG with strokeWidth 1.5", () => {
    const { container } = render(
      <SetBaseDirectoryTargetIcon target="thisPane" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe(String(SET_BASE_ICON_SIZE));
    expect(svg?.getAttribute("height")).toBe(String(SET_BASE_ICON_SIZE));
    expect(svg?.getAttribute("stroke-width")).toBe(
      String(SET_BASE_ICON_STROKE_WIDTH),
    );
  });

  it("renders all nine target variants", () => {
    const targets = [
      "thisPane",
      "allPanes",
      "otherPanes",
      "nextPane",
      "nextPaneSwap",
      "priorPane",
      "priorPaneSwap",
      "newPane",
      "newWorkspace",
    ] as const;
    for (const target of targets) {
      const { container } = render(
        <SetBaseDirectoryTargetIcon target={target} />,
      );
      expect(container.querySelector("svg")).toBeTruthy();
    }
  });
});
