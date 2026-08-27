// [REQ-ACCESSIBILITY] [REQ-LINKED_PANES] [REQ-TOOLBAR_SYSTEM] [IMPL-LINKED_NAV] [IMPL-TOOLBAR_COMPONENT]
// workspace.ui.linked_navigation + workspace.ui.toolbar_display_cycle — browser-only a11y evidence (binding-inventory e2e_only rows)

import { test, expect } from "@playwright/test";
import {
  ensureComparisonFixture,
  openWorkspaceDeepLink,
} from "./helpers/readme-demo";

test.describe("workspace.ui.linked_navigation [REQ-ACCESSIBILITY] [REQ-LINKED_PANES]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async ({ page }) => {
    ensureComparisonFixture();
    await openWorkspaceDeepLink(page);
  });

  test("keyboard parent navigation keeps linked panes synchronized in browser", async ({
    page,
  }) => {
    await openWorkspaceDeepLink(page, [
      "/tmp/test-dirs/alpha/projects",
      "/tmp/test-dirs/beta/projects",
      "/tmp/test-dirs/gamma/projects",
    ]);
    await page.waitForTimeout(800);

    const linkToggle = page.getByTestId("toolbar-link.toggle");
    await expect(linkToggle).toHaveClass(/bg-blue/);

    await expect(page.getByTestId("pane-0")).toContainText("readme.txt");
    await expect(page.getByTestId("pane-1")).toContainText("readme.txt");

    const pane0 = page.getByTestId("pane-0");
    await pane0.click();
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(1500);

    await expect(pane0).toContainText("projects", { timeout: 10000 });
    await expect(page.getByTestId("pane-1")).toContainText("projects", { timeout: 10000 });
    await expect(page.getByTestId("pane-2")).toContainText("projects", { timeout: 10000 });
  });

  test("linked-mode keybind toggles link.toggle toolbar control via keyboard", async ({
    page,
  }) => {
    const linkToggle = page.getByTestId("toolbar-link.toggle");
    await expect(linkToggle).toHaveClass(/bg-blue/);

    await page.keyboard.press("l");
    await expect(linkToggle).not.toHaveClass(/bg-blue/);

    await page.keyboard.press("l");
    await expect(linkToggle).toHaveClass(/bg-blue/);
  });
});

test.describe("workspace.ui.toolbar_display_cycle [REQ-ACCESSIBILITY] [REQ-TOOLBAR_SYSTEM]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async ({ page }) => {
    ensureComparisonFixture();
    await openWorkspaceDeepLink(page);
  });

  test("toolbar display mode cycles compact → expanded → named → compact in browser DOM", async ({
    page,
  }) => {
    const toggle = page.getByTestId("toolbar-compact-toggle");
    const toolbars = page.locator('[role="toolbar"]');

    await expect(toggle).toHaveAttribute("data-toolbar-display-mode", "compact");
    await expect(toggle).toHaveAttribute("aria-label", "Expand toolbar");
    await expect(toolbars).toHaveCount(1);
    await expect(toolbars.first()).toHaveClass(/toolbar-compact/);

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-toolbar-display-mode", "expanded");
    await expect(toolbars).toHaveCount(3);
    await expect(toolbars.first().getByText("S", { exact: true })).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-toolbar-display-mode", "named");
    await expect(page.locator(".toolbar-named").first()).toBeVisible();
    await expect(page.getByTestId("toolbar-file.copy")).toHaveAttribute(
      "title",
      /Copy marked files.*\(C\)/,
    );

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-toolbar-display-mode", "compact");
    await expect(toolbars).toHaveCount(1);
    await expect(toolbars.first()).toHaveClass(/toolbar-compact/);
    await expect(toolbars.first().getByText("C", { exact: true })).not.toBeVisible();
  });

  test("toolbar compact toggle receives keyboard focus with accessible name", async ({ page }) => {
    const toggle = page.getByTestId("toolbar-compact-toggle");
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Expand toolbar");
  });
});
