// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS]: icon registry completeness
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "@/components/Icon";
import { isIconRegistered } from "./registry";
import { getReferencedToolbarIconNames } from "@/lib/toolbar.utils";

describe("[REQ-TOOLBAR_SYSTEM] icon registry", () => {
  // [ICON_REGISTRY] completeness vs ACTION_ICON_MAP and TOOLBAR_ACTIONS_ICON_NAMES
  it("registers every icon referenced by toolbar maps and toolbars.actions", () => {
    const missing = getReferencedToolbarIconNames().filter(
      (name) => !isIconRegistered(name),
    );
    expect(missing).toEqual([]);
  });

  it("renders registered icons without icon-unknown fallback attribute", () => {
    const { container } = render(<Icon name="layout-grid" size={16} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("data-icon-fallback")).toBeNull();
  });

  it("uses icon-unknown fallback for unregistered names", () => {
    const { container } = render(<Icon name="__not_a_real_icon__" size={16} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-icon-fallback")).toBe("icon-unknown");
  });
});
