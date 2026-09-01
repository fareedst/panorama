// [IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { HelpOverlay } from "./HelpOverlay";
import { initializeKeybindingRegistry } from "@/lib/files.keybinds";

describe("HelpOverlay responsive layout [IMPL-RESPONSIVE_CLASSES] [REQ-RESPONSIVE_DESIGN]", () => {
  beforeEach(() => {
    initializeKeybindingRegistry([
      {
        key: "?",
        action: "help.show",
        description: "Show help",
        category: "system",
      },
      {
        key: "ArrowUp",
        action: "navigate.up",
        description: "Move up",
        category: "navigation",
      },
    ]);
  });

  // [IMPL-RESPONSIVE_CLASSES]: category grid uses one column below lg and two at lg+
  it("help_overlay_category_grid_uses_responsive_columns [IMPL-RESPONSIVE_CLASSES]", () => {
    const { container } = render(<HelpOverlay isOpen onClose={() => {}} />);

    const grid = container.querySelector(".grid.grid-cols-1");
    expect(grid).not.toBeNull();
    expect(grid?.className).toMatch(/lg:grid-cols-2/);
  });
});
