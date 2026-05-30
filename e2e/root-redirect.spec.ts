import { test, expect } from "@playwright/test";

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: E2E verifies App Router root redirect to /files (redirect() not unit-testable in Vitest)
test.describe("Root entry redirect [REQ-HOME_PAGE] [IMPL-HOME_PAGE]", () => {
  test("visiting / redirects to file manager", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/files(?:\?|$|#)/);
  });
});
