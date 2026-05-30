// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT]
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import { initializeKeybindingRegistry, resetKeybindingRegistry } from "@/lib/files.keybinds";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const testKeybindings = [
  {
    key: "c",
    action: "file.copy",
    description: "Copy files",
    category: "file-operations" as const,
  },
  {
    key: "?",
    action: "help.show",
    description: "Show keyboard shortcuts",
    category: "system" as const,
  },
];

describe("[REQ-TOOLBAR_SYSTEM] Toolbar", () => {
  beforeEach(() => {
    resetKeybindingRegistry();
    initializeKeybindingRegistry(testKeybindings);
  });

  const baseConfig = {
    enabled: true,
    position: "top" as const,
    groups: [
      {
        name: "File Operations",
        actions: ["file.copy"],
      },
    ],
  };

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: leading toggle on first top toolbar switches session toolbarExpanded state; expanded shows three tiers with keystroke badges; compact shows merged single row icon-only; tooltips unchanged
  it("renders leadingContent before action buttons", () => {
    render(
      <Toolbar
        config={baseConfig}
        onAction={vi.fn()}
        leadingContent={<span data-testid="leading-slot">Toggle</span>}
      />,
    );

    const toolbar = screen.getByRole("toolbar");
    const leading = screen.getByTestId("leading-slot");
    const actionButton = screen.getByTestId("toolbar-file.copy");

    expect(toolbar.contains(leading)).toBe(true);
    expect(toolbar.contains(actionButton)).toBe(true);
    expect(
      leading.compareDocumentPosition(actionButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: mergeTopToolbarConfigs concatenates enabled top-position workspace, pane, system groups for compact single-row render
  it("passes showKeystroke=false to hide keystroke badges", () => {
    render(
      <Toolbar
        config={baseConfig}
        onAction={vi.fn()}
        showKeystroke={false}
      />,
    );

    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  // [IMPL-TOOLBAR_COMPONENT] [IMPL-TOOLBAR_CONFIG] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: how: deriveToolbarButton uses keybinding registry first; else toolbars.actions description/icon/label for toolbar-only actions such as view.columns
  it("renders toolbar-only action from actionsMeta without keybinding", () => {
    render(
      <Toolbar
        config={{
          enabled: true,
          position: "top",
          groups: [{ name: "Layout", actions: ["view.columns"] }],
        }}
        onAction={vi.fn()}
        actionsMeta={{
          "view.columns": { description: "Reorder file columns", icon: "columns" },
        }}
      />,
    );

    expect(screen.getByTestId("toolbar-view.columns")).toBeInTheDocument();
  });

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: WorkspaceView useState(false) defaults to compact; expanded renders up to three top tiers with toggle on first visible tier; compact renders single merged Toolbar with showKeystroke=false and singleRow; pane bounds use useElementSize on workspace-area ref
  it("applies singleRow flex-nowrap layout when singleRow is true", () => {
    const { container } = render(
      <Toolbar config={baseConfig} onAction={vi.fn()} singleRow className="toolbar-compact" />,
    );

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toHaveClass("flex-nowrap");
    expect(toolbar).toHaveClass("toolbar-compact");
  });
});
